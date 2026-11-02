"use client";

import React from "react";
import type { Pack } from "@/lib/db";
import { TYPE_LABEL } from "@/app/_game/game";

export function PackPills({ pack }: { pack: Pack }) {
  return (
    <div className="sd-pills">
      {pack.is_18_plus && <span className="sd-pill is-adult">18+</span>}
      <span className="sd-pill">{TYPE_LABEL[pack.type]}</span>
    </div>
  );
}

interface PackCardProps {
  pack: Pack;
  selected: boolean;
  onSelect: () => void;
}

/** Eine Pack-Zeile in der Mint-Liste. Alle Packs sind frei. */
export default function PackCard({ pack, selected, onSelect }: PackCardProps) {
  return (
    <button
      type="button"
      className={`sd-pcard sd-tap${selected ? " is-on" : ""}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="sd-n">{pack.name}</div>
      <div className="sd-d">{pack.description}</div>
      <PackPills pack={pack} />
    </button>
  );
}
