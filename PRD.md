# Developer PRD: Truth or Dare App - Version 1

**Version:** 1.3
**Date:** June 2, 2025
**Objective:** This document outlines the technical requirements and step-by-step implementation guide for Version 1 of the "Truth or Dare" PWA. The UI and in-app text are in German.

## 1. Core Technologies & Setup

### 1.1. Technology Stack

- **Framework:** Next.js (TypeScript)
- **Styling:** Tailwind CSS (preferred), shadcn/ui components (optional, for pre-built UI).
- **State Management:** React Context API / `useState` / `useReducer`.
- **Animations:** Framer Motion.
- **Icons:** Lucide Icons.
- **Offline/PWA:** Serwist for Next.js.
- **Local Storage:** IndexedDB.
- **Font:** Orbitron (Google Fonts).

### 1.2. Global Styles & Layout

1.  **Integrate Orbitron Font:**
    - Add Orbitron font via Google Fonts (e.g., in `_app.tsx` or global CSS).
    - Set Orbitron as the default font in `tailwind.config.js` or global styles.
2.  **Main Layout Component (`components/Layout.tsx`):**
    - Implement the three-part color scheme:
      - Top section: `bg-[#FF005C]` (Red)
      - Middle section: `bg-[#0F0F1B]` (Dark Blue)
      - Bottom section: `bg-[#00FFC6]` (Green)
    - The component should take `children` to render page-specific content, likely in the middle section or spanning sections as per Figma.
    - Ensure the layout is responsive and fills the viewport.

### 1.3. PWA & Offline Setup (Serwist)

