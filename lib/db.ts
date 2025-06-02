import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "truthOrDareDB";
const DB_VERSION = 1;

interface Player {
  id?: number; // Auto-incremented or UUID string if we change strategy
  name: string;
  gender: string;
  sexuality: string;
  timestamp_added: Date;
}

interface Question {
  id?: number; // Auto-incremented
  pack_name: string;
  type: "truth" | "dare";
  text_template: string;
}

interface TruthOrDareDBSchema extends DBSchema {
  players: {
    key: number;
    value: Player;
    indexes: { name: string }; // Optional: if searching by name
  };
  questions: {
    key: number;
    value: Question;
    indexes: {
      pack_name: string;
      type: "truth" | "dare";
      pack_type: [string, "truth" | "dare"];
    };
  };
}

const defaultQuestions: Omit<Question, "id">[] = [
  // 5 Truth questions
  {
    pack_name: "Default Pack",
    type: "truth",
    text_template:
      "{playerName}, was war dein peinlichster Moment in der Schule?",
  },
  {
    pack_name: "Default Pack",
    type: "truth",
    text_template: "{playerName}, was ist dein größter geheimer Wunsch?",
  },
  {
    pack_name: "Default Pack",
    type: "truth",
    text_template:
      "{playerName}, wen in dieser Runde findest du am attraktivsten?",
  },
  {
    pack_name: "Default Pack",
    type: "truth",
    text_template: "{playerName}, was ist das Mutigste, das du je getan hast?",
  },
  {
    pack_name: "Default Pack",
    type: "truth",
    text_template:
      "{playerName}, welche übernatürliche Fähigkeit hättest du gerne?",
  },
  // 5 Dare questions
  {
    pack_name: "Default Pack",
    type: "dare",
    text_template: "{playerName}, mache 10 Liegestütze.",
  },
  {
    pack_name: "Default Pack",
    type: "dare",
    text_template: "{playerName}, singe dein Lieblingslied laut vor.",
  },
  {
    pack_name: "Default Pack",
    type: "dare",
    text_template: "{playerName}, erzähle einen Witz.",
  },
  {
    pack_name: "Default Pack",
    type: "dare",
    text_template: "{playerName}, tanze für eine Minute wie ein Roboter.",
  },
  {
    pack_name: "Default Pack",
    type: "dare",
    text_template:
      "{playerName}, sprich für die nächsten 3 Runden mit einem lustigen Akzent.",
  },
];

async function initDB(): Promise<IDBPDatabase<TruthOrDareDBSchema>> {
  const db = await openDB<TruthOrDareDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(
        `Upgrading database from version ${oldVersion} to ${newVersion}`
      );
      if (oldVersion < 1) {
        const playerStore = db.createObjectStore("players", {
          keyPath: "id",
          autoIncrement: true,
        });
        playerStore.createIndex("name", "name", { unique: false });

        const questionStore = db.createObjectStore("questions", {
          keyPath: "id",
          autoIncrement: true,
        });
        questionStore.createIndex("pack_name", "pack_name", { unique: false });
        questionStore.createIndex("type", "type", { unique: false });
        // Composite index for pack_name and type for efficient querying for getRandomQuestion
        questionStore.createIndex("pack_type", ["pack_name", "type"], {
          unique: false,
        });

        // Populate default questions
        defaultQuestions.forEach(async (question) => {
          // The transaction object is available here
          const store = transaction.objectStore("questions");
          await store.add(question as Question); // Cast to Question as 'id' will be auto-generated
        });
        console.log("Default questions populated.");
      }
      // Add more upgrade logic here for future versions if (oldVersion < 2) { ... }
    },
  });

  // Verify population if the database was just created (and upgrade didn't run because it's a new DB)
  // or if we want to ensure questions exist every time (though upgrade should handle new DBs)
  const questionCount = await db.count("questions");
  if (questionCount === 0 && db.version === 1) {
    // Check version to ensure this only runs for a freshly created v1 DB
    console.log(
      "No questions found, populating default questions outside upgrade..."
    );
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    for (const question of defaultQuestions) {
      await store.add(question as Question);
    }
    await tx.done;
    console.log("Default questions populated outside upgrade.");
  }

  return db;
}

// Export a promise that resolves to the database instance
// This ensures the DB is initialized only once
const dbPromise = initDB();

export const getDB = async () => {
  return dbPromise;
};

// CRUD Functions

/**
 * Adds a new player to the database.
 * @param player The player object to add (name, gender, sexuality).
 * @returns The ID of the newly added player.
 */
export async function addPlayer(
  player: Omit<Player, "id" | "timestamp_added">
): Promise<number> {
  const db = await getDB();
  const tx = db.transaction("players", "readwrite");
  const store = tx.objectStore("players");
  const newPlayer: Player = {
    ...player,
    timestamp_added: new Date(),
  };
  const id = await store.add(newPlayer);
  await tx.done;
  console.log(`Player added with ID: ${id}`, newPlayer);
  return id;
}

/**
 * Retrieves all players from the database.
 * @returns A promise that resolves to an array of all players.
 */
export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDB();
  return db.getAll("players");
}

/**
 * Retrieves a player by their ID.
 * (Optional for V1 as per PRD)
 * @param id The ID of the player to retrieve.
 * @returns A promise that resolves to the player object or undefined if not found.
 */
export async function getPlayerById(id: number): Promise<Player | undefined> {
  const db = await getDB();
  return db.get("players", id);
}

/**
 * Updates an existing player in the database.
 * (Optional for V1 as per PRD)
 * @param player The player object to update (must include id).
 * @returns A promise that resolves when the update is complete.
 */
export async function updatePlayer(player: Player): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("players", "readwrite");
  await tx.objectStore("players").put(player);
  await tx.done;
  console.log("Player updated:", player);
}

/**
 * Deletes a player by their ID.
 * (Optional for V1 as per PRD)
 * @param id The ID of the player to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deletePlayer(id: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("players", "readwrite");
  await tx.objectStore("players").delete(id);
  await tx.done;
  console.log(`Player deleted with ID: ${id}`);
}

/**
 * Retrieves a random question of a specific type from a specific pack.
 * @param packName The name of the question pack (e.g., "Default Pack").
 * @param type The type of question ("truth" or "dare").
 * @returns A promise that resolves to a random question object or undefined if none found.
 */
export async function getRandomQuestion(
  packName: string,
  type: "truth" | "dare"
): Promise<Question | undefined> {
  const db = await getDB();
  // Use the 'pack_type' index to get all questions for the given pack and type
  const questions = await db.getAllFromIndex("questions", "pack_type", [
    packName,
    type,
  ]);
  if (questions.length === 0) {
    return undefined;
  }
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}
