#!/usr/bin/env tsx

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

interface PackGenerationConfig {
  name: string;
  theme: string;
  is_18_plus: boolean;
  type: "truth_and_dare" | "only_truth" | "only_dare";
  description: string;
  num_questions: number;
  target_percentage?: number; // Percentage of questions that should require targeting
}

interface GeneratedQuestion {
  type: "truth" | "dare";
  text_template: string;
  requires_target: boolean;
}

interface GeneratedPack {
  id: string;
  name: string;
  description: string;
  is_18_plus: boolean;
  type: "truth_and_dare" | "only_truth" | "only_dare";
  is_locked: boolean;
  cost_in_ads: number;
  questions: GeneratedQuestion[];
}

// Gemini API response schema for structured output
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            enum: ["truth", "dare"],
          },
          text_template: {
            type: SchemaType.STRING,
          },
          requires_target: {
            type: SchemaType.BOOLEAN,
          },
        },
        required: ["type", "text_template", "requires_target"],
      },
    },
  },
  required: ["questions"],
};

class PackGenerator {
  private genai: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genai = new GoogleGenerativeAI(apiKey);
    this.model = this.genai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
  }

  async generatePack(config: PackGenerationConfig): Promise<GeneratedPack> {
    const targetCount = Math.round(
      (config.num_questions * (config.target_percentage || 30)) / 100
    );
    const nonTargetCount = config.num_questions - targetCount;

    const ageRestriction = config.is_18_plus
      ? "Diese Fragen sind für Erwachsene (18+) gedacht und können pikant oder gewagt sein."
      : "Diese Fragen sind für alle Altersgruppen geeignet.";

    const typeInstructions = this.getTypeInstructions(config.type);

    const prompt = `Generiere ${config.num_questions} deutsche Fragen für ein "Wahrheit oder Pflicht" Spiel für das Pack "${config.name}".

PACK THEMA: ${config.theme}
BESCHREIBUNG: ${config.description}
${ageRestriction}

${typeInstructions}

WICHTIGE REGELN:
- Alle Fragen müssen auf Deutsch sein
- Verwende {playerName} als Platzhalter für den aktuellen Spieler
- Für Fragen die einen anderen Spieler ansprechen: verwende {targetPlayerName} und setze requires_target: true
- Für Fragen die nur den aktuellen Spieler betreffen: setze requires_target: false
- Generiere ungefähr ${targetCount} Fragen mit requires_target: true und ${nonTargetCount} mit requires_target: false
- Fragen sollen zum Thema "${config.theme}" passen
- Verwende informelle Ansprache (du/dich/dir)

BEISPIELE FÜR TARGETING:
- requires_target: true → "{playerName}, gib {targetPlayerName} ein ehrliches Kompliment."
- requires_target: false → "{playerName}, erzähle von deinem peinlichsten Moment."

Erstelle eine ausgewogene Mischung die zum Pack-Thema passt!`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = JSON.parse(result.response.text());

      if (!response.questions || !Array.isArray(response.questions)) {
        throw new Error("Invalid response format from Gemini API");
      }

      return {
        id: this.generatePackId(config.name),
        name: config.name,
        description: config.description,
        is_18_plus: config.is_18_plus,
        type: config.type,
        is_locked: true, // New packs are locked by default
        cost_in_ads: this.calculateAdCost(config),
        questions: response.questions,
      };
    } catch (error) {
      console.error(`Error generating pack "${config.name}":`, error);
      throw error;
    }
  }

  private getTypeInstructions(type: string): string {
    switch (type) {
      case "only_truth":
        return "ALLE Fragen müssen vom Typ 'truth' sein (Wahrheitsfragen).";
      case "only_dare":
        return "ALLE Fragen müssen vom Typ 'dare' sein (Aufgaben/Mutproben).";
      default:
        return "Generiere eine ausgewogene Mischung aus 'truth' (Wahrheit) und 'dare' (Pflicht/Aufgabe) Fragen.";
    }
  }

  private generatePackId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private calculateAdCost(config: PackGenerationConfig): number {
    let cost = 3; // Base cost
    if (config.is_18_plus) cost += 3;
    if (config.num_questions > 20) cost += 2;
    return Math.min(cost, 10); // Cap at 10 ads
  }
}

// Predefined pack configurations
const packConfigs: PackGenerationConfig[] = [
  {
    name: "Default Pack Extended",
    theme:
      "Klassische Wahrheit oder Pflicht Fragen für alle Situationen und Altersgruppen",
    is_18_plus: false,
    type: "truth_and_dare",
    description: "100 klassische Fragen für stundenlangen Spielspaß",
    num_questions: 100,
    target_percentage: 30,
  },
  {
    name: "Erwachsenen Edition",
    theme: "Erwachsene Themen, Beziehungen, intime Fragen",
    is_18_plus: true,
    type: "truth_and_dare",
    description: "Nur für Erwachsene - pikante Fragen und gewagte Aufgaben",
    num_questions: 50,
    target_percentage: 40,
  },
  {
    name: "Freunde für immer",
    theme: "Freundschaft, gemeinsame Erinnerungen, vertraute Momente",
    is_18_plus: false,
    type: "truth_and_dare",
    description: "Perfekt für echte Freunde die sich schon lange kennen",
    num_questions: 40,
    target_percentage: 35,
  },
  {
    name: "Wilde Nacht",
    theme: "Party, verrückte Aufgaben, spontane Aktionen",
    is_18_plus: false,
    type: "truth_and_dare",
    description: "Für unvergessliche Partynächte und wilde Abenteuer",
    num_questions: 60,
    target_percentage: 25,
  },
  {
    name: "Geheimnisse enthüllt",
    theme: "Persönliche Geheimnisse, tiefe Wahrheiten, intime Gedanken",
    is_18_plus: false,
    type: "only_truth",
    description: "Nur Wahrheitsfragen für tiefe und ehrliche Gespräche",
    num_questions: 50,
    target_percentage: 30,
  },
  {
    name: "Mutproben Chaos",
    theme: "Verrückte Aufgaben, lustige Challenges, spontane Aktionen",
    is_18_plus: false,
    type: "only_dare",
    description: "Nur Aufgaben - für alle die keine Wahrheitsfragen mögen",
    num_questions: 40,
    target_percentage: 40,
  },
];

