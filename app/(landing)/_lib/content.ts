import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

/** Wohin „Jetzt spielen“ führt. Eine Stelle, damit das Routing-Update nur hier passiert. */
export const PLAY_HREF = "/";

export type LandingPack = {
  id: string;
  name: string;
  description: string;
  adult: boolean;
};

type PackRow = {
  id?: string;
  name?: string;
  description?: string;
  is_18_plus?: string;
  is_hidden?: string;
};

async function readCsv<T>(file: string): Promise<T[]> {
  const raw = await readFile(path.join(process.cwd(), "data", file), "utf8");
  return Papa.parse<T>(raw, { header: true, skipEmptyLines: true }).data;
}

/**
 * Packs und Fragenzahl kommen aus denselben CSVs wie in der App.
 * Läuft beim Build (statisch), also keine Laufzeitkosten und keine zweite Textquelle.
 */
export async function getLandingData(): Promise<{
  packs: LandingPack[];
  questionCount: number;
}> {
  const packRows = await readCsv<PackRow>("packs.csv");
  const questionRows = await readCsv<{ pack_name?: string }>("questions.csv");

  const visible = packRows.filter(
    (p) => p.id && p.name && p.is_hidden?.trim() !== "true",
  );
  const visibleNames = new Set(visible.map((p) => p.name));

  return {
    packs: visible.map((p) => ({
      id: p.id!,
      name: p.name!,
      description: (p.description ?? "").trim(),
      adult: p.is_18_plus?.trim() === "true",
    })),
    questionCount: questionRows.filter(
      (q) => q.pack_name && visibleNames.has(q.pack_name),
    ).length,
  };
}
