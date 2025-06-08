#!/usr/bin/env tsx

/**
 * AI-Powered Question Generation Script for SagDoch V2
 *
 * This script generates questions for Truth or Dare packs using the Gemini API.
 * Usage: npx tsx scripts/generateQuestions.ts --pack "Party Time" --theme "wild party games" --count 20 --adults true
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

interface GeneratedQuestion {
  type: "truth" | "dare";
  text_template: string;
  requires_target: boolean;
}

interface GenerationConfig {
  packName: string;
  theme: string;
  totalCount: number;
  truthCount: number;
  dareCount: number;
  isAdults: boolean;
  apiKey?: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateQuestions(
  config: GenerationConfig
): Promise<GeneratedQuestion[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Generate ${config.totalCount} questions for a 'Truth or Dare' game for the pack '${config.packName}'. 
Theme: ${config.theme}
The pack is for adults: ${config.isAdults}. 
Generate ${config.truthCount} truth and ${config.dareCount} dare questions. 

Rules:
1. Use {playerName} for the player who gets the question
2. Use {targetPlayerName} when the question/dare involves another specific player
3. Set requires_target to true ONLY if {targetPlayerName} is used in the text
4. Make questions appropriate for the theme and age group
5. Keep questions in German language
6. Ensure variety in question complexity and style

Provide the output as a JSON array of objects with keys: 'type' ('truth' or 'dare'), 'text_template' (string), and 'requires_target' (boolean).

Example format:
[
  {
    "type": "truth",
    "text_template": "{playerName}, was ist dein größtes Geheimnis?",
    "requires_target": false
  },
  {
    "type": "dare", 
    "text_template": "{playerName}, gib {targetPlayerName} ein Kompliment.",
    "requires_target": true
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [
      null,
      text,
    ];
    const jsonString = jsonMatch[1] || text;

    const questions: GeneratedQuestion[] = JSON.parse(jsonString.trim());

    // Validate the response
    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    questions.forEach((q, index) => {
      if (
        !q.type ||
        !q.text_template ||
        typeof q.requires_target !== "boolean"
      ) {
        throw new Error(
          `Invalid question at index ${index}: ${JSON.stringify(q)}`
        );
      }
      if (!["truth", "dare"].includes(q.type)) {
        throw new Error(`Invalid question type at index ${index}: ${q.type}`);
      }
    });

    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

function saveQuestionsToFile(
  questions: GeneratedQuestion[],
  packName: string
): string {
  const outputDir = path.join(process.cwd(), "generated-questions");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${packName
    .toLowerCase()
    .replace(/\s+/g, "-")}-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);

  const output = {
    packName,
    generatedAt: new Date().toISOString(),
    questions: questions.map((q, index) => ({
      pack_name: packName,
      ...q,
      id: undefined, // Will be auto-generated when added to DB
    })),
  };

  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  return filepath;
}

function parseArgs(): GenerationConfig {
  const args = process.argv.slice(2);
  const config: Partial<GenerationConfig> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case "--pack":
        config.packName = value;
        break;
      case "--theme":
        config.theme = value;
        break;
      case "--count":
        config.totalCount = parseInt(value);
        break;
      case "--adults":
        config.isAdults = value.toLowerCase() === "true";
        break;
      case "--api-key":
        config.apiKey = value;
        break;
    }
  }

  // Defaults and validation
  if (!config.packName) {
    throw new Error("--pack argument is required");
  }
  if (!config.theme) {
    throw new Error("--theme argument is required");
  }

  config.totalCount = config.totalCount || 20;
  config.truthCount = Math.floor(config.totalCount * 0.5);
  config.dareCount = config.totalCount - config.truthCount;
  config.isAdults = config.isAdults ?? false;

  return config as GenerationConfig;
}

async function main() {
  try {
    console.log("🚀 Starting AI Question Generation...\n");

    const config = parseArgs();

    console.log(`📦 Pack: ${config.packName}`);
    console.log(`🎯 Theme: ${config.theme}`);
    console.log(
      `📊 Questions: ${config.totalCount} (${config.truthCount} truth, ${config.dareCount} dare)`
    );
    console.log(`🔞 Adults: ${config.isAdults ? "Yes" : "No"}\n`);

    console.log("🤖 Generating questions with Gemini AI...");
    const questions = await generateQuestions(config);

    console.log(`✅ Generated ${questions.length} questions`);
    console.log(
      `📝 Truth: ${questions.filter((q) => q.type === "truth").length}`
    );
    console.log(
      `🎭 Dare: ${questions.filter((q) => q.type === "dare").length}`
    );
    console.log(
      `🎯 With targeting: ${
        questions.filter((q) => q.requires_target).length
      }\n`
    );

    const filepath = saveQuestionsToFile(questions, config.packName);
    console.log(`💾 Questions saved to: ${filepath}`);

    console.log(
      "\n🎉 Generation complete! You can now import these questions into your database."
    );
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generateQuestions };
export type { GeneratedQuestion, GenerationConfig };
