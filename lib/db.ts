// lib/db.ts - IndexedDB Helper
import { openDB, DBSchema, IDBPDatabase, IDBPTransaction } from "idb";

const DB_NAME = "truthOrDareDB";
const DB_VERSION = 1;

// Define the database schema
interface TruthOrDareDB extends DBSchema {
  players: {
    key: string; // Using string for potential UUID later, though PRD mentions autoIncrement for ID
    value: {
      id: string;
      name: string;
      gender: string;
      sexuality: string;
      timestamp_added: Date;
    };
    indexes: { name: string }; // Optional index
  };
  questions: {
    key: number; // autoIncrement
    value: {
      id: number;
      pack_name: string;
      type: "truth" | "dare";
      text_template: string;
    };
    indexes: { pack_name: string; type: "truth" | "dare" };
  };
}

let db: IDBPDatabase<TruthOrDareDB> | null = null;

async function getDB(): Promise<IDBPDatabase<TruthOrDareDB>> {
  if (!db) {
    db = await openDB<TruthOrDareDB>(DB_NAME, DB_VERSION, {
      upgrade(
        database: IDBPDatabase<TruthOrDareDB>,
        oldVersion: number,
        newVersion: number | null,
        transaction: IDBPTransaction<
          TruthOrDareDB,
          ["players", "questions"],
          "versionchange"
        >
      ) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${newVersion}`
        );

        // Initialize Players Object Store
        if (!database.objectStoreNames.contains("players")) {
          const playersStore = database.createObjectStore("players", {
            keyPath: "id",
            // autoIncrement: true, // PRD says autoIncrement or UUID. If using UUID, don't use autoIncrement.
            // For now, will assume ID is provided manually (e.g. UUID generated in app logic)
          });
          playersStore.createIndex("name", "name", { unique: false });
          console.log("Created players object store");
        }

        // Initialize Questions Object Store
        if (!database.objectStoreNames.contains("questions")) {
          const questionsStore = database.createObjectStore("questions", {
            keyPath: "id",
            autoIncrement: true,
          });
          questionsStore.createIndex("pack_name", "pack_name", {
            unique: false,
          });
          questionsStore.createIndex("type", "type", { unique: false });
          // Creating a compound index might be more efficient if querying by pack_name AND type often
          // questionsStore.createIndex('pack_type', ['pack_name', 'type'], { unique: false });
          console.log("Created questions object store");

          // Populate default questions
          const defaultQuestions = [
            {
              pack_name: "Default Pack",
              type: "truth",
              text_template:
                "{playerName}, was war dein peinlichster Moment in der Schule?",
            },
            {
              pack_name: "Default Pack",
              type: "truth",
              text_template: "{playerName}, was ist dein größter Wunsch?",
            },
            {
              pack_name: "Default Pack",
              type: "truth",
              text_template:
                "{playerName}, was würdest du mit einer Million Euro machen?",
            },
            {
              pack_name: "Default Pack",
              type: "truth",
              text_template: "{playerName}, was war deine mutigste Tat?",
            },
            {
              pack_name: "Default Pack",
              type: "truth",
              text_template: "{playerName}, was ist dein Lieblingsgeheimnis?",
            },
            {
              pack_name: "Default Pack",
              type: "dare",
              text_template: "{playerName}, mache 10 Liegestütze.",
            },
            {
              pack_name: "Default Pack",
              type: "dare",
              text_template: "{playerName}, singe ein Lied vor.",
            },
            {
              pack_name: "Default Pack",
              type: "dare",
              text_template: "{playerName}, imitiere ein Tier.",
            },
            {
              pack_name: "Default Pack",
              type: "dare",
              text_template: "{playerName}, erzähle einen Witz.",
            },
            {
              pack_name: "Default Pack",
              type: "dare",
              text_template: "{playerName}, tanze für eine Minute.",
            },
          ];

          defaultQuestions.forEach((q) => {
            // Type assertion because 'id' will be auto-generated and isn't in the initial object.
            transaction.objectStore("questions").add(q as any);
          });
          console.log("Populated default questions");
        }
      },
    });
    console.log("Database initialized");
  }
  return db;
}

// CRUD Functions

// Player related types - can be moved to a types.ts file later if preferred
export interface Player {
  id: string;
  name: string;
  gender: string;
  sexuality: string;
  timestamp_added: Date;
}

export interface NewPlayer {
  name: string;
  gender: string;
  sexuality: string;
}

export async function addPlayer(playerData: NewPlayer): Promise<Player> {
  const db = await getDB();
  const newId = crypto.randomUUID(); // Generate UUID for player ID
  const playerWithId: Player = {
    ...playerData,
    id: newId,
    timestamp_added: new Date(),
  };
  await db.add("players", playerWithId);
  return playerWithId;
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDB();
  return db.getAll("players");
}

// Question related types
export interface Question {
  id: number;
  pack_name: string;
  type: "truth" | "dare";
  text_template: string;
}

export async function getRandomQuestion(
  packName: string,
  type: "truth" | "dare"
): Promise<Question | undefined> {
  const db = await getDB();
  const allQuestionsOfPackAndType = await db.getAllFromIndex(
    "questions",
    "pack_name",
    packName
  );

  const filteredQuestions = allQuestionsOfPackAndType.filter(
    (q) => q.type === type
  );

  if (filteredQuestions.length === 0) {
    return undefined;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  return filteredQuestions[randomIndex];
}

// Optional for V1 (stubs or basic implementation if needed quickly)
export async function getPlayerById(id: string): Promise<Player | undefined> {
  const db = await getDB();
  return db.get("players", id);
}

// Stubs for other optional V1 functions
// export async function updatePlayer(player: Player): Promise<void> {
//   const db = await getDB();
//   await db.put('players', player);
// }

// export async function deletePlayer(id: string): Promise<void> {
//   const db = await getDB();
//   await db.delete('players', id);
// }

export { getDB };