- **Reference:** [Serwist Next.js Guide](https://serwist.pages.dev/docs/next/getting-started)

1.  **Install Serwist:**

    ```bash
    pnpm add @serwist/next serwist
    # or
    npm install @serwist/next serwist
    # or
    yarn add @serwist/next serwist
    ```

    _(Note: The PRD mentioned `npm install @serwist/next` but the guide also includes `serwist` as a dev dependency. Adjusted to include `serwist` and preferred `pnpm` as per project files.)_

2.  **Configure `next.config.mjs` (or `next.config.js`):**
    Update or create your Next.js configuration file. If using TypeScript, prefer `next.config.mjs`.

    ```javascript
    // next.config.mjs
    import withSerwistInit from "@serwist/next";

    const withSerwist = withSerwistInit({
      // Note: This is only an example. If you use Pages Router,
      // use something else that works, such as "service-worker/index.ts".
      swSrc: "app/sw.ts",
      swDest: "public/sw.js",
      // Additional Serwist options from original PRD (if still applicable):
      cacheOnNavigation: true,
      reloadOnOnline: true,
      // Ensure app shell and static assets (including default questions) are cached for V1.
      // Potentially add runtimeCaching strategies here if defaultCache isn't sufficient.
    });

    /** @type {import('next').NextConfig} */
    const nextConfig = {
      // Your existing Next.js config
      reactStrictMode: true,
    };

    export default withSerwist(nextConfig);
    ```

3.  **Update `tsconfig.json` (If using TypeScript):**
    Add the following to your `tsconfig.json`:

    ```json
    {
      // Other stuff...
      "compilerOptions": {
        // Other options...
        "types": [
          // Other types...
          // This allows Serwist to type `window.serwist`.
          "@serwist/next/typings"
        ],
        "lib": [
          // Other libs...
          // Add this! Doing so adds WebWorker and ServiceWorker types to the global.
          "webworker"
        ]
      },
      "exclude": [
        // Other excludes...
        "public/sw.js" // Exclude the generated service worker
      ]
    }
    ```

4.  **Update `.gitignore` (If using Git):**
    Add the following lines to your `.gitignore` file:

    ```gitignore
    # Serwist
    public/sw*
    public/swe-worker*
    ```

5.  **Create Service Worker File (`app/sw.ts`):**
    Basic service worker template:

    ```typescript
    // app/sw.ts
    import { defaultCache } from "@serwist/next/worker";
    import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
    import { Serwist } from "serwist";

    // This declares the value of `injectionPoint` to TypeScript.
    // `injectionPoint` is the string that will be replaced by the
    // actual precache manifest. By default, this string is set to
    // `"self.__SW_MANIFEST"`.
    declare global {
      interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
      }
    }

    declare const self: ServiceWorkerGlobalScope;

    const serwist = new Serwist({
      precacheEntries: self.__SW_MANIFEST,
      skipWaiting: true,
      clientsClaim: true,
      navigationPreload: true, // Consider if this is needed for V1 based on app shell strategy
      runtimeCaching: defaultCache, // Start with default caching; customize as needed for V1 assets
    });

    serwist.addEventListeners();
    ```

6.  **Web App Manifest (`public/manifest.json`):**
    Create or update `public/manifest.json` (for Pages Router, or `app/manifest.json` for App Router - PRD uses Pages Router style for `/play` etc., so `public/manifest.json` is appropriate):

    ```json
    {
      "name": "Wahrheit oder Pflicht App", // Adjusted name
      "short_name": "W/P App", // Adjusted short_name
      "icons": [
        {
          "src": "/icons/android-chrome-192x192.png", // Ensure these icons exist
          "sizes": "192x192",
          "type": "image/png",
          "purpose": "maskable"
        },
        {
          "src": "/icons/icon-512x512.png", // Ensure these icons exist
          "sizes": "512x512",
          "type": "image/png"
        }
      ],
      "theme_color": "#0F0F1B", // Match dark blue from scheme
      "background_color": "#0F0F1B", // Match dark blue from scheme
      "start_url": "/",
      "display": "standalone",
      "orientation": "portrait"
    }
    ```

    - Link this manifest in your `app/layout.tsx` (or `pages/_document.tsx` / `pages/_app.tsx` if using Pages Router).

7.  **Add Metadata (in `app/layout.tsx` or `pages/_app.tsx`):**
    Add the following to your main layout file. For a Next.js app with an `app` directory, this would be `app/layout.tsx`.

    ```typescript
    // app/layout.tsx (example)
    import type { Metadata, Viewport } from "next";
    import type { ReactNode } from "react";

    const APP_NAME = "Wahrheit oder Pflicht"; // German
    const APP_DEFAULT_TITLE = "Wahrheit oder Pflicht Spiel"; // German
    const APP_TITLE_TEMPLATE = "%s - W/P App"; // German
    const APP_DESCRIPTION = "Spiele Wahrheit oder Pflicht mit deinen Freunden!"; // German

    export const metadata: Metadata = {
      applicationName: APP_NAME,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
      manifest: "/manifest.json", // Link to the manifest
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: APP_DEFAULT_TITLE,
        // startUpImage: [], // Optional: Add startup images
      },
      formatDetection: {
        telephone: false,
      },
      openGraph: {
        type: "website",
        siteName: APP_NAME,
        title: {
          default: APP_DEFAULT_TITLE,
          template: APP_TITLE_TEMPLATE,
        },
        description: APP_DESCRIPTION,
      },
      twitter: {
        card: "summary",
        title: {
          default: APP_DEFAULT_TITLE,
          template: APP_TITLE_TEMPLATE,
        },
        description: APP_DESCRIPTION,
      },
    };

    export const viewport: Viewport = {
      themeColor: "#0F0F1B", // Match dark blue from scheme
    };

    export default function RootLayout({ children }: { children: ReactNode }) {
      return (
        <html lang="de" dir="ltr">
          {" "}
          {/* Adjusted to German */}
          <head />
          <body>{children}</body>
        </html>
      );
    }
    ```

    _(Note: The original manifest details in the PRD were minimal. This adds more comprehensive metadata as per the Serwist guide, adapted with German text and app-specific details like theme color.)_

8.  **Verify:** Test PWA installation and offline capabilities in a production build.

### 1.4. IndexedDB Setup

1.  **Create DB Helper (`lib/db.ts` or `utils/db.ts`):**
    - Function to open/initialize the database (`truthOrDareDB`).
    - Define schema version 1.
    - Create `players` object store:
      - Key path: `id` (autoIncrement or UUID string).
      - Indexes: `name` (optional, if searching by name).
      - Structure: `{ id, name: string, gender: string, sexuality: string, timestamp_added: Date }`
    - Create `questions` object store:
      - Key path: `id` (autoIncrement).
      - Indexes: `pack_name`, `type`.
      - Structure: `{ id, pack_name: string, type: "truth" | "dare", text_template: string }`
2.  **Initial Data Population:**
    - On DB initialization (if empty or new version), populate `questions` store with 10 default questions:
      - 5 "truth", 5 "dare".
      - `pack_name`: "Default Pack".
      - `text_template` should include a placeholder like `{playerName}`.
      - Example Truth: `{ id: 1, pack_name: "Default Pack", type: "truth", text_template: "{playerName}, was war dein peinlichster Moment in der Schule?" }`
      - Example Dare: `{ id: 6, pack_name: "Default Pack", type: "dare", text_template: "{playerName}, mache 10 Liegestütze." }`
3.  **CRUD Functions:**
    - Implement helper functions for:
      - `addPlayer(player)`
      - `getAllPlayers()`
      - `getPlayerById(id)` (optional for V1)
      - `updatePlayer(player)` (optional for V1)
      - `deletePlayer(id)` (optional for V1)
      - `getRandomQuestion(packName, type)`

## 2. Feature Implementation (Phase-Based)

### Phase 2.0: Game Mode Selection Screen (`pages/index.tsx`)

- **Objective:** Allow users to select the "Wahrheit oder Pflicht" game mode.
- **Visual Reference:** [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=2-2&t=5uCaEMccvlGdaRtd-4) (FileKey: `kVMqBjFmCYm7mhf83rwndx`, NodeID: `2-2`). _(Note: Use Framelink MCP to get details)._
- **UI Elements (German Text):**
  - Top Red Area: Text "Wahrheit oder Pflicht".
  - Middle Dark Blue Area: Clickable Text "Wähle".
  - Bottom Green Area: Clickable Text "Ich hab noch nie".
- **Functionality:**
  1.  Make "Wahrheit oder Pflicht" (top area) and "Wähle" (middle area) effectively one clickable region leading to player setup.
  2.  "Ich hab noch nie" (bottom area):
      - On click, display a simple, non-blocking message (e.g., using a toast or a small overlay): "Kommt bald!" or style it as inactive (`text-[#8E8E99]`, `pointer-events-none`).
- **State Management:** None specific to this screen.
- **Navigation:**
  - Clicking "Wahrheit oder Pflicht" / "Wähle" navigates to `/setup/players` (Player Setup Screen).
- **Animations (Framer Motion):**
  - Subtle fade-in/slide-up for text elements on load.
  - Scale/opacity change on hover/tap for clickable areas.

### Phase 2.1: Player Setup Screen (`pages/setup/players.tsx`)

- **Objective:** Allow users to add multiple players with name, gender, and sexuality.
- **Visual References:** _(Note: Use Framelink MCP with FileKey `kVMqBjFmCYm7mhf83rwndx` and the respective NodeIDs below to get details)._
  - Empty input: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=8-30&t=5uCaEMccvlGdaRtd-4) (NodeID: `8-30`)
  - Name input filled: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=28-277&t=5uCaEMccvlGdaRtd-4) (NodeID: `28-277`)
  - Multiple players & start: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=41-358&t=5uCaEMccvlGdaRtd-4) (NodeID: `41-358`)
