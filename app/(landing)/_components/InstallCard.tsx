"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  Check,
  Copy,
  Download,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Menu,
  MonitorDown,
  Share,
  SquarePlus,
} from "lucide-react";
import InstallSteps from "./InstallSteps";
import { detectPlatform, promptInstall, useInstallState, type Platform } from "@/lib/install";
import s from "./landing.module.css";

type Icon = ComponentType<{ "aria-hidden"?: boolean }>;
type Step = { icon: Icon; text: ReactNode };
type Guide = {
  title: string;
  intro?: ReactNode;
  steps?: Step[];
  /** Zusätzlicher Knopf unter den Schritten. */
  action?: "prompt" | "copy" | "chrome-intent";
};

function safariMajor(): number {
  return Number(navigator.userAgent.match(/Version\/(\d+)/)?.[1] ?? 0);
}

function guideFor(p: Platform, canPrompt: boolean): Guide | null {
  switch (p.kind) {
    case "installed":
      return null;

    case "inapp": {
      const where = p.app === "dieser App" ? "dieser App" : p.app;
      if (p.os === "android") {
        return {
          title: "Erst im Browser öffnen",
          intro: <>In {where} lässt sich nichts installieren. Öffne SagDoch in Chrome, dort geht es sofort.</>,
          steps: [
            { icon: EllipsisVertical, text: <>Menü oben rechts, dann <b>„Im Browser öffnen“</b>.</> },
            { icon: Download, text: <>In Chrome dann <b>„App installieren“</b>.</> },
          ],
          action: "chrome-intent",
        };
      }
      return {
        title: "Erst in Safari öffnen",
        intro: <>In {where} lässt sich nichts installieren. Öffne SagDoch in Safari, dort kommt es auf den Home-Bildschirm.</>,
        steps: [
          { icon: Ellipsis, text: <>Menü (⋯ oder Kompass-Symbol), dann <b>„In Safari öffnen“</b>. Oder Link kopieren und in Safari einfügen.</> },
          { icon: Share, text: <>In Safari: Teilen, dann <b>„Zum Home-Bildschirm“</b>.</> },
        ],
        action: "copy",
      };
    }

    case "ios-safari": {
      // Safari 26 versteckt Teilen hinter ⋯ und fragt „Als Web-App öffnen“.
      const v26 = safariMajor() >= 26;
      return {
        title: "Auf deinen Home-Bildschirm",
        intro: <>Kurz über Teilen in Safari, danach startet SagDoch wie eine App: eigenes Icon, Vollbild, keine Adressleiste.</>,
        steps: [
          v26
            ? { icon: Ellipsis, text: <>Unten auf <b>⋯</b> tippen, dann auf <b>„Teilen“</b>.</> }
            : { icon: Share, text: <>Unten auf das <b>Teilen-Symbol</b> tippen (Quadrat mit Pfeil).</> },
          { icon: SquarePlus, text: <>Etwas runterscrollen, <b>„Zum Home-Bildschirm“</b> wählen.</> },
          {
            icon: Check,
            text: v26
              ? <><b>„Als Web-App öffnen“</b> anlassen, dann <b>„Hinzufügen“</b>.</>
              : <>Oben rechts auf <b>„Hinzufügen“</b>.</>,
          },
        ],
      };
    }

    case "ios-browser": {
      if (!p.canAdd) {
        return {
          title: "In Safari installieren",
          intro: <>Auf deinem iOS geht das nur in Safari. Link kopieren, in Safari öffnen, dann Teilen und <b>„Zum Home-Bildschirm“</b>.</>,
          action: "copy",
        };
      }
      const share: Record<string, ReactNode> = {
        Chrome: <>Oben rechts in der Adressleiste auf das <b>Teilen-Symbol</b> tippen.</>,
        Firefox: <>Unten rechts auf <b>Menü ☰</b>, dann <b>„Teilen“</b>.</>,
        Edge: <>Unten auf <b>⋯</b>, dann <b>„Teilen“</b>.</>,
      };
      return {
        title: "Auf deinen Home-Bildschirm",
        intro: <>Geht auch direkt in {p.browser}. Danach startet SagDoch wie eine App.</>,
        steps: [
          { icon: p.browser === "Firefox" ? Menu : Share, text: share[p.browser] ?? <>Im Menü auf <b>„Teilen“</b> tippen.</> },
          { icon: SquarePlus, text: <><b>„Zum Home-Bildschirm“</b> wählen.</> },
          { icon: Check, text: <>Mit <b>„Hinzufügen“</b> bestätigen.</> },
        ],
      };
    }

    case "android-chrome":
      return canPrompt
        ? { title: "Als App installieren", intro: <>Installieren, dann liegt SagDoch bei deinen Apps. Startet im Vollbild, ohne Adressleiste.</>, action: "prompt" }
        : {
            title: "Als App installieren",
            intro: <>Danach liegt SagDoch bei deinen Apps und startet im Vollbild.</>,
            steps: [
              { icon: EllipsisVertical, text: <>Oben rechts auf <b>⋮</b> tippen.</> },
              { icon: Download, text: <><b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b>.</> },
              { icon: Check, text: <>Mit <b>„Installieren“</b> bestätigen.</> },
            ],
          };

    case "android-samsung":
      return canPrompt
        ? { title: "Als App installieren", intro: <>Installieren, dann liegt SagDoch bei deinen Apps.</>, action: "prompt" }
        : {
            title: "Als App installieren",
            steps: [
              { icon: Menu, text: <>Unten rechts auf <b>Menü ☰</b>.</> },
              { icon: SquarePlus, text: <><b>„Seite hinzufügen zu“</b>, dann <b>„Startbildschirm“</b>.</> },
            ],
          };

    case "android-firefox":
      return {
        title: "Als App installieren",
        steps: [
          { icon: EllipsisVertical, text: <>Auf <b>⋮</b> tippen.</> },
          { icon: Download, text: <><b>„Installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b>.</> },
        ],
      };

    case "android-other":
      return canPrompt
        ? { title: "Als App installieren", intro: <>Installieren, dann liegt SagDoch bei deinen Apps.</>, action: "prompt" }
        : {
            title: "Als App installieren",
            intro: <>Im Menü von {p.browser} nach <b>„Zum Startbildschirm“</b> oder <b>„App installieren“</b> suchen. Am einfachsten geht es in Chrome.</>,
            action: "chrome-intent",
          };

    case "desktop-chromium":
      return canPrompt
        ? { title: `In ${p.browser} installieren`, intro: <>Eigenes Fenster, eigenes Icon im Dock bzw. in der Taskleiste.</>, action: "prompt" }
        : {
            title: `In ${p.browser} installieren`,
            steps: [
              { icon: MonitorDown, text: <>Rechts in der Adressleiste auf das <b>Installieren-Symbol</b> klicken.</> },
              {
                icon: EllipsisVertical,
                text: p.browser === "Edge"
                  ? <>Oder: Menü <b>⋯</b>, <b>„Apps“</b>, <b>„Diese Website als App installieren“</b>.</>
                  : <>Oder: Menü <b>⋮</b>, <b>„Streamen, speichern und teilen“</b>, <b>„Seite als App installieren“</b>.</>,
              },
            ],
            action: "copy",
          };

    case "mac-safari":
      return p.canAdd
        ? {
            title: "Ins Dock legen",
            intro: <>Safari macht aus SagDoch eine eigene App im Dock.</>,
            steps: [
              { icon: Share, text: <>Menü <b>„Ablage“</b> oder Teilen-Symbol in der Symbolleiste.</> },
              { icon: SquarePlus, text: <><b>„Zum Dock hinzufügen …“</b> wählen, dann <b>„Hinzufügen“</b>.</> },
            ],
            action: "copy",
          }
        : {
            title: "Am besten aufs Handy",
            intro: <>Dein Safari kann noch keine Web-Apps (ab macOS Sonoma). SagDoch ist sowieso fürs Handy gemacht: Link kopieren und dir selbst schicken.</>,
            action: "copy",
          };

    case "desktop-firefox":
      return {
        title: "Am besten aufs Handy",
        intro: <>Firefox am Computer kann keine Web-Apps installieren. Spiel einfach hier im Browser, oder schick dir den Link aufs Handy und installier es dort.</>,
        action: "copy",
      };

    default:
      return null;
  }
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const url = typeof location !== "undefined" ? location.origin : "";

  const onClick = async () => {
    try {
      if (canShare) {
        await navigator.share({ title: "SagDoch", text: "Wahrheit oder Pflicht fürs Handy", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abgebrochen oder kein Zugriff, nichts zu tun.
    }
  };

  return (
    <button type="button" className={s.ghost} onClick={onClick}>
      {copied ? <Check aria-hidden /> : canShare ? <Share aria-hidden /> : <Copy aria-hidden />}
      <span>{copied ? "Link kopiert" : canShare ? "Link teilen" : "Link kopieren"}</span>
    </button>
  );
}

function ChromeIntent() {
  const href =
    typeof location !== "undefined"
      ? `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
      : "#";
  return (
    <a href={href} className={s.ghost}>
      <ExternalLink aria-hidden />
      <span>In Chrome öffnen</span>
    </a>
  );
}

export function InstallButton({ label = "Jetzt installieren" }: { label?: string }) {
  return (
    <button type="button" className={s.install} onClick={() => void promptInstall()}>
      <Download aria-hidden strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}

/**
 * Zeigt genau die Anleitung für das Gerät und den Browser, in dem die Seite gerade offen ist.
 * Vor der Hydration (und bei unbekannten Browsern) die allgemeine Liste.
 */
export default function InstallCard() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const { canPrompt, justInstalled } = useInstallState();

  useEffect(() => setPlatform(detectPlatform()), []);

  if (platform?.kind === "installed" || justInstalled) {
    return (
      <div className={s.installDone}>
        <Check aria-hidden />
        <span>
          Installiert.
          <small>SagDoch liegt jetzt bei deinen Apps. Ab jetzt einfach dort starten.</small>
        </span>
      </div>
    );
  }

  const guide = platform ? guideFor(platform, canPrompt) : null;
  if (!guide) {
    return (
      <>
        <h2 className={s.h2}>Als App installieren</h2>
        <p className={s.sectionNote}>
          Installiert startet SagDoch mit eigenem Icon und ohne Adressleiste, wie eine normale App.
          Ein Store ist nicht nötig.
        </p>
        <InstallSteps />
      </>
    );
  }

  return (
    <>
      <h2 className={s.h2}>{guide.title}</h2>
      {guide.intro && <p className={s.sectionNote}>{guide.intro}</p>}
      {guide.steps && (
        <ol className={s.steps}>
          {guide.steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className={`${s.row} ${s.rowGlass}`}>
              <span className={s.stepNum} aria-hidden>{i + 1}</span>
              <span className={s.step}>{text}</span>
              <Icon aria-hidden />
            </li>
          ))}
        </ol>
      )}
      {guide.action && (
        <div className={s.installActions}>
          {guide.action === "prompt" && <InstallButton />}
          {guide.action === "copy" && <CopyLink />}
          {guide.action === "chrome-intent" && <ChromeIntent />}
        </div>
      )}
      <details className={s.otherDevices}>
        <summary>Andere Geräte</summary>
        <InstallSteps />
      </details>
    </>
  );
}
