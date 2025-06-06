# Developer PRD: Truth or Dare App - Version 2

**Version:** 2.2
**Date:** June 6, 2025
**Objective:** This document outlines the technical requirements for V2, building upon the V1 foundation. The focus is on implementing a full-featured Question Pack system, advanced player targeting logic, and a promotional unlocking mechanism, while preparing the data structure for a future ad-based unlock system.

---

## **Phase 3: Advanced Gameplay Logic & Data Structure**

This phase focuses on upgrading the core game logic and database schema to support V2 features before building the UI.

### 3.1. IndexedDB Schema Upgrade

- **Objective:** Evolve the database to support packs, unlocks, and more detailed player/question data, including groundwork for an ad-based unlock system.
- **Action:** Create a new DB version. Implement an upgrade path that preserves existing `players` data.

1.  **New `packs` Object Store:**

    - **Purpose:** Stores metadata for each question pack.
    - **Key Path:** `id` (e.g., a unique name like "default-pack").
    - **Structure:**
      ```typescript
      {
        id: string;
        name: string; // e.g., "Kennenlernrunde", "Spicy (18+)"
        description: string; // A short description of the pack's theme.
        is_18_plus: boolean; // For displaying an "18+" label.
        type: "truth_and_dare" | "only_truth" | "only_dare";
        is_locked: boolean; // Default 'true' for new packs, 'false' for "Default Pack".
        cost_in_ads: number; // For V3 monetization. The number of ads to watch to unlock.
      }
      ```

2.  **Updated `questions` Object Store:**

    - **Purpose:** Link questions directly to a pack.
    - **Structure:**
      ```typescript
      {
        id: number; // autoIncrement
        pack_id: string; // Foreign key referencing packs.id
        type: "truth" | "dare";
        text_template: string; // e.g., "{playerName}, ...", "{targetPlayerName}, ..."
        requires_target: boolean; // 'true' if the text_template uses {targetPlayerName}.
      }
      ```

3.  **New `user_profile` Object Store:**
    - **Purpose:** Store user-specific settings and unlock states.
    - **Key Path:** `id` (use a static key like "local_user_profile").
    - **Structure:**
      ```typescript
      {
        id: "local_user_profile";
        promo_code_activated: boolean; // Default 'false'.
        unlocked_pack_ids: string[]; // List of pack IDs unlocked.
        // For V3:
        // ad_watch_progress: { [packId: string]: number }; // Tracks ads watched per pack.
      }
      ```

### 3.2. Player Customization & Targeting Logic

- **Objective:** Make gameplay more personal by targeting questions based on player attractions.

1.  **Expand Sexuality Options:**

    - Update the selectable sexuality list to include: "Heterosexuell", "Homosexuell", "Bisexuell", "Pansexuell", "Asexuell".
    - **Developer Note:** Use consistent string literals for reliable logic.

2.  **Implement Targeting Logic (`lib/targeting.ts`):**

    - **Function:** `getTargetPlayers(currentPlayer: Player, allPlayers: Player[]): Player[]`
    - **Logic:** Return a list of valid target players based on the current player's gender and sexuality.
      - **Heterosexuell:** Attracted to the opposite gender.
      - **Homosexuell:** Attracted to the same gender.
      - **Bisexuell / Pansexuell:** Attracted to all genders.
      - **Asexuell:** Attracted to no one (returns empty array).

3.  **Update Game Logic (`pages/game/task.tsx`):**
    - When fetching a question, check if `question.requires_target`.
    - **If `true`:**
      1. Call `getTargetPlayers()` to get valid targets.
      2. **If targets exist:** Pick one randomly and replace both `{playerName}` and `{targetPlayerName}` placeholders.
      3. **If NO targets exist:** Discard the question and fetch a new one with `requires_target: false` to prevent dead ends.
    - **If `false`:** Proceed as in V1, replacing only `{playerName}`.

---

## **Phase 4: Content Generation & Management**

### 4.1. AI-Powered Question Generation Pipeline

