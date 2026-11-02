"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkDatabaseCompatibility, clearOldDatabase } from "@/lib/db";

/**
 * Erkennt eine zu alte lokale Datenbank und liefert die Daten für das
 * Reset-Modal. `ok` ist true, sobald die Seite normal laden darf.
 */
export function useDbGuard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);

  useEffect(() => {
    let alive = true;
    checkDatabaseCompatibility().then((r) => {
      if (!alive) return;
      setNeedsReset(!r.compatible && r.needsReset);
      setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const confirmReset = useCallback(async () => {
    try {
      await clearOldDatabase();
    } catch (error) {
      console.error("Error clearing database:", error);
    }
    setNeedsReset(false);
    router.push("/setup/players");
  }, [router]);

  return { ok: checked && !needsReset, needsReset, confirmReset };
}
