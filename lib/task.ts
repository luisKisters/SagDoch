/**
 * Aufgabe für den nächsten Zug auswählen: Frage + Zielperson + fertig aufgeteilter Text.
 *
 * Löst drei Schwächen der alten Schleife in app/game/task/page.tsx:
 *  - "Zuletzt gestellt" läuft über die inhaltsstabile `uid` statt über autoIncrement-IDs und
 *    führt Runden: erst wenn alle Fragen eines Packs/Typs einmal dran waren, geht es von vorn los
 *    (statt nur die letzten 5 auszuschließen).
 *  - Die Zielperson wird VOR der Frage geprüft. Gibt es für den Spieler niemanden, der zur
 *    Orientierung passt, werden Fragen ohne Ziel gewählt, statt bis zu 10 Mal zu würfeln und am Ende
 *    "(niemand)" im Text zu zeigen.
 *  - Platzhalter werden überall ersetzt (nicht nur der erste) und als Teile zurückgegeben,
 *    sodass die UI Namen als Text rendern kann (kein dangerouslySetInnerHTML mit Spielernamen).
 */
import { getAllPlayers, getQuestionsForPack } from "./db";
import type { Player, Question } from "./db";
import { getRandomTargetPlayer, getTargetPlayers } from "./targeting";

export type TaskPart =
  | { kind: "text"; text: string }
  | { kind: "player"; text: string }
  | { kind: "target"; text: string };

export interface Task {
  question: Question;
  target?: Player;
  /** Text in Teilen, z. B. [text, player, text, target, text]. Namen NIE als HTML einsetzen. */
  parts: TaskPart[];
  /** Derselbe Text ohne Auszeichnung. */
  text: string;
}

const questionKey = (q: Question): string => q.uid ?? `id:${q.id}`;

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

// „er/sie“ & Co. in Fragen mit Zielperson: passend zum Gender der Zielperson auflösen.
// Bei „Divers“ oder unbekanntem Gender bleibt die Doppelform stehen.
const PRONOUNS = /\b(er\/sie|ihn\/sie|ihm\/ihr|seinem\/ihrem|seinen\/ihren|seiner\/ihrer|seine\/ihre|sein\/ihr)\b/gi;

export function resolvePronouns(text: string, targetGender?: string): string {
  const pick =
    targetGender === "Männlich" ? 0 : targetGender === "Weiblich" ? 1 : -1;
  if (pick < 0) return text;
  return text.replace(PRONOUNS, (m) => {
    const word = m.split("/")[pick];
    return m[0] === m[0].toUpperCase()
      ? word[0].toUpperCase() + word.slice(1)
      : word;
  });
}

