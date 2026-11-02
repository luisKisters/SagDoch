import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { Content } from "../scripts/content";

const DB_NAME = "truthOrDareDB";
const DB_VERSION = 7;

/**
 * Version des mitgelieferten Inhalts (Fragen + Packs). Wird beim Build aus data/*.csv berechnet
 * (siehe next.config.ts und scripts/content.ts) und in den Bundle eingebrannt.
 * Weicht sie von der in IndexedDB gespeicherten Version ab, wird der Inhalt beim Start
 * automatisch nachgeladen. `DB_VERSION` muss dafür NICHT erhöht werden,
 * sie ist nur noch für Schema-Änderungen (Stores/Indizes).
 */
const CONTENT_VERSION = process.env.NEXT_PUBLIC_CONTENT_VERSION ?? "";
const CONTENT_URL = "/data/content.json";

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
        // Die DB existiert noch nicht. Abbrechen, damit hier keine leere v1-DB entsteht
        // (sonst würde initDB() später ab Version 1 upgraden und die Basis-Stores überspringen).
        request.transaction?.abort();
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
  id?: number; // Auto-incremented, bleibt für unveränderte Fragen über Inhalts-Updates stabil
  uid?: string; // Inhaltsstabile ID (Hash), aus content.json

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
  meta: {
    key: string;
    value: { key: string; contentVersion: string; updatedAt: number };
  };
}

// Standard-Profil für neue Nutzer
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

          if (oldVersion < 7) {
            // V7: Inhalts-Updates laufen jetzt über CONTENT_VERSION (meta-Store).
            // Fragen ohne uid werden einmalig verworfen und neu geladen.
            // Spieler und Nutzerprofil bleiben unangetastet.
            db.createObjectStore("meta", { keyPath: "key" });
            // Nur "pack_type" wird abgefragt. Die beiden Einzel-Indizes kosten bei jedem
            // Schreiben einer Frage Zeit (Import beim ersten Start), ohne je gelesen zu werden.
            const qStore = transaction.objectStore("questions");
            for (const name of ["pack_name", "type"] as const) {
              if (qStore.indexNames.contains(name)) qStore.deleteIndex(name);
            }
            transaction.objectStore("packs").clear();
            transaction.objectStore("questions").clear();
          }
        } catch (upgradeError) {
          console.error("Error during database upgrade:", upgradeError);
          throw upgradeError;
        }
      },
      blocked() {
        console.warn("Database upgrade blocked by another connection");
      },
      blocking(_current, _blocked, event) {
        // Ein anderer Tab will auf eine neuere DB-Version. Verbindung freigeben,
        // sonst hängt dessen Upgrade für immer. Der nächste getDB()-Aufruf öffnet neu.
        console.warn("Database connection is blocking another upgrade, closing");
        (event.target as IDBDatabase | null)?.close();
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    });

    console.log("Database initialized successfully");
    return db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Inhalt (Fragen + Packs) synchronisieren
// ---------------------------------------------------------------------------

async function fetchContent(): Promise<Content> {
  const response = await fetch(CONTENT_URL);
  if (!response.ok) {
    throw new Error(`${CONTENT_URL}: HTTP ${response.status}`);
  }
  const content = (await response.json()) as Content;
  if (!content?.version || !Array.isArray(content.questions) || !Array.isArray(content.packs)) {
    throw new Error(`${CONTENT_URL}: unerwartetes Format`);
  }
  return content;
}

/**
 * Bringt Fragen und Packs in IndexedDB auf den Stand von content.json.
 *
 * - Schneller Pfad: Gespeicherte Version == CONTENT_VERSION des Bundles -> kein Netzwerk, nur ein Lesezugriff.
 * - Sonst: content.json holen (kommt per Service Worker auch offline aus dem Precache),
 *   Differenz anwenden: unveränderte Fragen behalten ihre numerische id (damit "zuletzt gestellt" stabil
 *   bleibt), neue kommen dazu, entfernte fallen weg. Alles in EINER Transaktion, auch bei parallelen Tabs.
 * - Ist das Netz weg und die DB schon gefüllt, wird der vorhandene Stand weiterbenutzt.
 */
