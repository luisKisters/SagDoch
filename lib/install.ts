"use client";

import { useSyncExternalStore } from "react";

/**
 * Erkennt, wo die Seite gerade läuft, damit die Landingpage genau die passende Installieranleitung
 * zeigt. Reines UA-Sniffing, weil Browser kein „kann ich installieren?“ verraten (außer Chromium per
 * beforeinstallprompt, das kommt zusätzlich über den Store unten).
 */
export type Platform =
  | { kind: "installed" }
  | { kind: "inapp"; app: string; os: "ios" | "android" | "other" }
  | { kind: "ios-safari" }
  | { kind: "ios-browser"; browser: string; canAdd: boolean }
  | { kind: "android-chrome" }
  | { kind: "android-samsung" }
  | { kind: "android-firefox" }
  | { kind: "android-other"; browser: string }
  | { kind: "mac-safari"; canAdd: boolean }
  | { kind: "desktop-chromium"; browser: string }
  | { kind: "desktop-firefox" }
  | { kind: "other" };

const IN_APP: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, "Facebook"],
  [/musical_ly|TikTok|BytedanceWebview|trill/i, "TikTok"],
  [/Snapchat/i, "Snapchat"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Pinterest/i, "Pinterest"],
  [/Twitter|TwitterAndroid/i, "X"],
  [/\bLine\//i, "LINE"],
  [/Telegram/i, "Telegram"],
  [/WhatsApp/i, "WhatsApp"],
  [/GSA\//i, "der Google-App"],
];

function iosVersion(ua: string): number {
  const m = ua.match(/OS (\d+)[_.](\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 100 : 0;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function detectPlatform(): Platform {
  if (isStandalone()) return { kind: "installed" };

  const ua = navigator.userAgent;
  // iPadOS meldet sich als Mac, hat aber Touch.
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);

  const inApp = IN_APP.find(([re]) => re.test(ua));
  // Android-WebViews ohne bekannten App-Namen: „; wv)“ im UA.
  if (inApp || (android && /; wv\)/.test(ua))) {
    return {
      kind: "inapp",
      app: inApp?.[1] ?? "dieser App",
      os: ios ? "ios" : android ? "android" : "other",
    };
  }

  if (ios) {
    // Ab iOS 16.4 können auch Chrome, Firefox und Edge über „Teilen“ zum Home-Bildschirm hinzufügen.
    const canAdd = iosVersion(ua) >= 16.4;
    if (/CriOS/.test(ua)) return { kind: "ios-browser", browser: "Chrome", canAdd };
    if (/FxiOS/.test(ua)) return { kind: "ios-browser", browser: "Firefox", canAdd };
    if (/EdgiOS/.test(ua)) return { kind: "ios-browser", browser: "Edge", canAdd };
    if (/OPiOS|OPT\//.test(ua)) return { kind: "ios-browser", browser: "Opera", canAdd };
    if (/DuckDuckGo/.test(ua)) return { kind: "ios-browser", browser: "DuckDuckGo", canAdd };
    return { kind: "ios-safari" };
  }

  if (android) {
    if (/SamsungBrowser/.test(ua)) return { kind: "android-samsung" };
    if (/Firefox/.test(ua)) return { kind: "android-firefox" };
    if (/EdgA/.test(ua)) return { kind: "android-other", browser: "Edge" };
    if (/OPR|Opera/.test(ua)) return { kind: "android-other", browser: "Opera" };
    if (/Chrome/.test(ua)) return { kind: "android-chrome" };
    return { kind: "android-other", browser: "deinem Browser" };
  }

  if (/Firefox/.test(ua)) return { kind: "desktop-firefox" };
  if (/Edg\//.test(ua)) return { kind: "desktop-chromium", browser: "Edge" };
  if (/OPR\//.test(ua)) return { kind: "desktop-chromium", browser: "Opera" };
  if (/Chrome|Chromium/.test(ua)) return { kind: "desktop-chromium", browser: "Chrome" };
  if (/Macintosh/.test(ua) && /Safari/.test(ua)) {
    // „Zum Dock hinzufügen“ gibt es ab Safari 17 (macOS Sonoma).
    const v = Number(ua.match(/Version\/(\d+)/)?.[1] ?? 0);
    return { kind: "mac-safari", canAdd: v >= 17 };
  }
  return { kind: "other" };
}

/* ---------- Natives Installieren (Chromium: Android, Windows, macOS, ChromeOS) ---------- */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    /** Vom Inline-Skript im Landing-Layout abgefangen, bevor React läuft. */
    __sdInstall?: InstallPromptEvent | null;
    __sdInstalled?: boolean;
  }
}

export type InstallState = {
  /** Browser bietet einen echten Installieren-Dialog an. */
  canPrompt: boolean;
  /** Gerade installiert (appinstalled), Seite läuft aber noch im Browser. */
  justInstalled: boolean;
};

const SERVER_STATE: InstallState = { canPrompt: false, justInstalled: false };
let state: InstallState = SERVER_STATE;
const listeners = new Set<() => void>();

function sync() {
  const next: InstallState = {
    canPrompt: !!window.__sdInstall,
    justInstalled: !!window.__sdInstalled,
  };
  if (next.canPrompt !== state.canPrompt || next.justInstalled !== state.justInstalled) {
    state = next;
    listeners.forEach((l) => l());
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) {
    window.addEventListener("sd-install-change", sync);
    sync();
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("sd-install-change", sync);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Öffnet den nativen Dialog. true, wenn die Person installiert hat. */
export async function promptInstall(): Promise<boolean> {
  const ev = window.__sdInstall;
  if (!ev) return false;
  window.__sdInstall = null;
  sync();
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  return outcome === "accepted";
}

/** Kurzer Knopftext plus Mini-Hinweis, passend zu Gerät und Browser. */
export function installLabel(
  p: Platform,
  canPrompt: boolean,
): { label: string; hint?: string } | null {
  if (p.kind === "installed") return null;
  if (canPrompt) return { label: "App installieren", hint: "Direkt hier, kein Store" };
  switch (p.kind) {
    case "ios-safari":
      return { label: "Zum Home-Bildschirm", hint: "Über Teilen in Safari, kein Store" };
    case "ios-browser":
      return p.canAdd
        ? { label: "Zum Home-Bildschirm", hint: `Geht direkt in ${p.browser}` }
        : { label: "Als App holen", hint: "Geht über Safari" };
    case "inapp":
      return { label: "Als App holen", hint: p.os === "android" ? "Erst in Chrome öffnen" : "Erst in Safari öffnen" };
    case "android-chrome":
    case "android-samsung":
    case "android-firefox":
    case "android-other":
      return { label: "App installieren", hint: "Kein Store nötig" };
    case "mac-safari":
      return p.canAdd ? { label: "Ins Dock legen", hint: "Eigene App, kein Store" } : { label: "Aufs Handy holen" };
    case "desktop-chromium":
      return { label: "Als App installieren", hint: "Eigenes Fenster, kein Store" };
    case "desktop-firefox":
      return { label: "Aufs Handy holen", hint: "Link schicken, dort installieren" };
    default:
      return null;
  }
}

export function isMobilePlatform(p: Platform): boolean {
  return /^(ios|android|inapp)/.test(p.kind);
}