async function main() {
  // Check for API key
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "❌ Error: GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required"
    );
    console.log(
      "📝 Set your API key with: export GOOGLE_API_KEY=your_api_key_here"
    );
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  let configName = "";
  let customConfig: PackGenerationConfig | null = null;
  let outputDir = "./generated-packs";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--pack":
      case "-p":
        configName = args[++i];
        break;
      case "--name":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.name = args[++i];
        break;
      case "--theme":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.theme = args[++i];
        break;
      case "--description":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.description = args[++i];
        break;
      case "--adult":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.is_18_plus = true;
        break;
      case "--questions":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.num_questions = parseInt(args[++i]);
        break;
      case "--type":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.type = args[++i] as any;
        break;
      case "--target-percentage":
        if (!customConfig) customConfig = {} as PackGenerationConfig;
        customConfig.target_percentage = parseInt(args[++i]);
        break;
      case "--output":
      case "-o":
        outputDir = args[++i];
        break;
      case "--list":
        console.log("📋 Available pack configurations:");
        packConfigs.forEach((config, index) => {
          console.log(`  ${index + 1}. ${config.name} - ${config.description}`);
        });
        process.exit(0);
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  const generator = new PackGenerator(apiKey);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    if (customConfig && customConfig.name) {
      // Generate custom pack
      if (!customConfig.theme) customConfig.theme = "Allgemeine Fragen";
      if (!customConfig.description)
        customConfig.description = customConfig.theme;
      if (!customConfig.type) customConfig.type = "truth_and_dare";
      if (!customConfig.num_questions) customConfig.num_questions = 20;
      if (customConfig.is_18_plus === undefined)
        customConfig.is_18_plus = false;

      console.log(`🎯 Generating custom pack: ${customConfig.name}`);
      const pack = await generator.generatePack(customConfig);
      await savePack(pack, outputDir);
    } else if (configName) {
      // Generate specific predefined pack
      const config = packConfigs.find(
        (c) =>
          c.name.toLowerCase().includes(configName.toLowerCase()) ||
          configName === (packConfigs.indexOf(c) + 1).toString()
      );

      if (!config) {
        console.error(
          `❌ Pack "${configName}" not found. Use --list to see available packs.`
        );
        process.exit(1);
      }

      console.log(`🎯 Generating pack: ${config.name}`);
      const pack = await generator.generatePack(config);
      await savePack(pack, outputDir);
    } else {
      // Generate all predefined packs
      console.log("🚀 Generating all predefined packs...");
      for (const config of packConfigs) {
        console.log(`\n📦 Generating: ${config.name}`);
        try {
          const pack = await generator.generatePack(config);
          await savePack(pack, outputDir);
          console.log(`✅ Generated: ${config.name}`);

          // Add delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to generate ${config.name}:`, error);
        }
      }
    }

    console.log(
      `\n🎉 Pack generation completed! Check the ${outputDir} directory.`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

async function savePack(pack: GeneratedPack, outputDir: string) {
  const filename = `${pack.id}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(pack, null, 2));
  console.log(`💾 Saved: ${filepath}`);
  console.log(
    `📊 Pack "${pack.name}" contains ${pack.questions.length} questions`
  );

  const targetQuestions = pack.questions.filter(
    (q) => q.requires_target
  ).length;
  const nonTargetQuestions = pack.questions.length - targetQuestions;
  console.log(
    `   - ${targetQuestions} targeting questions, ${nonTargetQuestions} non-targeting questions`
  );
}

function printHelp() {
  console.log(`
🎮 SagDoch Pack Generator

Generate question packs for the SagDoch Truth or Dare app using Google's Gemini API.

USAGE:
  tsx generatePacks.ts [options]

OPTIONS:
  --list                    List all available predefined pack configurations
  --pack, -p <name>        Generate a specific predefined pack (name or number)
  --output, -o <dir>       Output directory (default: ./generated-packs)

CUSTOM PACK OPTIONS:
  --name <name>            Custom pack name
  --theme <theme>          Pack theme/topic
  --description <desc>     Pack description
  --adult                  Mark as 18+ pack
  --questions <num>        Number of questions (default: 20)
  --type <type>            Pack type: truth_and_dare, only_truth, only_dare
  --target-percentage <n>  Percentage of questions requiring targeting (default: 30)

EXAMPLES:
  tsx generatePacks.ts --list
  tsx generatePacks.ts --pack "Erwachsenen Edition"
  tsx generatePacks.ts --pack 1
  tsx generatePacks.ts --name "Mein Pack" --theme "Gaming" --questions 15
  tsx generatePacks.ts

ENVIRONMENT:
  Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable with your API key.
`);
}

if (require.main === module) {
  main().catch(console.error);
}
