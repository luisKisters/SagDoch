"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import type { Player } from "@/lib/db";
import { GENDERS, GENDER_SHORT, SEXUALITIES } from "@/app/_game/game";

export type PickField = "gender" | "sexuality";

interface PlayerRowProps {
  player: Player;
  /** Welche Auswahl unter dem Namen aufgeklappt ist */
  open: PickField | null;
  isNew?: boolean;
  onToggle: (field: PickField) => void;
  onPick: (field: PickField, value: string) => void;
  onDelete: () => void;
}

/** Spielerzeile mit Inline-Auswahl. Nichts vorausgewählt, nie durchschalten. */
export default function PlayerRow({
  player,
  open,
  isNew,
  onToggle,
  onPick,
  onDelete,
}: PlayerRowProps) {
  const tag = (field: PickField) => {
    const value = player[field];
    const unset = !value;
    const label =
      field === "gender"
        ? value
          ? GENDER_SHORT[value] ?? value
          : "Gender wählen"
        : value || "Steht auf…";
    return (
      <button
        type="button"
        className={`sd-tg sd-tap${unset ? " is-unset" : ""}${
          open === field ? " is-open" : ""
        }`}
        aria-expanded={open === field}
        onClick={() => onToggle(field)}
      >
        {label}
      </button>
    );
  };

  const options = open === "gender" ? GENDERS : SEXUALITIES;

  return (
    <div className={`sd-prow${isNew ? " sd-new" : ""}`}>
      <div className="sd-row">
        <span className="sd-n">{player.name}</span>
        {tag("gender")}
        {tag("sexuality")}
        <button
          type="button"
          className="sd-ib sd-tap"
          aria-label={`${player.name} entfernen`}
          onClick={onDelete}
        >
          <Trash2 strokeWidth={2} aria-hidden />
        </button>
      </div>
      {open && (
        <div className="sd-pick">
          <div className="sd-pick-lbl">
            {open === "gender"
              ? `${player.name} ist…`
              : `${player.name} steht auf…`}
          </div>
          <div className="sd-chips">
            {options.map((v) => (
              <button
                key={v}
                type="button"
                className={`sd-chip sd-tap${player[open] === v ? " is-on" : ""}`}
                aria-pressed={player[open] === v}
                onClick={() => onPick(open, v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
