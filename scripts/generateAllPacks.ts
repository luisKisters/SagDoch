#!/usr/bin/env tsx

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Type definitions for structured output
interface GeneratedQuestion {
  type: "truth" | "dare";
  text_template: string;
  requires_target: boolean;
}

interface GeneratedQuestions {
  questions: GeneratedQuestion[];
}

// CSV row types
interface PackCSVRow {
  id: string;
  name: string;
  description: string;
  is_18_plus: string;
  type: string;
  is_locked: string;
  is_hidden: string;
  cost_in_ads: string;
}

interface QuestionCSVRow {
  pack_name: string;
  type: string;
  text_template: string;
  requires_target: string;
}

// Pack configurations for generation
interface PackConfig {
  name: string;
  theme: string;
  description: string;
  questionCount: number;
  targetingPercentage: number;
  truthOnly?: boolean;
  adult?: boolean;
  special?: boolean;
}

const packConfigs: PackConfig[] = [
  {
    name: "Entspannt",
    theme:
      "Entspannte, lustige und harmlose Fragen für gemütliche Runden mit Freunden",
    description:
      "Klassische entspannte Fragen für gemütliche Runden mit Freunden",
    questionCount: 100,
    targetingPercentage: 30,
  },
  {
    name: "Bisschen Spicy",
    theme:
      "Etwas würzigere, romantische und flirtende Fragen für mutige Spieler, aber noch harmlos",
    description:
      "Etwas würzigere Fragen für mutige Spieler - aber noch harmlos",
    questionCount: 80,
    targetingPercentage: 50,
  },
  {
    name: "Partyyyy",
    theme:
      "Mega wilde, verrückte und lustige Fragen und Aufgaben für die krassesten Partys",
    description: "Mega wilde Fragen und Aufgaben für die krassesten Partys!",
    questionCount: 120,
    targetingPercentage: 35,
  },
  {
    name: "Tiefgründig",
    theme:
      "Philosophische, tiefgehende und bedeutungsvolle Fragen für ernsthafte Gespräche",
    description:
      "Philosophische und tiefgehende Fragen für bedeutungsvolle Gespräche",
    questionCount: 60,
    targetingPercentage: 40,
    truthOnly: true,
  },
  {
    name: "Alk/Kiffen",
    theme:
      "Fragen rund um Party, Alkohol, Kiffen und andere wilde Erfahrungen für Erwachsene",
    description: "Wahrheit oder Pflicht Aufgaben für wenn man high/suff ist:)",
    questionCount: 70,
    targetingPercentage: 35,
    adult: true,
  },
  {
    name: "Spicy (18+)",
    theme:
      "Sehr pikante, intime und sexy Fragen für Erwachsene, gewagt und heiß",
    description: "Nur für Erwachsene - pikante Fragen und gewagte Aufgaben",
    questionCount: 90,
    targetingPercentage: 60,
    adult: true,
  },
  {
    name: "35. BST: Verbundenheit",
    theme:
      "Tiefgreifende Fragen zum Thema Verbundenheit, speziell für Waldorfschüler und die 35. BST, über echte menschliche Bindungen, Vertrauen und das Gefühl zusammenzugehören",
    description: "Spezielle Fragen zum Thema Verbundenheit für die 35. BST",
    questionCount: 50,
    targetingPercentage: 45,
    special: true,
  },
];

// CSV utility functions
function parseCSV(content: string): string[][] {
  const lines = content.trim().split("\n");
  return lines.map((line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  });
}

function readPacksFromCSV(): PackCSVRow[] {
  const csvPath = join(process.cwd(), "data", "packs.csv");
  if (!existsSync(csvPath)) {
    throw new Error(`Packs CSV file not found at ${csvPath}`);
  }

  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  const [headers, ...dataRows] = rows;

  return dataRows.map((row) => ({
    id: row[0],
    name: row[1],
    description: row[2],
    is_18_plus: row[3],
    type: row[4],
    is_locked: row[5],
    is_hidden: row[6],
    cost_in_ads: row[7],
  }));
}

function readQuestionsFromCSV(): QuestionCSVRow[] {
  const csvPath = join(process.cwd(), "data", "questions.csv");
  if (!existsSync(csvPath)) {
    throw new Error(`Questions CSV file not found at ${csvPath}`);
  }

  const content = readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  const [headers, ...dataRows] = rows;

  return dataRows.map((row) => ({
    pack_name: row[0],
    type: row[1],
    text_template: row[2],
    requires_target: row[3],
  }));
}

