"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Dice3 } from "lucide-react";
import { useFitText } from "./useFitText";

export interface NextProps {
  label: string;
  onClick?: () => void;
  href?: string;
  /** Disabled = 35 % Deckkraft. Tippen löst trotzdem `onBlocked` aus (Erklärung per Toast). */
  disabled?: boolean;
  onBlocked?: () => void;
  /** "arrow" (Standard) oder "dice" (Zufall, ersetzt den Pfeil) */
  icon?: "arrow" | "dice";
}

/** Der Weiter-Knopf. Sitzt nur im Mittelband, pink, volle Spaltenbreite. */
export default function NextButton({
  label,
  onClick,
  href,
  disabled,
  onBlocked,
  icon = "arrow",
}: NextProps) {
  const ref = useRef<HTMLElement>(null);
  useFitText(ref, [label]);

  const content = (
    <>
      {icon === "dice" && <Dice3 strokeWidth={2.2} aria-hidden />}
      <span>{label}</span>
      {icon === "arrow" && <ArrowRight strokeWidth={2.8} aria-hidden />}
    </>
  );
  const common = {
    className: "sd-next sd-tap",
    "data-slot": "next",
    "aria-disabled": disabled || undefined,
  } as const;

  if (href && !disabled) {
    return (
      <Link
        {...common}
        href={href}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      {...common}
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      onClick={disabled ? onBlocked : onClick}
    >
      {content}
    </button>
  );
}
