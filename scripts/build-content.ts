/**
 * CLI für den Content-Build.
 *
 *   pnpm content          schreibt public/data/content.json und meldet Probleme
 *   pnpm content --check  prüft nur (kein Schreiben), Exit-Code 1 bei Fehlern
 */
import { buildContent, writeContent } from "./content";

const check = process.argv.includes("--check");
const { content, errors, warnings } = buildContent();

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌ ${e}`);

if (errors.length > 0) process.exit(1);

if (!check) writeContent(content);
console.log(
  `✅ Content ${content.version}: ${content.packs.length} Packs, ${content.questions.length} Fragen` +
    (check ? " (nur geprüft)" : " → public/data/content.json")
);
