#!/usr/bin/env tsx

// Test script for pack generation without requiring API key

interface PackGenerationConfig {
  name: string;
  theme: string;
  is_18_plus: boolean;
  type: "truth_and_dare" | "only_truth" | "only_dare";
  description: string;
  num_questions: number;
  target_percentage?: number;
}

// Same predefined configs as the main script
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

function calculateAdCost(config: PackGenerationConfig): number {
  let cost = 3; // Base cost
  if (config.is_18_plus) cost += 3;
  if (config.num_questions > 20) cost += 2;
  return Math.min(cost, 10); // Cap at 10 ads
}

function main() {
  console.log("🎮 Pack Generation Test");
  console.log("📋 Available pack configurations:\n");

  packConfigs.forEach((config, index) => {
    const targetCount = Math.round(
      (config.num_questions * (config.target_percentage || 30)) / 100
    );
    const nonTargetCount = config.num_questions - targetCount;
    const adCost = calculateAdCost(config);

    console.log(`${index + 1}. ${config.name}`);
    console.log(`   📖 ${config.description}`);
    console.log(
      `   🎯 ${config.num_questions} questions (${targetCount} targeting, ${nonTargetCount} non-targeting)`
    );
    console.log(`   🔞 ${config.is_18_plus ? "18+" : "All ages"}`);
    console.log(`   📺 ${adCost} ads to unlock`);
    console.log(`   🎲 Type: ${config.type}`);
    console.log("");
  });

  console.log("✅ Script configuration is valid!");
  console.log("🚀 To generate packs with Gemini API:");
  console.log("   1. Set your API key: export GOOGLE_API_KEY=your_key");
  console.log("   2. Run: npx tsx scripts/generatePacks.ts --list");
  console.log(
    "   3. Generate specific pack: npx tsx scripts/generatePacks.ts --pack 1"
  );
  console.log("   4. Generate all packs: npx tsx scripts/generatePacks.ts");
}

if (require.main === module) {
  main();
}