- **UI Elements (German Text & Lucide Icons):**
  - **Top Red Area:**
    - Title: "Spieler:innen".
    - Player List: Dynamically display added players. Each item shows `player.name`.
      - _V1 Simplification:_ No edit/delete icons per player initially.
  - **Middle Dark Blue Area (Input Section):**
    - Input field: `type="text"`, placeholder "Name....", bind to `currentName` state.
    - "Next" Button: Right-arrow Lucide Icon (`ArrowRight`). Enabled only if `currentName` is not empty.
  - **Middle Dark Blue Area (Start Game Section - visible if >= 2 players):**
    - "Spiel starten" Button: Play Lucide Icon (`Play`). Visible and enabled if `players.length >= 2`.
  - **Gender Selection Modal/Step (conditionally rendered):**
    - Visual Ref: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=29-361&t=5uCaEMccvlGdaRtd-4) (NodeID: `29-361`). _(Note: Use Framelink MCP to get details)._
    - Title: "Geschlecht für {currentName}"
    - Options (e.g., "Männlich", "Weiblich", "Divers") selectable with Left/Right arrow icons and displayed text.
    - "Next" Button: Right-arrow Lucide Icon.
  - **Sexuality Selection Modal/Step (conditionally rendered):**
    - Visual Ref: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=29-509&t=5uCaEMccvlGdaRtd-4) (NodeID: `29-509`). _(Note: Use Framelink MCP to get details)._
    - Title: "Sexualität für {currentName}"
    - Options (e.g., "Hetero", "Homosexuell", "Bisexuell", "Andere") selectable.
    - "Confirm" Button: Checkmark Lucide Icon (`Check`).