async function syncContent(
  db: IDBPDatabase<TruthOrDareDBSchema>
): Promise<"current" | "updated" | "stale"> {
  const readState = async () => {
    const tx = db.transaction(["meta", "questions", "packs"], "readonly");
    const [meta, questions, packs] = await Promise.all([
      tx.objectStore("meta").get("content"),
      tx.objectStore("questions").count(),
      tx.objectStore("packs").count(),
    ]);
    return { version: meta?.contentVersion, filled: questions > 0 && packs > 0 };
  };

  const state = await readState();
  if (state.filled && CONTENT_VERSION && state.version === CONTENT_VERSION) {
    return "current";
  }

  let content: Content;
  try {
    content = await fetchContent();
  } catch (error) {
    if (state.filled) {
      console.warn("Inhalt konnte nicht aktualisiert werden, nutze vorhandenen Stand:", error);
      return "stale";
    }
    throw error; // leere DB und kein Inhalt: Aufrufer muss es sehen, nächster getDB() versucht es erneut
  }
  if (state.filled && state.version === content.version) return "current";

  const tx = db.transaction(["questions", "packs", "meta"], "readwrite");
  const questionStore = tx.objectStore("questions");
  const packStore = tx.objectStore("packs");

  // Fragen: per uid abgleichen. Alle Requests laufen parallel in der Transaktion.
  const wanted = new Set(content.questions.map((q) => q.uid));
  const have = new Set<string>();
  for (const existing of await questionStore.getAll()) {
    if (existing.uid && wanted.has(existing.uid) && !have.has(existing.uid)) {
      have.add(existing.uid);
    } else {
      questionStore.delete(existing.id!); // veraltet, ohne uid oder Dublette
    }
  }
  for (const q of content.questions) {
    if (!have.has(q.uid)) questionStore.add({ ...q });
  }

  // Packs: stabile String-IDs, einfach überschreiben und Entfernte löschen.
  const packIds = new Set(content.packs.map((p) => p.id));
  for (const key of await packStore.getAllKeys()) {
    if (!packIds.has(key)) packStore.delete(key);
  }
  for (const pack of content.packs) packStore.put(pack);

  tx.objectStore("meta").put({
    key: "content",
    contentVersion: content.version,
    updatedAt: Date.now(),
  });
  await tx.done;
  console.log(
    `Inhalt ${state.version ?? "(leer)"} -> ${content.version}: ${content.questions.length} Fragen, ${content.packs.length} Packs`
  );
  return "updated";
}

async function ensureUserProfile(
  db: IDBPDatabase<TruthOrDareDBSchema>
): Promise<void> {
  if ((await db.count("user_profile")) === 0) {
    await db.add("user_profile", defaultUserProfile);
  }
}

// Combined initialization function
async function initializeDatabase(): Promise<
  IDBPDatabase<TruthOrDareDBSchema>
