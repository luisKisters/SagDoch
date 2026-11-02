/**
 * Prüft die Aufgaben-Auswahl (lib/task.ts) mit dem echten Inhalt aus data/*.csv.
 *   pnpm exec tsx scripts/test-task.ts
 */
import assert from "node:assert/strict";
import { buildContent } from "./content";
import { pickTask, renderTemplate } from "../lib/task";
import type { Player, Question } from "../lib/db";

const origLog = console.log;
console.log = () => {}; // lib/targeting loggt jede Wahl
const { content, errors } = buildContent();
assert.equal(errors.length, 0, errors.join("\n"));

const pool = (pack: string, type: "truth" | "dare"): Question[] =>
  content.questions
    .filter((q) => q.pack_name === pack && q.type === type)
    .map((q, i) => ({ ...q, id: i + 1 }));

let nextId = 1;
const P = (name: string, gender: string, sexuality: string): Player => ({
  id: nextId++, name, gender, sexuality, timestamp_added: new Date(),
});

let checks = 0;
const ok = (cond: unknown, msg: string) => { checks++; assert.ok(cond, msg); };

// 1. Keine Wiederholung innerhalb einer Runde, danach neue Runde, nie zweimal hintereinander dasselbe
{
  const players = [P("Anna", "Weiblich", "Hetero"), P("Ben", "Männlich", "Hetero"), P("Cem", "Männlich", "Bi")];
  const qs = pool("Entspannt", "truth");
  let seen: string[] = [];
  let lapStart = 0;
  let laps = 0;
  for (let i = 0; i < qs.length * 3; i++) {
    const r = pickTask({ pool: qs, player: players[i % 3], players, seen, recentTargetIds: [] })!;
    const key = r.question.uid!;
    if (r.newLap) { laps++; lapStart = i; seen = []; }
    ok(!seen.includes(key), `Wiederholung in Runde bei Zug ${i}`);
    if (i > 0) ok(seen[0] !== key || qs.length === 1, "direkt hintereinander gleich");
    seen = [key, ...seen];
    if (i - lapStart >= qs.length) assert.fail("Runde länger als Pool");
  }
  ok(laps >= 2, `erwartet >=2 neue Runden, war ${laps}`);
}

// 2. Niemand passt zur Orientierung: nie eine Zielfrage, kein "(niemand)"
{
  const players = [P("Hans", "Männlich", "Hetero"), P("Karl", "Männlich", "Hetero")]; // Hetero-Mann, nur Männer
  const qs = pool("Spicy (18+)", "truth");
  ok(qs.some((q) => q.requires_target), "Testdaten haben Zielfragen");
  for (let i = 0; i < 2000; i++) {
    const r = pickTask({ pool: qs, player: players[0], players, seen: [], recentTargetIds: [] })!;
    ok(!r.question.requires_target, "Zielfrage ohne passende Zielperson");
  }
}

// 3. Mit passender Zielperson: Ziel gesetzt, nie man selbst, passt zur Orientierung
{
  const a = P("Anna", "Weiblich", "Hetero");
  const players = [a, P("Ben", "Männlich", "Hetero"), P("Cem", "Männlich", "Bi"), P("Dana", "Weiblich", "Homo")];
  const qs = pool("Bisschen Spicy", "dare");
  let withTarget = 0;
  for (let i = 0; i < 2000; i++) {
    const r = pickTask({ pool: qs, player: a, players, seen: [], recentTargetIds: [] })!;
    if (r.question.requires_target) {
      withTarget++;
      ok(r.target, "Zielfrage ohne Ziel");
      ok(r.target!.id !== a.id, "Ziel ist der Spieler selbst");
      ok(["Ben", "Cem"].includes(r.target!.name), `Anna (Hetero) darf nicht auf ${r.target!.name}`);
    }
  }
  ok(withTarget > 0, "Zielfragen kommen vor");
}

// 4. Letzte Zielpersonen werden gemieden, solange es Alternativen gibt
{
  const a = P("Anna", "Weiblich", "Pan");
  const b = P("Ben", "Männlich", "Pan"), c = P("Cem", "Männlich", "Pan");
  const qs = pool("Entspannt", "dare").filter((q) => q.requires_target);
  for (let i = 0; i < 500; i++) {
    const r = pickTask({ pool: qs, player: a, players: [a, b, c], seen: [], recentTargetIds: [b.id!] })!;
    ok(r.target!.id === c.id, "kürzlich gewähltes Ziel nicht gemieden");
  }
}

// 5. Pack nur mit Zielfragen, keiner passt: trotzdem eine Aufgabe, Ziel = irgendwer anderes
{
  const a = P("Hans", "Männlich", "Hetero");
  const b = P("Karl", "Männlich", "Hetero");
  const qs = pool("Entspannt", "truth").filter((q) => q.requires_target);
  const r = pickTask({ pool: qs, player: a, players: [a, b], seen: [], recentTargetIds: [] })!;
  ok(r.target?.id === b.id, "Fallback-Ziel fehlt");
  ok(pickTask({ pool: [], player: a, players: [a, b], seen: [], recentTargetIds: [] }) === undefined, "leerer Pool");
  const solo = pickTask({ pool: qs, player: a, players: [a], seen: [], recentTargetIds: [] })!;
  ok(solo.question, "Solo-Spieler darf nicht abbrechen");
}

// 6. Platzhalter: alle Vorkommen, Namen als eigene Teile (kein HTML)
{
  const parts = renderTemplate("{playerName}, küsse {targetPlayerName}. {playerName} <b>x</b> {targetPlayerName}!", "A<i>", "B");
  const plain = parts.map((p) => p.text).join("");
  ok(plain === "A<i>, küsse B. A<i> <b>x</b> B!", `Text: ${plain}`);
  ok(parts.filter((p) => p.kind === "player").length === 2, "beide {playerName}");
  ok(parts.filter((p) => p.kind === "target").length === 2, "beide {targetPlayerName}");
}

// 7. Gesamter Inhalt: 3000 Züge pro Pack/Typ, nie ein Platzhalter im Ergebnistext, nie Ziel ohne Namen
{
  const mixed = [P("Anna", "Weiblich", "Hetero"), P("Ben", "Männlich", "Homo"), P("Cem", "Divers", "Pan"), P("Dina", "Weiblich", "Ace")];
  for (const pack of new Set(content.questions.map((q) => q.pack_name))) {
    for (const type of ["truth", "dare"] as const) {
      const qs = pool(pack, type);
      if (qs.length === 0) continue;
      let seen: string[] = [];
      for (let i = 0; i < 300; i++) {
        const player = mixed[i % mixed.length];
        const r = pickTask({ pool: qs, player, players: mixed, seen, recentTargetIds: [] })!;
        seen = r.newLap ? [r.question.uid!] : [r.question.uid!, ...seen];
        const text = renderTemplate(r.question.text_template, player.name, r.target?.name).map((p) => p.text).join("");
        ok(!/\{\w+\}/.test(text), `Platzhalter übrig: ${text}`);
      }
    }
  }
}

console.log = origLog;
console.log(`✅ ${checks} Prüfungen bestanden`);