- **State Management (`useState`, `useContext` if preferred):**
  - `playersList`: Array of player objects, fetched from IndexedDB on mount, updated on add.
  - `currentStep`: String ("name", "gender", "sexuality") to manage the multi-step input flow.
  - `currentName`: String for the name input.
  - `currentGender`: String for selected gender.
  - `currentSexuality`: String for selected sexuality.
- **Functionality - Step-by-Step:**
  1.  **Initial Load:**
      - Fetch all players from IndexedDB and populate `playersList`.
      - Set `currentStep` to "name".
  2.  **Name Input (`currentStep === "name"`):**
      - User types name into input field, updating `currentName`.
      - On "Next" button click (ArrowRight icon):
        - If `currentName` is valid, set `currentStep` to "gender".
  3.  **Gender Selection (`currentStep === "gender"`):**
      - User selects gender. Update `currentGender`.
      - On "Next" button click: Set `currentStep` to "sexuality".
  4.  **Sexuality Selection (`currentStep === "sexuality"`):**
      - User selects sexuality. Update `currentSexuality`.
      - On "Confirm" button click (Check icon):
        - Create new player object: `{ name: currentName, gender: currentGender, sexuality: currentSexuality, timestamp_added: new Date() }`.
        - Add player to IndexedDB using `addPlayer()`.
        - Refetch `playersList` or append to local list and update UI.
        - Reset: `currentName = ""`, `currentGender = ""`, `currentSexuality = ""`, `currentStep = "name"`.
  5.  **Displaying Player List:**
      - Render `playersList` in the top red area.
  6.  **"Spiel starten" Button:**
      - If `playersList.length >= 2`, show and enable this button.
      - On click, navigate to `/play`.
- **Data Persistence:**
  - Read: `getAllPlayers()` on mount.
  - Write: `addPlayer()` after sexuality confirmation.
- **Navigation:**
  - "Spiel starten" button -> `/play`.
- **Animations (Framer Motion):**
  - Player items in list: Animate in/out (`AnimatePresence`).
  - Input steps (name, gender, sexuality): Slide/fade transitions between steps.

### Phase 2.2: Gameplay Screen - Player Turn & Selection (`pages/play.tsx`)

- **Objective:** Randomly select a player whose turn it is, then allow them to choose Truth or Dare.
- **Visual References:** _(Note: Use Framelink MCP with FileKey `kVMqBjFmCYm7mhf83rwndx` and the respective NodeIDs below to get details)._
  - Name roll/selection (conceptual, use middle bar): Implied by flow.
  - Truth/Dare choice: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=41-612&t=5uCaEMccvlGdaRtd-4) (NodeID: `41-612`)
- **UI Elements (German Text):**
  - **Top Red Area (Choice Phase):** Clickable Text "Wahrheit".
  - **Middle Dark Blue Area:**
    - **Animation Phase:** Display player names rolling/shuffling rapidly. Stops on the `currentPlayerName`.
    - **Choice Phase:** Display `currentPlayerName`.
  - **Bottom Green Area (Choice Phase):** Clickable Text "Pflicht".
- **State Management:**
  - `allPlayers`: Array of player objects, fetched from IndexedDB on mount.
  - `currentPlayer`: Object, the currently selected player.
  - `gameState`: String ("rolling", "choice_pending").