export function renderTemplate(
  template: string,
  playerName: string,
  targetName?: string,
  targetGender?: string
): TaskPart[] {
  const parts: TaskPart[] = [];
  const hasTarget = template.includes("{targetPlayerName}");
  for (const piece of template.split(/(\{playerName\}|\{targetPlayerName\})/)) {
    if (piece === "") continue;
    if (piece === "{playerName}") parts.push({ kind: "player", text: playerName });
    else if (piece === "{targetPlayerName}")
      parts.push({ kind: "target", text: targetName ?? "jemand" });
    else
      parts.push({
        kind: "text",
        text: hasTarget ? resolvePronouns(piece, targetGender) : piece,
      });
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Auswahl (rein, ohne DB, testbar)
// ---------------------------------------------------------------------------

export interface PickInput {
  /** Alle Fragen des gewählten Packs für den gewählten Typ. */
  pool: Question[];
  /** Spieler, der dran ist. */
  player: Player;
  /** Alle Spieler im Spiel (inkl. `player`). */
  players: Player[];
  /** Schon gestellte Fragen (uid), neueste zuerst. */
  seen: string[];
  /** Zuletzt gewählte Zielpersonen (Spieler-IDs), neueste zuerst. */
  recentTargetIds: number[];
}

export interface PickResult {
  question: Question;
  target?: Player;
  /** true, wenn alle Fragen schon dran waren und eine neue Runde beginnt. */
  newLap: boolean;
}

export function pickTask(input: PickInput): PickResult | undefined {
  const { pool, player, players, seen, recentTargetIds } = input;
  if (pool.length === 0) return undefined;

  const orientationTargets = getTargetPlayers(player, players);
  // Fragen mit Ziel nur, wenn es jemanden gibt, der passt. Sonst nur Fragen ohne Ziel.
  let eligible =
    orientationTargets.length > 0 ? pool : pool.filter((q) => !q.requires_target);
  // Pack besteht nur aus Zielfragen und keiner passt: besser irgendjemand anderes als Abbruch.
  const anyoneElse = players.filter((p) => p.id !== player.id);
  if (eligible.length === 0) eligible = pool;

  const seenSet = new Set(seen);
  const fresh = eligible.filter((q) => !seenSet.has(questionKey(q)));
  const newLap = fresh.length === 0;
  let candidates = fresh;
  if (newLap) {
    // Neue Runde: alles wieder erlaubt, außer direkt die zuletzt gestellte (falls es Alternativen gibt).
    const last = seen[0];
    const withoutLast = eligible.filter((q) => questionKey(q) !== last);
    candidates = withoutLast.length > 0 ? withoutLast : eligible;
  }

  const question = candidates[Math.floor(Math.random() * candidates.length)];

  let target: Player | undefined;
  if (question.requires_target) {
    target =
      getRandomTargetPlayer(player, players, recentTargetIds) ??
      (anyoneElse.length > 0
        ? anyoneElse[Math.floor(Math.random() * anyoneElse.length)]
        : undefined);
  }
  return { question, target, newLap };
}

// ---------------------------------------------------------------------------
// "Zuletzt gestellt" (sessionStorage mit Speicher-Fallback, z. B. privater Modus)
// ---------------------------------------------------------------------------

const SEEN_PREFIX = "sagdoch.seen:";
const TARGETS_KEY = "sagdoch.recentTargets";
const RECENT_TARGET_LIMIT = 5;
const memory = new Map<string, string>();

function readList<T>(key: string): T[] {
  let raw: string | null | undefined;
  try {
    raw = sessionStorage.getItem(key);
  } catch {
    raw = memory.get(key);
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return []; // kaputter Eintrag blockiert nie das Spiel
  }
}

function writeList(key: string, list: unknown[]): void {
  const raw = JSON.stringify(list);
  memory.set(key, raw);
  try {
    sessionStorage.setItem(key, raw);
  } catch {
    // Speicher voll oder nicht verfügbar: Fallback im Speicher reicht für diese Sitzung.
  }
}

const seenKey = (packName: string, type: string) =>
  `${SEEN_PREFIX}${packName}|${type}`;

export function recordShown(
  packName: string,
  type: "truth" | "dare",
  result: PickResult
): void {
  const key = seenKey(packName, type);
  const previous = result.newLap ? [] : readList<string>(key);
  const id = questionKey(result.question);
  writeList(key, [id, ...previous.filter((x) => x !== id)]);

  if (result.question.requires_target && result.target?.id != null) {
    const targetId = result.target.id;
    const ids = readList<number>(TARGETS_KEY);
    writeList(
      TARGETS_KEY,
      [targetId, ...ids.filter((x) => x !== targetId)].slice(0, RECENT_TARGET_LIMIT)
    );
  }
}

/** Neues Spiel: Verlauf löschen. */
export function resetShownHistory(): void {
  try {
    const drop: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith(SEEN_PREFIX) || k === TARGETS_KEY)) drop.push(k);
    }
    drop.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
  memory.clear();
}

// ---------------------------------------------------------------------------
// Alles zusammen
// ---------------------------------------------------------------------------

/**
 * Wählt die nächste Aufgabe, merkt sie als gestellt und liefert den fertigen Text.
 * Ein erneuter Aufruf für denselben Zug ("Andere Frage") liefert eine andere Frage.
 * @returns undefined, wenn das Pack keine Fragen dieses Typs hat.
 */
export async function getNextTask(args: {
  packName: string;
  type: "truth" | "dare";
  player: Player;
  /** Optional: sonst werden alle Spieler aus der DB gelesen. */
  players?: Player[];
}): Promise<Task | undefined> {
  const { packName, type, player } = args;
  const [pool, players] = await Promise.all([
    getQuestionsForPack(packName, type),
    args.players ?? getAllPlayers(),
  ]);

  const result = pickTask({
    pool,
    player,
    players,
    seen: readList<string>(seenKey(packName, type)),
    recentTargetIds: readList<number>(TARGETS_KEY),
  });
  if (!result) return undefined;

  recordShown(packName, type, result);
  const parts = renderTemplate(
    result.question.text_template,
    player.name,
    result.target?.name,
    result.target?.gender
  );
  return {
    question: result.question,
    target: result.target,
    parts,
    text: parts.map((p) => p.text).join(""),
  };
}
