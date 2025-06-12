"use client";

import React from "react";
import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";

interface DatabaseResetModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export default function DatabaseResetModal({
  isOpen,
  onConfirm,
}: DatabaseResetModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF005C] to-[#00FFC6] rounded-full flex items-center justify-center">
            <Sparkles size={32} color="white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-3">
          App wurde aktualisiert! 🎉
        </h2>

        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          Wir haben das Spiel verbessert! Damit alles richtig funktioniert,
          müssen wir deine Spielerdaten einmal zurücksetzen. Das dauert nur
          einen Moment und ist völlig normal.
        </p>

        <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
          <RotateCcw size={16} />
          <span>Keine Sorge - deine Daten sind sicher!</span>
        </div>

        <motion.button
          onClick={onConfirm}
          className="w-full bg-[#FF005C] text-white font-bold py-4 px-6 rounded-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Alles klar, weiter!
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