> {
  const t0 = performance.now();
  try {
    const db = await initDB();
    const [result] = await Promise.all([syncContent(db), ensureUserProfile(db)]);
    // Sichtbar im Performance-Panel: "sagdoch:db-init" mit Ergebnis im detail.
    performance.measure("sagdoch:db-init", { start: t0, detail: { result } });
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

// Die DB wird erst im Browser und genau einmal geöffnet (nicht beim Import, damit der
// Server-Prerender nicht über "IndexedDB is not available" stolpert). Scheitert die
// Initialisierung (z. B. erster Start offline ohne Cache), versucht der nächste getDB()-Aufruf es neu.
let dbPromise: Promise<IDBPDatabase<TruthOrDareDBSchema>> | null = null;

export const getDB = (): Promise<IDBPDatabase<TruthOrDareDBSchema>> => {
  if (!dbPromise) {
    const attempt = initializeDatabase();
    dbPromise = attempt;
    attempt.catch(() => {
      if (dbPromise === attempt) dbPromise = null;
    });
  }
  return dbPromise;
};

/** Startet das Öffnen/Synchronisieren der DB im Hintergrund, z. B. schon auf dem Startscreen. */
export function warmUpDatabase(): void {
  if (typeof window !== "undefined") getDB().catch(() => {});
}

// Wie bisher: im Browser sofort beim ersten Import starten.
warmUpDatabase();

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
 * Alle Fragen eines Packs für einen Typ (ein Index-Zugriff, ca. 50 Datensätze).
 */
export async function getQuestionsForPack(
  packName: string,
  type: "truth" | "dare"
): Promise<Question[]> {
  const db = await getDB();
  return db.getAllFromIndex("questions", "pack_type", [packName, type]);
}

/**
 * Retrieves a random question of a specific type from a specific pack.
 * Für das Spiel gibt es `getNextTask` in lib/task.ts (berücksichtigt Zielperson und "zuletzt gestellt").
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
  const allQuestions = await getQuestionsForPack(packName, type);
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

// ---------------------------------------------------------------------------
// Spielstand (Pause / Fortsetzen)
//
// Bewusst in localStorage statt in einem neuen IndexedDB-Store: kein Schema-
// Update nötig, synchron lesbar und unabhängig vom Laden der Fragen/Packs.
// Die Spieler:innen selbst liegen weiter in IndexedDB (siehe oben).
// ---------------------------------------------------------------------------

export type GamePhase = "reveal" | "choice" | "task";

export interface GameTask {
  type: "truth" | "dare";
  text_template: string;
  requires_target: boolean;
  target_player_id: number | null;
}

export interface GameSession {
  /** true ab "Los", false solange nur Spieler/Pack eingerichtet werden */
  playing: boolean;
  pack_name: string;
  current_player_id: number | null;
  /** Anzahl abgeschlossener Züge; Runde = floor(turns / Spieleranzahl) + 1 */
  turns_played: number;
  phase: GamePhase;
  task: GameTask | null;
  updated_at: number;
}

const GAME_SESSION_KEY = "sagdoch.game.v1";

const EMPTY_GAME_SESSION: GameSession = {
  playing: false,
  pack_name: "",
  current_player_id: null,
  turns_played: 0,
  phase: "reveal",
  task: null,
  updated_at: 0,
};

/** Liest den gespeicherten Spielstand (oder einen leeren). SSR-sicher. */
export function getGameSession(): GameSession {
  if (typeof window === "undefined") return { ...EMPTY_GAME_SESSION };
  try {
    const raw = window.localStorage.getItem(GAME_SESSION_KEY);
    if (!raw) return { ...EMPTY_GAME_SESSION };
    return { ...EMPTY_GAME_SESSION, ...JSON.parse(raw) } as GameSession;
  } catch {
    return { ...EMPTY_GAME_SESSION };
  }
}

/** Mergt `patch` in den Spielstand, speichert und gibt ihn zurück. */
export function saveGameSession(patch: Partial<GameSession>): GameSession {
  const next: GameSession = {
    ...getGameSession(),
    ...patch,
    updated_at: Date.now(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(GAME_SESSION_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Could not save game session:", error);
    }
  }
  return next;
}

/** Beendet das Spiel. Die Spieler:innen bleiben erhalten, die Pack-Wahl auch. */
export function endGameSession(): GameSession {
  const { pack_name } = getGameSession();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(GAME_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  return saveGameSession({ ...EMPTY_GAME_SESSION, pack_name });
}

/** Ob ein laufendes Spiel gespeichert ist, das fortgesetzt werden kann. */
export function hasResumableGame(): boolean {
  const s = getGameSession();
  return s.playing && s.current_player_id !== null;
}