- **Objective:** Establish a repeatable process to generate a large number of questions for packs using the Gemini API.
- **This is a development process, not an in-app feature.**
- **Action:** Create a local script (`scripts/generateQuestions.ts`) to call the Gemini API.

1.  **Define Prompt Structure:**

    - Create a standardized prompt to generate questions in a structured JSON format.
    - **Example Prompt:**
      > "Generate 20 questions for a 'Truth or Dare' game for the pack '{PACK_THEME}'. The pack is for adults: {IS_18_PLUS}. Generate {NUM_TRUTH} truth and {NUM_DARE} dare questions. For each, indicate if it requires targeting another player ('requires_target'). Provide the output as a JSON array of objects with keys: 'type' ('truth' or 'dare'), 'text_template' (string), and 'requires_target' (boolean)."

2.  **Script Functionality:**
    - The script takes arguments like `pack_name`, `theme`, etc., calls the API, and formats the response into a seed file for the database. This allows for rapid creation of packs.

---

## **Phase 5: UI/UX for Packs & Unlocks**

### 5.1. New Screen: Pack Selection (`pages/setup/packs.tsx`)

- **Objective:** Allow users to view and select which question pack to play with.
- **Visual Reference:** Access Figma design at `https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=41-801&t=TOcH5n3VXZpGAGxZ-4` via Framelink Figma MCP.
- **Navigation:** `Start -> Pack Select -> Player Select -> Play`.

- **UI Elements & Functionality:**
  1.  **Header:** Title "Wähle ein Pack".
  2.  **Promo Code Button:** A `Gift` or `Ticket` Lucide Icon in the top corner. Clicking it opens the promo code modal.
  3.  **Pack List/Grid:**
      - Fetch packs from `packs` and the user profile from `user_profile`.
      - Render a card for each pack containing its `name`, `description`, and "18+" label.
      - Display a `Lock` or `Unlock` Lucide Icon. **A pack is unlocked if `!pack.is_locked` OR `user_profile.promo_code_activated` is true OR `user_profile.unlocked_pack_ids.includes(pack.id)`.**
  4.  **Interaction:**
      - Tapping an unlocked pack highlights it and sets the `selectedPackId`.
      - Tapping a locked pack triggers a "Wiggle" animation (Framer Motion). In V3, this will open the ad-watch modal.
  5.  **"Weiter" Button:** Enabled only after an unlocked pack is selected. Navigates to `/setup/players`.

### 5.2. Promotional Code Unlock Modal

- **Objective:** Implement the timed promotional code feature.

- **UI (Modal):** Title "Code einlösen", input for "Promo-Code", "Einlösen" button, Close (`X`) button.
- **Functionality:**
  1.  On "Einlösen" click, validate the input code against a hardcoded value (e.g., "summerfun25").
  2.  Check that the current date is before the cutoff: `new Date("2025-07-16T00:00:00Z")`.
  3.  **If valid:**
      - Update `user_profile` in IndexedDB: `promo_code_activated = true`.
      - Close the modal and show a success message. The pack list should re-render to show all packs unlocked.
  4.  **If invalid:** Show an error message "Ungültiger oder abgelaufener Code."

---

## **Future Versions (V3 - Ad-Based Unlocks)**

This section outlines features planned for after V2. The V2 data structures are designed to support them.

### V3.1. Ad-Based Pack Unlocks

- **Objective:** Allow users to unlock individual packs by watching rewarded video ads.
- **Flow:**
  1.  User taps a locked pack card.
  2.  A modal appears: "Watch {pack.cost_in_ads} ads to unlock this pack forever."
  3.  A "Watch Ad" button is displayed.
  4.  **On successful ad completion:**
      - Integrate a mobile ad SDK (e.g., AdMob).
      - The `ad_watch_progress` object in the `user_profile` store needs to be created/updated. For example: `ad_watch_progress[pack.id]++`.
      - When `ad_watch_progress[pack.id]` equals `pack.cost_in_ads`, add the `pack.id` to the `unlocked_pack_ids` array and update the profile in IndexedDB.
      - The pack will now appear as unlocked.
