"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}

/** Die eine Nebenaktions-Zeile: Icon, Text, Chevron. „Spiel beenden“ rot. */
export default function ActionRow({
  icon,
  label,
  onClick,
  href,
  danger,
}: ActionRowProps) {
  const cls = `sd-arow sd-tap${danger ? " is-danger" : ""}`;
  const inner = (
    <>
      {icon}
      <span>{label}</span>
      <ChevronRight className="sd-chev" strokeWidth={2.6} aria-hidden />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} data-slot="action" onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} data-slot="action" onClick={onClick}>
      {inner}
    </button>
  );
}
