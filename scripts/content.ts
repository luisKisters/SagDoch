/**
 * Content-Build: macht aus den CSV-Quellen (`data/`) das, was die App lädt.
 *
 *   data/packs.csv + data/questions.csv   (einzige Quelle der Wahrheit, von Hand/Skript gepflegt)
 *        │  buildContent()
 *        ▼
 *   public/data/content.json              (generiert, nicht im Git; vorgeparst, mit Content-Version)
 *   NEXT_PUBLIC_CONTENT_VERSION           (gleiche Version, wird in den JS-Bundle eingebrannt)
 *
 * Die Version ist ein Hash über den normalisierten Inhalt. Ändert sich eine Frage oder ein Pack,
 * ändert sich die Version, und die App lädt den Inhalt beim nächsten Start selbst nach,
 * ohne dass jemand `DB_VERSION` hochzählen muss.
 *
 * Wird von `next.config.ts` (bei dev/build) und von `scripts/build-content.ts` (CLI) benutzt.
 * Bewusst nur Node-Standardbibliothek plus papaparse.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Papa from "papaparse";

export interface ContentPack {
  id: string;
  name: string;
  description: string;
  is_18_plus: boolean;
  type: "truth_and_dare" | "only_truth" | "only_dare";
  is_locked: boolean;
  is_hidden: boolean;
  cost_in_ads: number;
}

export interface ContentQuestion {
  /** Inhaltsstabile ID (Hash aus Pack, Typ, Ziel-Flag, Text). Bleibt über Re-Importe gleich. */
  uid: string;
  pack_name: string;
  type: "truth" | "dare";
  text_template: string;
  requires_target: boolean;
}

export interface Content {
  version: string;
  packs: ContentPack[];
  questions: ContentQuestion[];
}

export interface BuildResult {
  content: Content;
  /** Muss behoben werden, sonst bricht der Build ab. */
  errors: string[];
  /** Auffälligkeiten im Inhalt. Der Inhalt wird nicht verändert, nur gemeldet. */
  warnings: string[];
}

const PACK_TYPES = ["truth_and_dare", "only_truth", "only_dare"] as const;
const PLAYER_PH = "{playerName}";
const TARGET_PH = "{targetPlayerName}";

function sha(input: string, len: number): string {
  return createHash("sha256").update(input).digest("hex").slice(0, len);
}

function parseCsv(path: string): Record<string, string>[] {
  const text = readFileSync(path, "utf-8").replace(/^﻿/, "");
  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (res.errors.length > 0) {
    const first = res.errors[0];
    throw new Error(`${path}: ${first.message} (Zeile ${first.row})`);
  }
  return res.data;
}

export function buildContent(rootDir: string = process.cwd()): BuildResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const dataDir = join(rootDir, "data");

  // Packs
  const packs: ContentPack[] = parseCsv(join(dataDir, "packs.csv")).map(
    (row, i) => {
      const type = (row.type ?? "").trim();
      if (!(PACK_TYPES as readonly string[]).includes(type)) {
        errors.push(`packs.csv Zeile ${i + 2}: unbekannter type "${type}"`);
      }
      return {
        id: (row.id ?? "").trim(),
        name: (row.name ?? "").trim(),
        description: row.description ?? "",
        is_18_plus: row.is_18_plus?.trim() === "true",
        type: type as ContentPack["type"],
        is_locked: row.is_locked?.trim() === "true",
        is_hidden: row.is_hidden?.trim() === "true",
        cost_in_ads: parseInt(row.cost_in_ads, 10) || 0,
      };
    }
  );
  const packIds = new Set<string>();
  for (const p of packs) {
    if (!p.id || !p.name) errors.push(`packs.csv: Pack ohne id/name (${JSON.stringify(p)})`);
    if (packIds.has(p.id)) errors.push(`packs.csv: doppelte id "${p.id}"`);
    packIds.add(p.id);
  }
  const packNames = new Set(packs.map((p) => p.name));

  // Fragen
  const seen = new Map<string, number>();
  const questions: ContentQuestion[] = parseCsv(
    join(dataDir, "questions.csv")
  ).map((row, i) => {
    const line = i + 2;
    const pack_name = (row.pack_name ?? "").trim();
    const type = (row.type ?? "").trim();
    const text_template = row.text_template ?? "";
    const requires_target = row.requires_target?.trim() === "true";

    if (!packNames.has(pack_name)) errors.push(`questions.csv Zeile ${line}: Pack "${pack_name}" existiert nicht in packs.csv`);
    if (type !== "truth" && type !== "dare") errors.push(`questions.csv Zeile ${line}: type "${type}" ist weder truth noch dare`);
    if (text_template.trim() === "") errors.push(`questions.csv Zeile ${line}: leerer Text`);

    const unknown = [...text_template.matchAll(/\{(\w+)\}/g)]
      .map((m) => `{${m[1]}}`)
      .filter((ph) => ph !== PLAYER_PH && ph !== TARGET_PH);
    if (unknown.length) errors.push(`questions.csv Zeile ${line}: unbekannter Platzhalter ${unknown.join(", ")}`);

    const hasTargetPh = text_template.includes(TARGET_PH);
    if (hasTargetPh && !requires_target) errors.push(`questions.csv Zeile ${line}: {targetPlayerName} im Text, aber requires_target=false`);
    if (!hasTargetPh && requires_target) warnings.push(`questions.csv Zeile ${line}: requires_target=true, aber kein {targetPlayerName} im Text ("${text_template.slice(0, 50)}...")`);

    // Doppelte Zeilen bekommen ein Suffix, damit die uid eindeutig bleibt, ohne Inhalt zu entfernen.
    const base = sha(`${pack_name}\u0000${type}\u0000${requires_target}\u0000${text_template}`, 12);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    if (n > 0) warnings.push(`questions.csv Zeile ${line}: doppelte Frage in "${pack_name}"`);

    return {
      uid: n === 0 ? base : `${base}-${n}`,
      pack_name,
      type: type as ContentQuestion["type"],
      text_template,
      requires_target,
    };
  });

  // Pro (Pack, Typ) muss es für den Pack-Typ passende Fragen geben, sonst läuft das Spiel ins Leere.
  for (const p of packs) {
    const types: ("truth" | "dare")[] =
      p.type === "only_truth" ? ["truth"] : p.type === "only_dare" ? ["dare"] : ["truth", "dare"];
    for (const t of types) {
      if (!questions.some((q) => q.pack_name === p.name && q.type === t)) {
        errors.push(`Pack "${p.name}" (${p.type}) hat keine ${t}-Fragen`);
      }
    }
  }

  const version = sha(JSON.stringify({ packs, questions }), 12);
  return { content: { version, packs, questions }, errors, warnings };
}

/** Schreibt `public/data/content.json`. Gibt die Version zurück. */
export function writeContent(
  content: Content,
  rootDir: string = process.cwd()
): string {
  const outDir = join(rootDir, "public", "data");
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, "content.json");
  const json = JSON.stringify(content);
  // Nur schreiben, wenn sich etwas ändert (schont den Dev-Watcher und den SW-Revision-Hash).
  let current = "";
  try {
    current = readFileSync(out, "utf-8");
  } catch {}
  if (current !== json) writeFileSync(out, json, "utf-8");
  return content.version;
}
