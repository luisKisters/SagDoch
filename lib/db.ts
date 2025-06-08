import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "truthOrDareDB";
const DB_VERSION = 4;

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

const defaultQuestions: Omit<Question, "id">[] = [
  // Entspannt Pack questions (expanded to ~30 questions)
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was war dein peinlichster Moment?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was ist dein größter geheimer Wunsch?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was machst du wenn du alleine zuhause bist?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was denkst du über {targetPlayerName}?",
    requires_target: true,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was war dein schönstes Kindheitserlebnis?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template:
      "{playerName}, welche übernatürliche Fähigkeit hättest du gerne?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template: "{playerName}, was ist dein Lieblings-Netflix-Serie?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "truth",
    text_template:
      "{playerName}, mit wem hier würdest du gerne befreundet sein?",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template: "{playerName}, mache 10 Liegestütze.",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template: "{playerName}, singe dein Lieblingslied vor.",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template: "{playerName}, erzähle einen Witz.",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template: "{playerName}, tanze für 30 Sekunden.",
    requires_target: false,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template: "{playerName}, gib {targetPlayerName} ein Kompliment.",
    requires_target: true,
  },
  {
    pack_name: "Entspannt",
    type: "dare",
    text_template:
      "{playerName}, sprich für 2 Runden mit einem lustigen Akzent.",
    requires_target: false,
  },

  // Bisschen Spicy Pack questions
  {
    pack_name: "Bisschen Spicy",
    type: "truth",
    text_template: "{playerName}, hast du schon mal jemanden hier geküsst?",
    requires_target: false,
  },
  {
    pack_name: "Bisschen Spicy",
    type: "truth",
    text_template: "{playerName}, wen hier würdest du daten?",
    requires_target: false,
  },
  {
    pack_name: "Bisschen Spicy",
    type: "truth",
    text_template:
      "{playerName}, was findest du an {targetPlayerName} attraktiv?",
    requires_target: true,
  },
  {
    pack_name: "Bisschen Spicy",
    type: "dare",
    text_template: "{playerName}, gib {targetPlayerName} eine Umarmung.",
    requires_target: true,
  },
  {
    pack_name: "Bisschen Spicy",
    type: "dare",
    text_template: "{playerName}, flirte 30 Sekunden mit {targetPlayerName}.",
    requires_target: true,
  },

  // Partyyyy Pack questions
  {
    pack_name: "Partyyyy",
    type: "truth",
    text_template: "{playerName}, was war die wildeste Party deines Lebens?",
    requires_target: false,
  },
  {
    pack_name: "Partyyyy",
    type: "truth",
    text_template:
      "{playerName}, was ist das Verrückteste was du betrunken gemacht hast?",
    requires_target: false,
  },
  {
    pack_name: "Partyyyy",
    type: "dare",
    text_template: "{playerName}, mache den verrücktesten Tanz für 1 Minute!",
    requires_target: false,
  },
  {
    pack_name: "Partyyyy",
    type: "dare",
    text_template:
      "{playerName}, mache mit {targetPlayerName} ein TikTok Video!",
    requires_target: true,
  },
  {
    pack_name: "Partyyyy",
    type: "dare",
    text_template: "{playerName}, schreie aus dem Fenster 'ICH BIN GEIL!'",
    requires_target: false,
  },

  // Tiefgründig Pack questions
  {
    pack_name: "Tiefgründig",
    type: "truth",
    text_template: "{playerName}, was ist der Sinn des Lebens für dich?",
    requires_target: false,
  },
  {
    pack_name: "Tiefgründig",
    type: "truth",
    text_template: "{playerName}, was bereust du am meisten?",
    requires_target: false,
  },
  {
    pack_name: "Tiefgründig",
    type: "truth",
    text_template:
      "{playerName}, was würdest du {targetPlayerName} gerne sagen?",
    requires_target: true,
  },
  {
    pack_name: "Tiefgründig",
    type: "truth",
    text_template: "{playerName}, wofür bist du am dankbarsten?",
    requires_target: false,
  },

  // Alk/Kiffen Pack questions
  {
    pack_name: "Alk/Kiffen",
    type: "truth",
    text_template:
      "{playerName}, wann warst du das erste Mal richtig betrunken?",
    requires_target: false,
  },
  {
    pack_name: "Alk/Kiffen",
    type: "truth",
    text_template: "{playerName}, hast du schon mal gekifft?",
    requires_target: false,
  },
  {
    pack_name: "Alk/Kiffen",
    type: "truth",
    text_template: "{playerName}, mit wem hier würdest du gerne kiffen?",
    requires_target: false,
  },
  {
    pack_name: "Alk/Kiffen",
    type: "dare",
    text_template: "{playerName}, trinke einen Shot!",
    requires_target: false,
  },
  {
    pack_name: "Alk/Kiffen",
    type: "dare",
    text_template: "{playerName}, erzähle deine peinlichste Sauf-Geschichte.",
    requires_target: false,
  },

  // Spicy 18+ Pack questions
  {
    pack_name: "Spicy (18+)",
    type: "truth",
    text_template: "{playerName}, wann hattest du das letzte Mal Sex?",
    requires_target: false,
  },
  {
    pack_name: "Spicy (18+)",
    type: "truth",
    text_template: "{playerName}, mit wem hier würdest du schlafen?",
    requires_target: false,
  },
  {
    pack_name: "Spicy (18+)",
    type: "truth",
    text_template: "{playerName}, findest du {targetPlayerName} sexy?",
    requires_target: true,
  },
  {
    pack_name: "Spicy (18+)",
    type: "dare",
    text_template: "{playerName}, küsse {targetPlayerName} für 10 Sekunden.",
    requires_target: true,
  },

  // Verbundenheit Pack questions (BST special pack)
  {
    pack_name: "35. BST: Verbundenheit",
    type: "truth",
    text_template: "{playerName}, was bedeutet Verbundenheit für dich?",
    requires_target: false,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "truth",
    text_template:
      "{playerName}, fühlst du dich als Waldorfschüler*in anders verbunden als andere?",
    requires_target: false,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "truth",
    text_template:
      "{playerName}, was ist der Unterschied zwischen Mitleid und echter Verbundenheit?",
    requires_target: false,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "truth",
    text_template:
      "{playerName}, wann hast du zuletzt echte Verbundenheit gespürt?",
    requires_target: false,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "truth",
    text_template: "{playerName}, was verbindet dich mit {targetPlayerName}?",
    requires_target: true,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "dare",
    text_template:
      "{playerName}, teile eine persönliche Erfahrung, die dich geprägt hat.",
    requires_target: false,
  },
  {
    pack_name: "35. BST: Verbundenheit",
    type: "dare",
    text_template:
      "{playerName}, höre {targetPlayerName} 2 Minuten lang ehrlich zu.",
    requires_target: true,
  },
];

