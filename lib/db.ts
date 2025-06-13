import { openDB, DBSchema, IDBPDatabase } from "idb";
import Papa from "papaparse";

const DB_NAME = "truthOrDareDB";
const DB_VERSION = 5;

// Function to check if we need to redirect due to old DB version
export async function checkDatabaseCompatibility(): Promise<{
  compatible: boolean;
  needsReset: boolean;
}> {
  if (typeof window === "undefined")
    return { compatible: true, needsReset: false };

  try {
    // Try to open the existing database without upgrading
    const existingDB = await new Promise<IDBDatabase | null>((resolve) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onupgradeneeded = () => {
        // Close the connection if upgrade is needed
        request.result.close();
        resolve(null);
      };
    });

    if (existingDB) {
      const currentVersion = existingDB.version;
      existingDB.close();

      // If version is less than 4, we need to show reset modal
      if (currentVersion < 4) {
        console.log(
          `Old database version detected: ${currentVersion}. Reset needed.`
        );
        return { compatible: false, needsReset: true };
      }
    }

    return { compatible: true, needsReset: false }; // Database is compatible or doesn't exist
  } catch (error) {
    console.error("Error checking database compatibility:", error);
    return { compatible: true, needsReset: false }; // Proceed normally on error
  }
}

// Function to actually clear the old database
export async function clearOldDatabase(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    console.log("Clearing old database...");
    await new Promise<void>((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
    console.log("Old database cleared successfully");
  } catch (error) {
    console.error("Error clearing old database:", error);
    throw error;
  }
}

export interface Player {
  id?: number; // Auto-incremented or UUID string if we change strategy
  name: string;
  gender: string;
  sexuality: string;
  timestamp_added: Date;
}

export interface Question {
  id?: number; // Auto-incremented
  pack_name: string;
  type: "truth" | "dare";
  text_template: string;
  requires_target?: boolean; // NEW FIELD: 'true' if the text_template uses {targetPlayerName}
}

export interface Pack {
  id: string;
  name: string; // e.g., "Kennenlernrunde", "Spicy (18+)"
  description: string; // A short description of the pack's theme.
  is_18_plus: boolean; // For displaying an "18+" label.
  type: "truth_and_dare" | "only_truth" | "only_dare";
  is_locked: boolean; // Default 'true' for new packs, 'false' for "Default Pack".
  is_hidden: boolean; // NEW FIELD: 'true' if the pack should be hidden from normal view
  cost_in_ads: number; // For V3 monetization. The number of ads to watch to unlock.
}

export interface UserProfile {
  id: "local_user_profile";
  promo_code_activated: boolean; // Default 'false'.
  bst_code_activated: boolean; // NEW FIELD: For BST special pack unlock
  unlocked_pack_names: string[]; // List of pack names unlocked (using pack_name to match existing questions).
  // For V3:
  // ad_watch_progress: { [packName: string]: number }; // Tracks ads watched per pack.
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
  packs: {
    key: string;
    value: Pack;
  };
  user_profile: {
    key: string;
    value: UserProfile;
  };
}

// CSV Loading Functions
async function loadQuestionsFromCSV(): Promise<Omit<Question, "id">[]> {
  try {
    const response = await fetch("/data/questions.csv");
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const questions = results.data.map((row: any) => ({
              pack_name: row.pack_name,
              type: row.type as "truth" | "dare",
              text_template: row.text_template,
              requires_target: row.requires_target === "true",
            }));
            resolve(questions);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error loading questions from CSV:", error);
    // Return empty array as fallback
    return [];
  }
}

async function loadPacksFromCSV(): Promise<Pack[]> {
  try {
    const response = await fetch("/data/packs.csv");
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const packs = results.data.map((row: any) => ({
              id: row.id,
              name: row.name,
              description: row.description,
              is_18_plus: row.is_18_plus === "true",
              type: row.type as "truth_and_dare" | "only_truth" | "only_dare",
              is_locked: row.is_locked === "true",
              is_hidden: row.is_hidden === "true",
              cost_in_ads: parseInt(row.cost_in_ads) || 0,
            }));
            resolve(packs);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error("Error loading packs from CSV:", error);
    // Return empty array as fallback
    return [];
  }
}

// Fallback data in case CSV loading fails
const defaultUserProfile: UserProfile = {
  id: "local_user_profile",
  promo_code_activated: false,
  bst_code_activated: false,
  unlocked_pack_names: ["Entspannt"], // Default pack is always unlocked
};

async function initDB(): Promise<IDBPDatabase<TruthOrDareDBSchema>> {
  // Check if running on client side
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is not available on the server side");
  }

  try {
    const db = await openDB<TruthOrDareDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${newVersion}`
        );

        try {
          if (oldVersion < 1) {
            // Create initial v1 stores
            console.log("Creating v1 object stores...");
            const playerStore = db.createObjectStore("players", {
              keyPath: "id",
              autoIncrement: true,
            });
            playerStore.createIndex("name", "name", { unique: false });

            const questionStore = db.createObjectStore("questions", {
              keyPath: "id",
              autoIncrement: true,
            });
            questionStore.createIndex("pack_name", "pack_name", {
              unique: false,
            });
            questionStore.createIndex("type", "type", { unique: false });
            // Composite index for pack_name and type for efficient querying for getRandomQuestion
            questionStore.createIndex("pack_type", ["pack_name", "type"], {
              unique: false,
            });
            console.log("V1 object stores created successfully.");
          }

          if (oldVersion < 2) {
            // Create new v2 stores
            console.log("Creating v2 object stores...");
            const packStore = db.createObjectStore("packs", {
              keyPath: "id",
            });

            const userProfileStore = db.createObjectStore("user_profile", {
              keyPath: "id",
            });

            // Add default user profile
            const userStore = transaction.objectStore("user_profile");
            userStore.add(defaultUserProfile);
            console.log("Default user profile populated for v2.");
          }

          if (oldVersion < 3) {
            // V3: Clear existing data to refresh with CSV data
            console.log("Upgrading to v3: Clearing data for CSV refresh...");

            const packStore = transaction.objectStore("packs");
            const questionStore = transaction.objectStore("questions");

            packStore.clear();
            questionStore.clear();

            console.log("V3 upgrade completed: Data cleared for CSV loading.");
          }

          if (oldVersion < 4) {
            // V4: Clear data again to ensure fresh CSV data
            console.log(
              "Upgrading to v4: Clearing data for fresh CSV loading..."
            );

            const packStore = transaction.objectStore("packs");
            const questionStore = transaction.objectStore("questions");
            const userProfileStore = transaction.objectStore("user_profile");

            packStore.clear();
            questionStore.clear();
            userProfileStore.clear();

            // Add updated user profile
            userProfileStore.add(defaultUserProfile);

            console.log("V4 upgrade completed: Data cleared for CSV loading.");
          }

          if (oldVersion < 5) {
            // V5: Clear cached pack and question data to refresh with latest CSV data
            console.log(
              "Upgrading to v5: Clearing pack and question cache for fresh data..."
            );

            const packStore = transaction.objectStore("packs");
            const questionStore = transaction.objectStore("questions");

            packStore.clear();
            questionStore.clear();

            console.log(
              "V5 upgrade completed: Pack and question cache cleared for fresh CSV loading."
            );
          }
        } catch (upgradeError) {
          console.error("Error during database upgrade:", upgradeError);
          throw upgradeError;
        }
      },
      blocked() {
        console.warn("Database upgrade blocked by another connection");
      },
      blocking() {
        console.warn("Database connection is blocking another upgrade");
      },
    });

    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// Post-initialization data loading
async function loadInitialData(
  db: IDBPDatabase<TruthOrDareDBSchema>
): Promise<void> {
  try {
    // Load data from CSV files and populate database if empty
    const questionCount = await db.count("questions");
    if (questionCount === 0) {
      console.log("No questions found, loading from CSV...");
      try {
        const questions = await loadQuestionsFromCSV();
        if (questions.length > 0) {
          const tx = db.transaction("questions", "readwrite");
          const store = tx.objectStore("questions");
          for (const question of questions) {
            await store.add(question as Question);
          }
          await tx.done;
          console.log(`Loaded ${questions.length} questions from CSV.`);
        } else {
          console.warn("No questions loaded from CSV file.");
        }
      } catch (error) {
        console.error("Error loading questions from CSV:", error);
      }
    }

    const packCount = await db.count("packs");
    if (packCount === 0) {
      console.log("No packs found, loading from CSV...");
      try {
        const packs = await loadPacksFromCSV();
        if (packs.length > 0) {
          const tx = db.transaction("packs", "readwrite");
          const store = tx.objectStore("packs");
          for (const pack of packs) {
            await store.add(pack);
          }
          await tx.done;
          console.log(`Loaded ${packs.length} packs from CSV.`);
        } else {
          console.warn("No packs loaded from CSV file.");
        }
      } catch (error) {
        console.error("Error loading packs from CSV:", error);
      }
    }

    const profileCount = await db.count("user_profile");
    if (profileCount === 0) {
      console.log("No user profile found, creating default profile...");
      const tx = db.transaction("user_profile", "readwrite");
      const store = tx.objectStore("user_profile");
      await store.add(defaultUserProfile);
      await tx.done;
      console.log("Default user profile created.");
    }
  } catch (error) {
    console.error("Error during initial data loading:", error);
    throw error;
  }
}

// Combined initialization function
async function initializeDatabase(): Promise<
  IDBPDatabase<TruthOrDareDBSchema>
> {
  try {
    const db = await initDB();
    await loadInitialData(db);
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// Export a promise that resolves to the database instance
// This ensures the DB is initialized only once
const dbPromise = initializeDatabase();

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
  try {
    console.log("Attempting to add player:", player);
    const db = await getDB();
    console.log("Database connection obtained");

    const tx = db.transaction("players", "readwrite");
    const store = tx.objectStore("players");

    const newPlayer: Player = {
      ...player,
      timestamp_added: new Date(),
    };

    console.log("Adding player to store:", newPlayer);
    const id = await store.add(newPlayer);
    await tx.done;

    console.log(`Player added successfully with ID: ${id}`, newPlayer);
    return id;
  } catch (error) {
    console.error("Error adding player:", error);
    console.error("Player data:", player);
    throw error;
  }
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
 * Deletes all players from the database.
 * @returns A promise that resolves when all players are deleted.
 */
export async function deleteAllPlayers(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("players", "readwrite");
  await tx.objectStore("players").clear();
  await tx.done;
  console.log("All players deleted");
}

/**
 * Retrieves a random question of a specific type from a specific pack.
 * @param packName The name of the question pack (e.g., "Default Pack").
 * @param type The type of question ("truth" or "dare").
 * @param recentQuestionIds An array of recently used question IDs to filter out
 * @returns A promise that resolves to a random question object or undefined if none found.
 */
export async function getRandomQuestion(
  packName: string,
  type: "truth" | "dare",
  recentQuestionIds: number[] = []
): Promise<Question | undefined> {
  const db = await getDB();
  // Use the 'pack_type' index to get all questions for the given pack and type
  const allQuestions = await db.getAllFromIndex("questions", "pack_type", [
    packName,
    type,
  ]);
  if (allQuestions.length === 0) {
    return undefined;
  }

  let selectableQuestions = allQuestions;

  // Attempt to filter out recent questions, but only if there are other options
  if (allQuestions.length > 1) {
    const nonRecentQuestions = allQuestions.filter(
      (q) => !recentQuestionIds.includes(q.id!)
    );
    if (nonRecentQuestions.length > 0) {
      selectableQuestions = nonRecentQuestions;
    }
  }

  const randomIndex = Math.floor(Math.random() * selectableQuestions.length);
  return selectableQuestions[randomIndex];
}

// CRUD Functions for Packs (new)

/**
 * Retrieves all packs from the database.
 * @param includeHidden Whether to include hidden packs in the results.
 * @returns A promise that resolves to an array of all packs.
 */
export async function getAllPacks(
  includeHidden: boolean = false
): Promise<Pack[]> {
  const db = await getDB();
  const allPacks = await db.getAll("packs");
  if (includeHidden) {
    return allPacks;
  }
  return allPacks.filter((pack) => !pack.is_hidden);
}

/**
 * Retrieves a pack by its ID.
 * @param id The ID of the pack to retrieve.
 * @returns A promise that resolves to the pack object or undefined if not found.
 */
export async function getPackById(id: string): Promise<Pack | undefined> {
  const db = await getDB();
  return db.get("packs", id);
}

/**
 * Adds a new pack to the database.
 * @param pack The pack object to add.
 * @returns A promise that resolves when the addition is complete.
 */
export async function addPack(pack: Pack): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("packs", "readwrite");
  const store = tx.objectStore("packs");
  await store.add(pack);
  await tx.done;
  console.log("Pack added:", pack);
}

/**
 * Adds multiple questions to the database.
 * @param questions Array of question objects to add.
 * @returns A promise that resolves when all additions are complete.
 */
export async function addQuestions(
  questions: Omit<Question, "id">[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("questions", "readwrite");
  const store = tx.objectStore("questions");

  for (const question of questions) {
    await store.add(question as Question);
  }

  await tx.done;
  console.log(`Added ${questions.length} questions to database`);
}

// CRUD Functions for User Profile (new)

/**
 * Retrieves the user profile from the database.
 * @returns A promise that resolves to the user profile object or undefined if not found.
 */
export async function getUserProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get("user_profile", "local_user_profile");
}

/**
 * Updates the user profile in the database.
 * @param profile The user profile object to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("user_profile", "readwrite");
  await tx.objectStore("user_profile").put(profile);
  await tx.done;
  console.log("User profile updated:", profile);
}

/**
 * Debug function to check database health and provide troubleshooting info
 */
export async function debugDatabaseHealth(): Promise<void> {
  try {
    console.log("=== Database Health Check ===");
    const db = await getDB();

    // Check object stores
    console.log("Available object stores:", Array.from(db.objectStoreNames));

    // Count records in each store
    const playerCount = await db.count("players");
    const questionCount = await db.count("questions");
    const packCount = await db.count("packs");
    const profileCount = await db.count("user_profile");

    console.log("Record counts:", {
      players: playerCount,
      questions: questionCount,
      packs: packCount,
      profiles: profileCount,
    });

    // Test player store specifically
    const tx = db.transaction("players", "readonly");
    const store = tx.objectStore("players");
    console.log("Player store keyPath:", store.keyPath);
    console.log("Player store autoIncrement:", store.autoIncrement);
    console.log("Player store indexes:", Array.from(store.indexNames));

    await tx.done;
    console.log("=== Database Health Check Complete ===");
  } catch (error) {
    console.error("Database health check failed:", error);
  }
}