function writeQuestionsToCSV(questions: QuestionCSVRow[]) {
  const csvPath = join(process.cwd(), "data", "questions.csv");
  const headers = ["pack_name", "type", "text_template", "requires_target"];

  const csvContent = [
    headers.join(","),
    ...questions.map((q) =>
      [
        `"${q.pack_name}"`,
        q.type,
        `"${q.text_template}"`,
        q.requires_target,
      ].join(",")
    ),
  ].join("\n");

  writeFileSync(csvPath, csvContent, "utf-8");
}

// Generate questions for a specific pack using Gemini API
async function generateQuestionsForPack(
  config: PackConfig
): Promise<GeneratedQuestion[]> {
  // Set up Gemini API following official documentation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const targetingCount = Math.round(
    (config.questionCount * config.targetingPercentage) / 100
  );
  const nonTargetingCount = config.questionCount - targetingCount;

  const truthCount = config.truthOnly
    ? config.questionCount
    : Math.round(config.questionCount * 0.6); // 60% truth, 40% dare by default
  const dareCount = config.truthOnly ? 0 : config.questionCount - truthCount;

  // Build the prompt following the documentation approach
  const prompt = `
Generiere ${
    config.questionCount
  } deutsche Fragen für ein "Wahrheit oder Pflicht" Spiel für das Pack "${
    config.name
  }".

Thema: ${config.theme}

Anforderungen:
- ${targetingCount} Fragen sollen andere Spieler targetieren (requires_target: true) und den Platzhalter {targetPlayerName} verwenden
- ${nonTargetingCount} Fragen sollen den aktuellen Spieler betreffen (requires_target: false) und nur {playerName} verwenden
- ${truthCount} Wahrheitsfragen (type: "truth")
${config.truthOnly ? "" : `- ${dareCount} Pflichtaufgaben (type: "dare")`}
- Alle Fragen auf Deutsch
- Verwende IMMER {playerName} für den aktuellen Spieler
- Verwende {targetPlayerName} nur bei requires_target: true
- Fragen sollten ${
    config.adult
      ? "für Erwachsene (18+) geeignet"
      : "für alle Altersgruppen geeignet"
  } sein
${
  config.special
    ? "- Beziehe dich auf Waldorf-Pädagogik, Anthroposophie, Eurythmie, Epochenunterricht und das Gemeinschaftsgefühl unter Waldorfschülern"
    : ""
}

Beispiel-Format:
- Wahrheit (ohne Targeting): "{playerName}, was war dein peinlichster Moment?"
- Wahrheit (mit Targeting): "{playerName}, was denkst du über {targetPlayerName}?"
- Pflicht (ohne Targeting): "{playerName}, tanze für 30 Sekunden."
- Pflicht (mit Targeting): "{playerName}, gib {targetPlayerName} ein Kompliment."

Antworte NUR mit einem gültigen JSON-Objekt in folgendem Format (ohne zusätzlichen Text):
{
  "questions": [
    {
      "type": "truth",
      "text_template": "{playerName}, example question text",
      "requires_target": false
    },
    {
      "type": "dare", 
      "text_template": "{playerName}, gib {targetPlayerName} ein Kompliment",
      "requires_target": true
    }
  ]
}

Generiere kreative, interessante und ${config.theme.toLowerCase()} Fragen. Gib NUR das JSON zurück, keinen anderen Text.
`;

  try {
    console.log(
      `\n🎯 Generating ${config.questionCount} questions for "${config.name}"...`
    );

    // Use the simple approach from the documentation
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up response text (remove any potential markdown formatting)
    const cleanedText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      const parsedResult: GeneratedQuestions = JSON.parse(cleanedText);

      if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
        throw new Error(
          "Invalid response format from Gemini API - no questions array found"
        );
      }

      console.log(
        `✅ Generated ${parsedResult.questions.length} questions for "${config.name}"`
      );

      // Validate questions
      const validQuestions = parsedResult.questions.filter(
        (q) =>
          q.type &&
          q.text_template &&
          typeof q.requires_target === "boolean" &&
          q.text_template.includes("{playerName}") &&
          (!q.requires_target || q.text_template.includes("{targetPlayerName}"))
      );

      if (validQuestions.length !== parsedResult.questions.length) {
        console.warn(
          `⚠️  Filtered out ${
            parsedResult.questions.length - validQuestions.length
          } invalid questions`
        );
      }

      return validQuestions;
    } catch (parseError) {
      console.error(
        `❌ Failed to parse JSON response for "${config.name}":`,
        parseError
      );
      console.log("Raw response:", responseText.substring(0, 500) + "...");
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }
  } catch (error) {
    console.error(`❌ Error generating questions for "${config.name}":`, error);
    throw error;
  }
}

