"use client";

import React from "react";
import { RotateCcw, Sparkles } from "lucide-react";

interface DatabaseResetModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

/** Einmaliger Hinweis, wenn die lokale Datenbank zu alt ist. */
export default function DatabaseResetModal({
  isOpen,
  onConfirm,
}: DatabaseResetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="sd-modal" role="dialog" aria-modal="true">
      <div className="sd-modal-card">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF005C] to-[#00FFC6] rounded-full flex items-center justify-center">
            <Sparkles size={32} color="white" />
          </div>
        </div>

        <h2 className="text-lg font-bold mb-3">App wurde aktualisiert</h2>

        <p className="mb-5 text-sm leading-relaxed text-[#4a4a56]">
          Wir haben das Spiel verbessert. Damit alles richtig funktioniert,
          müssen wir deine Spielerdaten einmal zurücksetzen. Das dauert nur
          einen Moment.
        </p>

        <div className="flex items-center justify-center gap-2 mb-5 text-xs text-[#4a4a56]">
          <RotateCcw size={16} />
          <span>Deine Daten sind sicher.</span>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="sd-next sd-tap"
          style={{ fontSize: 18 }}
        >
          <span>Alles klar</span>
        </button>
      </div>
    </div>
  );
}