- **Functionality - Step-by-Step:**
  1.  **Initial Load / New Round:**
      - Fetch `allPlayers` from IndexedDB (if not already in a global context).
      - If `allPlayers` is empty or less than 2, redirect to `/setup/players`.
      - Set `gameState` to "rolling".
      - **Player Selection Animation:**
        - Implement a Framer Motion animation in the middle bar showing names shuffling.
        - After a short duration (e.g., 2-3 seconds), randomly select a player from `allPlayers`.
        - Set `currentPlayer` to the selected player.
        - Set `gameState` to "choice_pending".
  2.  **Choice Pending (`gameState === "choice_pending"`):**
      - Display `currentPlayer.name` in the middle bar.
      - Enable clicks on "Wahrheit" (top area) and "Pflicht" (bottom area).
      - On "Wahrheit" click: Navigate to `/game/task?player=${currentPlayer.id}&type=truth`.
      - On "Pflicht" click: Navigate to `/game/task?player=${currentPlayer.id}&type=dare`.
- **Data Persistence:** Read `getAllPlayers()`.
- **Navigation:**
  - To `/game/task` with query parameters.
  - Redirect to `/setup/players` if insufficient players.
- **Animations (Framer Motion):**
  - **Player Roll:** Animate `y` position and `opacity` of multiple name elements to create a slot machine effect.
  - Selected name: Animate scale/emphasis.
  - Hover/tap on "Wahrheit"/"Pflicht".

### Phase 2.3: Task Display Screen (`pages/game/task.tsx`)

- **Objective:** Display the truth question or dare task for the current player.
- **Visual References:** _(Note: Use Framelink MCP with FileKey `kVMqBjFmCYm7mhf83rwndx` and the respective NodeIDs below to get details)._
  - Truth: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=51-681&t=5uCaEMccvlGdaRtd-4) (NodeID: `51-681`)
  - Dare: [Figma Link](https://www.figma.com/design/kVMqBjFmCYm7mhf83rwndx/SagDoch-Design?node-id=54-700&t=5uCaEMccvlGdaRtd-4) (NodeID: `54-700`)
- **UI Elements (German Text):**
  - **Top Red Area:**
    - If Truth: Display the truth question text (e.g., "{PlayerName}, hast du...").
    - If Dare: Empty or inactive "Wahrheit" title (greyed out).
  - **Middle Dark Blue Area:**
    - "Weiter" Button. Styled Red (`bg-[#FF005C]`) if Truth, Green (`bg-[#00FFC6]`) if Dare.
  - **Bottom Green Area:**
    - If Dare: Display the dare task text (e.g., "{PlayerName}, du musst...").
    - If Truth: Empty or inactive "Pflicht" title (greyed out).
- **State Management:**
  - `taskText`: String, the displayed question/dare.
  - `taskType`: "truth" | "dare".
  - `playerName`: String.
- **Functionality - Step-by-Step:**
  1.  **Initial Load (from `useRouter().query`):**
      - Get `playerId` and `taskType` from URL query parameters.
      - Fetch player details (especially name) from IndexedDB using `playerId` (or pass player name via query/state).
      - Fetch a random question/task from IndexedDB using `getRandomQuestion("Default Pack", taskType)`.
      - Replace `{playerName}` placeholder in `task.text_template` with the actual player's name.
      - Set `taskText`, `taskType`, `playerName` states.
  2.  **Display:** Render UI based on `taskType`.
  3.  **"Weiter" Button Click:**
      - Navigate back to `/play` to start a new round.
- **Data Persistence:**
  - Read: `getPlayerById(playerId)` (or have player data passed).
  - Read: `getRandomQuestion(packName, type)`.
- **Navigation:** To `/play`.
- **Animations (Framer Motion):**
  - Task text: Animate in (e.g., fade, slide, or character-by-character).
  - "Weiter" button: Hover/tap effect.

## 3. Future Versions (V2 - Key Ideas)

- **Question Pack System:** UI for selecting packs (e.g., "Spicy (18+)"), storing selected pack in state/DB, loading questions based on `pack_name`.
- **Custom Questions:** Allow users to add questions to packs or a custom pack.
- **Player Management:** Edit/delete players from the list on the setup screen.
- **"Ich hab noch nie" Mode:** Full implementation of this game mode.
