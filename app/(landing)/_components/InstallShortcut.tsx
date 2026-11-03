"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { PLAYED_KEY } from "@/lib/played";
import {
  detectPlatform,
  installLabel,
  isMobilePlatform,
  promptInstall,
  useInstallState,
  type Platform,
} from "@/lib/install";
import s from "./landing.module.css";

function usePlatform() {
  const [p, setP] = useState<Platform | null>(null);
  useEffect(() => setP(detectPlatform()), []);
  return p;
}

/** Installiert direkt, wo der Browser das kann, sonst Sprung zur passenden Anleitung. */
function onInstall(canPrompt: boolean) {
  if (canPrompt) void promptInstall();
  else document.getElementById("installieren")?.scrollIntoView({ behavior: "smooth" });
}

/**
 * Zweiter großer Knopf direkt unter „Jetzt spielen“, Text passend zum Gerät
 * („Zum Home-Bildschirm“ in Safari, „App installieren“ auf Android …).
 */
export default function InstallShortcut() {
  const platform = usePlatform();
  const { canPrompt, justInstalled } = useInstallState();
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    try {
      setReturning(!!localStorage.getItem(PLAYED_KEY));
    } catch {}
  }, []);

  const info = platform ? installLabel(platform, canPrompt) : null;
  if (!info || justInstalled) return null;

  // Wer schon gespielt hat, kommt wieder: genau die sollen die App bekommen.
  const hint = returning ? "Du spielst öfter, hol sie dir" : info.hint;
  return (
    <button type="button" className={s.ctaInstall} onClick={() => onInstall(canPrompt)}>
      <Download aria-hidden strokeWidth={2.5} />
      <span>
        {info.label}
        {hint && <small>{hint}</small>}
      </span>
    </button>
  );
}

const BAR_KEY = "sagdoch.installbar.closed";

/**
 * Feste Leiste unten am Handy. Erscheint, sobald der Knopf oben aus dem Bild ist,
 * verschwindet über der Anleitung und dem Schluss-Knopf. Wegklicken gilt für diese Sitzung.
 */
export function InstallBar() {
  const platform = usePlatform();
  const { canPrompt, justInstalled } = useInstallState();
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    try {
      setClosed(sessionStorage.getItem(BAR_KEY) === "1");
    } catch {
      setClosed(false);
    }
    const cta = document.getElementById("start");
    const guide = document.getElementById("installieren");
    const end = document.getElementById("ende");
    if (!cta || !guide || !end) return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting));
      setVisible(!seen.get(cta) && !seen.get(guide) && !seen.get(end));
    });
    io.observe(cta);
    io.observe(guide);
    io.observe(end);
    return () => io.disconnect();
  }, []);

  const info = platform ? installLabel(platform, canPrompt) : null;
  if (!info || !platform || !isMobilePlatform(platform) || justInstalled || closed) return null;

  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(BAR_KEY, "1");
    } catch {}
  };

  return (
    <div className={`${s.bar} ${visible ? s.barOn : ""}`} aria-hidden={!visible}>
      <button
        type="button"
        className={s.barMain}
        tabIndex={visible ? 0 : -1}
        onClick={() => onInstall(canPrompt)}
      >
        <img src="/icons/icon-192x192.png" alt="" width={40} height={40} />
        <span>
          {info.label}
          {info.hint && <small>{info.hint}</small>}
        </span>
      </button>
      <button
        type="button"
        className={s.barClose}
        tabIndex={visible ? 0 : -1}
        aria-label="Hinweis schließen"
        onClick={close}
      >
        <X aria-hidden strokeWidth={2.6} />
      </button>
    </div>
  );
}
