#!/usr/bin/env tsx

// Specialized script to generate questions for the German SagDoch packs

interface GermanPackConfig {
  name: string;
  theme: string;
  count: number;
  targeting: number;
  description: string;
  truthOnly?: boolean;
  adult?: boolean;
}

// Use module.exports to avoid global scope conflicts
export const germanPackConfigs: GermanPackConfig[] = [
  {
    name: "Entspannt",
    theme:
      "Entspannte klassische Fragen für gemütliche Runden mit Freunden, harmlos und lustig",
    count: 100,
    targeting: 30,
    description: "Relaxed classic questions for cozy rounds with friends",
  },
  {
    name: "Bisschen Spicy",
    theme:
      "Etwas würzigere Fragen für mutige Spieler, romantisch und flirtend aber noch harmlos",
    count: 60,
    targeting: 40,
    description: "Slightly spicy questions for brave players",
  },
  {
    name: "Partyyyy",
    theme:
      "Mega wilde Fragen und Aufgaben für die krassesten Partys, verrückt und lustig",
    count: 80,
    targeting: 25,
    description: "Wild party questions and dares",
  },
  {
    name: "Tiefgründig",
    theme:
      "Philosophische und tiefgehende Fragen für bedeutungsvolle Gespräche, nur Wahrheitsfragen",
    count: 60,
    targeting: 30,
    description: "Deep philosophical truth questions",
    truthOnly: true,
  },
  {
    name: "Alk/Kiffen",
    theme:
      "Fragen rund um Party, Alkohol, Kiffen und andere wilde Erfahrungen für Erwachsene",
    count: 50,
    targeting: 35,
    description: "Questions about alcohol, weed and wild experiences",
    adult: true,
  },
  {
    name: "Spicy (18+)",
    theme: "Sehr pikante und intime Fragen für Erwachsene, sexy und gewagt",
    count: 70,
    targeting: 50,
    description: "Very spicy intimate questions for adults",
    adult: true,
  },
];

export function displayGermanPackConfigs() {
  console.log("🎮 German Pack Question Generator");
  console.log("📋 Pack configurations for SagDoch:\n");

  germanPackConfigs.forEach((config, index) => {
    const targetCount = Math.round((config.count * config.targeting) / 100);
    const nonTargetCount = config.count - targetCount;

    console.log(`${index + 1}. ${config.name}`);
    console.log(`   📖 ${config.description}`);
    console.log(
      `   🎯 ${config.count} questions (${targetCount} targeting, ${nonTargetCount} non-targeting)`
    );
    console.log(`   🔞 ${config.adult ? "18+" : "All ages"}`);
    console.log(`   🎲 ${config.truthOnly ? "Truth only" : "Truth & Dare"}`);
    console.log(`   🎨 Theme: ${config.theme}`);
    console.log("");
  });

  console.log("🚀 To generate these packs with Gemini API:");
  console.log("   1. Set API key: export GOOGLE_API_KEY=your_key");
  console.log("   2. Use the main generatePacks.ts script");
  console.log("   3. Or use generateQuestions.ts for individual packs");
  console.log("");
  console.log("📝 Example commands:");
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Entspannt" --theme "entspannte Fragen" --count 100'
  );
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Bisschen Spicy" --theme "romantische Fragen" --count 60'
  );
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Partyyyy" --theme "wilde Party Fragen" --count 80'
  );
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Tiefgründig" --theme "philosophische Fragen" --count 60 --type truth'
  );
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Alk/Kiffen" --theme "Alkohol und Party" --count 50'
  );
  console.log(
    '   npx tsx scripts/generateQuestions.ts --pack "Spicy (18+)" --theme "intime Fragen" --count 70'
  );

  console.log(
    "\n✨ All packs are already defined in the database with sample questions!"
  );
  console.log(
    "🎯 Use the question generator to expand any pack to 100+ questions"
  );
}

// Run when executed directly
if (require.main === module) {
  displayGermanPackConfigs();
}
