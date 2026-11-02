/** localStorage-Flag: Diese Person hat das Spiel schon geöffnet. `/` leitet dann direkt zu `/spielen`. */
export const PLAYED_KEY = "sagdoch.played";

export function markPlayed(): void {
  try {
    window.localStorage.setItem(PLAYED_KEY, "1");
  } catch {
    // Privater Modus o. ä.: dann eben wieder die Landingpage, kein Problem.
  }
}