const defaultPacks: Pack[] = [
  {
    id: "entspannt",
    name: "Entspannt",
    description:
      "Klassische entspannte Fragen für gemütliche Runden mit Freunden",
    is_18_plus: false,
    type: "truth_and_dare",
    is_locked: false, // Default pack is always unlocked
    is_hidden: false,
    cost_in_ads: 0,
  },
  {
    id: "bisschen-spicy",
    name: "Bisschen Spicy",
    description:
      "Etwas würzigere Fragen für mutige Spieler - aber noch harmlos",
    is_18_plus: false,
    type: "truth_and_dare",
    is_locked: true,
    is_hidden: false,
    cost_in_ads: 3,
  },
  {
    id: "spicy-18",
    name: "Spicy (18+)",
    description: "Nur für Erwachsene - pikante Fragen und gewagte Aufgaben",
    is_18_plus: true,
    type: "truth_and_dare",
    is_locked: true,
    is_hidden: false,
    cost_in_ads: 8,
  },
  {
    id: "tiefgruendig",
    name: "Tiefgründig",
    description:
      "Philosophische und tiefgehende Fragen für bedeutungsvolle Gespräche",
    is_18_plus: false,
    type: "only_truth",
    is_locked: true,
    is_hidden: false,
    cost_in_ads: 4,
  },
  {
    id: "alk-kiffen",
    name: "Alk/Kiffen",
    description: "Wahrheit oder Pflicht Aufgaben für wenn man high/suff ist:)",
    is_18_plus: true,
    type: "truth_and_dare",
    is_locked: true,
    is_hidden: false,
    cost_in_ads: 6,
  },
  {
    id: "partyyyy",
    name: "Partyyyy",
    description: "Mega wilde Fragen und Aufgaben für die krassesten Partys!",
    is_18_plus: false,
    type: "truth_and_dare",
    is_locked: true,
    is_hidden: false,
    cost_in_ads: 5,
  },
  {
    id: "bst-verbundenheit",
    name: "35. BST: Verbundenheit",
    description: "Spezielle Fragen zum Thema Verbundenheit für die 35. BST",
    is_18_plus: false,
    type: "truth_and_dare",
    is_locked: true,
    is_hidden: true, // Hidden by default, unlocked with BST code
    cost_in_ads: 0,
  },
];

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

  const db = await openDB<TruthOrDareDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(
        `Upgrading database from version ${oldVersion} to ${newVersion}`
      );

      if (oldVersion < 1) {
        // Create initial v1 stores
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

        // Populate default questions for v1
        defaultQuestions.forEach((question) => {
          const store = transaction.objectStore("questions");
          store.add(question as Question);
        });
        console.log("Default questions populated for v1.");
      }

      if (oldVersion < 2) {
        // Create new v2 stores
        const packStore = db.createObjectStore("packs", {
          keyPath: "id",
        });

        const userProfileStore = db.createObjectStore("user_profile", {
          keyPath: "id",
        });

        // Populate default packs
        defaultPacks.forEach((pack) => {
          const store = transaction.objectStore("packs");
          store.add(pack);
        });
        console.log("Default packs populated for v2.");

        // Populate default user profile
        const userStore = transaction.objectStore("user_profile");
        userStore.add(defaultUserProfile);
        console.log("Default user profile populated for v2.");

        // Update existing questions to add requires_target field
        // Note: We'll handle this in the verification section since we can't easily await in upgrade callback
      }

      if (oldVersion < 3) {
        // V3: Update pack names and add new questions
        console.log("Upgrading to v3: Updating pack structure...");

        // Clear existing packs and questions to add new structure
        const packStore = transaction.objectStore("packs");
        const questionStore = transaction.objectStore("questions");

        packStore.clear();
        questionStore.clear();

        // Add new packs
        defaultPacks.forEach((pack) => {
          packStore.add(pack);
        });

        // Add new questions
        defaultQuestions.forEach((question) => {
          questionStore.add(question as Question);
        });

        console.log("V3 upgrade completed: New pack structure applied.");
      }

      if (oldVersion < 4) {
        // V4: Add is_hidden field to packs and bst_code_activated to user profile
        console.log(
          "Upgrading to v4: Adding hidden packs and BST code support..."
        );

        // Clear and recreate packs with new structure
        const packStore = transaction.objectStore("packs");
        const questionStore = transaction.objectStore("questions");
        const userProfileStore = transaction.objectStore("user_profile");

        packStore.clear();
        questionStore.clear();
        userProfileStore.clear();

        // Add updated packs with is_hidden field
        defaultPacks.forEach((pack) => {
          packStore.add(pack);
        });

        // Add updated questions including Verbundenheit
        defaultQuestions.forEach((question) => {
          questionStore.add(question as Question);
        });

        // Add updated user profile with bst_code_activated
        userProfileStore.add(defaultUserProfile);

        console.log(
          "V4 upgrade completed: Hidden packs and BST code support added."
        );
      }
    },
  });

  // Verify population for new databases
  const questionCount = await db.count("questions");
  if (questionCount === 0) {
    console.log("No questions found, populating default questions...");
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    for (const question of defaultQuestions) {
      await store.add(question as Question);
    }
    await tx.done;
    console.log("Default questions populated.");
  }

  const packCount = await db.count("packs");
  if (packCount === 0) {
    console.log("No packs found, populating default packs...");
    const tx = db.transaction("packs", "readwrite");
    const store = tx.objectStore("packs");
    for (const pack of defaultPacks) {
      await store.add(pack);
    }
    await tx.done;
    console.log("Default packs populated.");
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

  // Update existing questions to add requires_target field if needed
  const allQuestions = await db.getAll("questions");
  const questionsNeedingUpdate = allQuestions.filter(
    (q) => q.requires_target === undefined
  );
  if (questionsNeedingUpdate.length > 0) {
    console.log("Updating existing questions with requires_target field...");
    const tx = db.transaction("questions", "readwrite");
    const store = tx.objectStore("questions");
    for (const question of questionsNeedingUpdate) {
      question.requires_target = false; // Default to false for existing questions
      await store.put(question);
    }
    await tx.done;
    console.log("Updated existing questions with requires_target field.");
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
