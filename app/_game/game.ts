import { GameTask, Pack, Player } from "@/lib/db";
import { getNextTask } from "@/lib/task";

/** Alphabetisch, damit keine Option „die Standardoption“ ist. */
export const GENDERS = ["Divers", "Männlich", "Weiblich"] as const;
export const SEXUALITIES = ["Ace", "Bi", "Hetero", "Homo", "Pan"] as const;

export const GENDER_SHORT: Record<string, string> = {
  Männlich: "♂ M",
  Weiblich: "♀ W",
  Divers: "⚧ D",
};

export type TaskType = "truth" | "dare";

export const TYPE_LABEL: Record<Pack["type"], string> = {
  truth_and_dare: "Wahrheit & Pflicht",
  only_truth: "Nur Wahrheit",
  only_dare: "Nur Pflicht",
};

/** Ein:e Spieler:in ist fertig eingestellt, wenn beides bewusst gewählt wurde. */
export const hasProfile = (p: Player) => !!p.gender && !!p.sexuality;

export const isReady = (players: Player[]) =>
  players.length >= 2 && players.every(hasProfile);

export const notReadyMessage = (players: Player[]) =>
  players.length < 2
    ? "Mindestens 2 Leute"
    : "Bei allen Gender und Orientierung einstellen";

export const roundOf = (turnsPlayed: number, playerCount: number) =>
  Math.floor(turnsPlayed / Math.max(1, playerCount)) + 1;

/** Nächste Person in Reihenfolge der Anlage; fällt auf die erste zurück. */
export function nextPlayerAfter(players: Player[], currentId: number | null) {
  if (players.length === 0) return null;
  const i = players.findIndex((p) => p.id === currentId);
  return players[(i + 1) % players.length];
}

export const typesFor = (pack?: Pack): TaskType[] =>
  pack?.type === "only_truth"
    ? ["truth"]
    : pack?.type === "only_dare"
    ? ["dare"]
    : ["truth", "dare"];

/**
 * Zieht Frage und (falls nötig) Zielperson über lib/task.ts. Gibt den
 * Spielstand-Eintrag zurück oder null, wenn das Pack keine Frage dieses Typs hat.
 */
export async function drawTask(
  player: Player,
  players: Player[],
  packName: string,
  type: TaskType
): Promise<GameTask | null> {
  const task = await getNextTask({ packName, type, player, players });
  if (!task) return null;
  return {
    type,
    text_template: task.question.text_template,
    requires_target: !!task.question.requires_target,
    target_player_id: task.target?.id ?? null,
  };
}