// Main function to generate all packs
async function generateAllPacks() {
  console.log("🚀 Starting question generation for all packs...\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY environment variable is not set");
    console.log(
      "💡 Make sure you have a .env file with GEMINI_API_KEY=your_api_key"
    );
    return;
  }

  let totalGenerated = 0;
  let totalFailed = 0;

  // Read existing questions from CSV
  let existingQuestions: QuestionCSVRow[] = [];
  try {
    existingQuestions = readQuestionsFromCSV();
    console.log(
      `📖 Loaded ${existingQuestions.length} existing questions from CSV`
    );
  } catch (error) {
    console.log("📝 No existing questions CSV found, starting fresh");
  }

  for (const config of packConfigs) {
    try {
      const questions = await generateQuestionsForPack(config);

      // Convert to CSV format
      const csvQuestions: QuestionCSVRow[] = questions.map((q) => ({
        pack_name: config.name,
        type: q.type,
        text_template: q.text_template,
        requires_target: q.requires_target.toString(),
      }));

      // Remove existing questions for this pack and add new ones
      const filteredExisting = existingQuestions.filter(
        (q) => q.pack_name !== config.name
      );
      const allQuestions = [...filteredExisting, ...csvQuestions];

      // Write to CSV
      try {
        writeQuestionsToCSV(allQuestions);
        console.log(
          `💾 Saved ${csvQuestions.length} questions for "${config.name}" to CSV`
        );
        totalGenerated += csvQuestions.length;
        existingQuestions = allQuestions; // Update for next iteration
      } catch (csvError) {
        console.error(
          `❌ Failed to save questions for "${config.name}" to CSV:`,
          csvError
        );
        totalFailed += csvQuestions.length;
      }
    } catch (error) {
      console.error(
        `❌ Failed to generate questions for "${config.name}":`,
        error
      );
      totalFailed += config.questionCount;
    }

    // Add delay between requests to avoid rate limiting
    if (config !== packConfigs[packConfigs.length - 1]) {
      console.log("⏳ Waiting 2 seconds before next pack...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n📊 Generation Summary:");
  console.log(`✅ Successfully generated: ${totalGenerated} questions`);
  console.log(`❌ Failed to generate: ${totalFailed} questions`);
  console.log(`📦 Total packs processed: ${packConfigs.length}`);

  if (totalGenerated > 0) {
    console.log("\n🎉 Question generation completed!");
    console.log("💡 Check data/questions.csv for the generated questions");
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log("🎮 SagDoch Question Generator");
    console.log(
      "\nGenerates questions for all packs using Gemini AI and saves to CSV"
    );
    console.log("\nUsage:");
    console.log("  npx tsx scripts/generateAllPacks.ts");
    console.log("\nEnvironment Variables:");
    console.log(
      "  GEMINI_API_KEY    Your Google Gemini API key (set in .env file)"
    );
    console.log("\nFiles:");
    console.log("  data/packs.csv      Pack definitions (input)");
    console.log("  data/questions.csv  Generated questions (output)");
    console.log("\nPacks to be generated:");
    packConfigs.forEach((config, index) => {
      console.log(
        `  ${index + 1}. ${config.name} (${config.questionCount} questions)`
      );
    });
    return;
  }

  if (args.includes("--list")) {
    console.log("📋 Available packs for generation:\n");
    packConfigs.forEach((config, index) => {
      console.log(`${index + 1}. ${config.name}`);
      console.log(`   📖 ${config.description}`);
      console.log(
        `   🎯 ${config.questionCount} questions (${config.targetingPercentage}% targeting)`
      );
      console.log(`   🔞 ${config.adult ? "18+" : "All ages"}`);
      console.log(`   🎲 ${config.truthOnly ? "Truth only" : "Truth & Dare"}`);
      console.log(
        `   ✨ ${config.special ? "Special theme" : "Standard theme"}`
      );
      console.log("");
    });
    return;
  }

  await generateAllPacks();
}

// Export for use as module
export { generateAllPacks, generateQuestionsForPack, packConfigs };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
