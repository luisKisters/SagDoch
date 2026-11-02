"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Pause } from "lucide-react";
import NextButton, { NextProps } from "./NextButton";
import { useFitText } from "./useFitText";

export interface BackProps {
  /** Zielroute (Link) oder Handler */
  href?: string;
  onClick?: () => void;
  /** "pause" im Spiel, sonst Pfeil */
  icon?: "back" | "pause";
  label: string;
}

interface ThreeBandProps {
  /** `null` = unsichtbarer Platzhalter (Start), Titel bleibt an seiner Stelle */
  back: BackProps | null;
  title: string;
  /** Wer-ist-dran-Titel ist etwas größer */
  titleSize?: number;
  /** Ref auf den Titeltext (Ziel für die Namens-Flugbahn) */
  titleRef?: React.Ref<HTMLSpanElement>;
  titleHidden?: boolean;
  /** Pink, oben: worum es geht */
  top: React.ReactNode;
  /** Mint, unten: was du tust */
  bottom: React.ReactNode;
  /** Mittelband. `null` blendet den Knopf aus (Band bleibt) */
  next: NextProps | null;
  /** Wer-ist-dran: Auswahl-Inhalte ausblenden, solange der Reveal läuft */
  hold?: boolean;
  /** Vollflächiger Overlay (Reveal) */
  overlay?: React.ReactNode;
  toast?: string | null;
  /** Für Tests/Messung */
  screen?: string;
}

function Header({
  back,
  title,
  titleSize,
  titleRef,
  titleHidden,
}: Pick<
  ThreeBandProps,
  "back" | "title" | "titleSize" | "titleRef" | "titleHidden"
>) {
  const titleEl = useRef<HTMLDivElement>(null);
  useFitText(titleEl, [title, titleSize]);

  let backEl: React.ReactNode;
  if (!back) {
    backEl = <span className="sd-back is-none" aria-hidden />;
  } else {
    const Icon = back.icon === "pause" ? Pause : ArrowLeft;
    const icon =
      back.icon === "pause" ? (
        <Icon fill="currentColor" strokeWidth={0} aria-hidden />
      ) : (
        <Icon strokeWidth={2.6} aria-hidden />
      );
    backEl = back.href ? (
      <Link
        href={back.href}
        className="sd-back sd-tap"
        data-slot="back"
        aria-label={back.label}
        onClick={back.onClick}
      >
        {icon}
      </Link>
    ) : (
      <button
        type="button"
        className="sd-back sd-tap"
        data-slot="back"
        aria-label={back.label}
        onClick={back.onClick}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className="sd-header">
      {backEl}
      <h1
        ref={titleEl}
        className="sd-title sd-sh"
        data-slot="title"
        style={{ ["--ts" as string]: `${titleSize ?? 26}px` }}
      >
        <span
          ref={titleRef}
          style={titleHidden ? { visibility: "hidden" } : undefined}
        >
          {title}
        </span>
      </h1>
    </div>
  );
}

/**
 * Das gemeinsame Drei-Band-Layout (A · Weiter in der Mitte).
 * Pink oben, Nachtband mit Weiter in der Mitte, Mint unten.
 * Zurück, Titel und Weiter sitzen auf jedem Screen an derselben Stelle.
 */
export default function ThreeBand({
  back,
  title,
  titleSize,
  titleRef,
  titleHidden,
  top,
  bottom,
  next,
  hold,
  overlay,
  toast,
  screen,
}: ThreeBandProps) {
  return (
    <div className="sd-app" data-screen={screen}>
      <div className={`sd-main sd-enter${hold ? " sd-hold" : ""}`}>
        <div className="sd-zone sd-top">
          <div className="sd-col">
            <Header
              back={back}
              title={title}
              titleSize={titleSize}
              titleRef={titleRef}
              titleHidden={titleHidden}
            />
            {top}
          </div>
        </div>
        <div className="sd-zone sd-mid">
          <div className="sd-col">{next && <NextButton {...next} />}</div>
          {toast && (
            <div className="sd-toast" role="status">
              {toast}
            </div>
          )}
        </div>
        <div className="sd-zone sd-bot">
          <div className="sd-col">{bottom}</div>
        </div>
      </div>
      {overlay}
    </div>
  );
}
