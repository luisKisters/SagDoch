"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllPlayers,
  Player,
  checkDatabaseCompatibility,
  clearOldDatabase,
} from "@/lib/db";
import DatabaseResetModal from "@/components/DatabaseResetModal";

type GameState = "rolling" | "choice_pending";

// Styles based on Figma data - matching the design
const choiceTextStyle =
  "text-white font-bold text-6xl md:text-8xl lg:text-9xl text-center leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]";
const playerNameStyle =
  "text-white font-bold text-5xl md:text-7xl lg:text-8xl text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]";

// Motion props for interactive areas
const interactiveMotionProps = {
  whileHover: { scale: 1.05, opacity: 0.95 },
  whileTap: { scale: 0.95 },
};

const interactiveClassName =
  "w-full h-full flex flex-col items-center justify-center cursor-pointer";

export default function PlayScreen() {
  const router = useRouter();

  // State management
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>("rolling");
  const [rollingIndex, setRollingIndex] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);

  // Load players from IndexedDB on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    async function loadPlayers() {
      try {
        // Check database compatibility first
        const { compatible, needsReset } = await checkDatabaseCompatibility();
        if (!compatible && needsReset) {
          // Show reset modal instead of immediate redirect
          setShowResetModal(true);
          return;
        }

        const players = await getAllPlayers();
        if (players.length < 2) {
          // Redirect to setup if insufficient players
          router.push("/setup/players?skip_continue=true");
          return;
        }
        setAllPlayers(players);
        startPlayerSelection(players);
      } catch (error) {
        console.error("Error loading players:", error);
        router.push("/setup/players?skip_continue=true");
      }
    }
    loadPlayers();
  }, [router]);

  // Start the player selection animation
  const startPlayerSelection = (players: Player[]) => {
    setGameState("rolling");

    // Create an extended rolling sequence for better animation
    const createRollingSequence = (players: Player[]) => {
      const sequence = [];
      const totalDuration = 2500;
      const intervalDuration = 150;
      const totalSteps = Math.floor(totalDuration / intervalDuration);

      // Create a sequence that goes through all players multiple times
      for (let i = 0; i < totalSteps; i++) {
        // Add some randomness but still cycle through all players
        if (players.length >= 3) {
          sequence.push(i % players.length);
        } else {
          // For 2 players, add extra variation
          const patterns = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
          sequence.push(patterns[i % patterns.length]);
        }
      }
      return sequence;
    };

    const rollingSequence = createRollingSequence(players);
    let sequenceIndex = 0;

    // Rolling animation for 2.5 seconds
    const rollingInterval = setInterval(() => {
      if (sequenceIndex < rollingSequence.length) {
        setRollingIndex(rollingSequence[sequenceIndex]);
        sequenceIndex++;
      }
    }, 150); // Change name every 150ms for rolling effect

    // Stop rolling and select final player
    setTimeout(() => {
      clearInterval(rollingInterval);
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      setCurrentPlayer(randomPlayer);
      setGameState("choice_pending");
    }, 2500);
  };

  // Handle choice selection
  const handleChoice = (type: "truth" | "dare") => {
    if (currentPlayer && gameState === "choice_pending") {
      router.push(`/game/task?player=${currentPlayer.id}&type=${type}`);
    }
  };

  // Start new round
  const startNewRound = () => {
    if (allPlayers.length >= 2) {
      setCurrentPlayer(null);
      startPlayerSelection(allPlayers);
    }
  };

  // Render player name in middle section
  const renderPlayerName = () => {
    if (gameState === "rolling" && allPlayers.length > 0) {
      return (
        <motion.div
          key={`rolling-${rollingIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={playerNameStyle}
          transition={{ duration: 0.1 }}
        >
          {allPlayers[rollingIndex]?.name}
        </motion.div>
      );
    }

    if (gameState === "choice_pending" && currentPlayer) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={playerNameStyle}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {currentPlayer.name}
        </motion.div>
      );
    }

    return null;
  };

  // Top section content - "Wahrheit"
  const topContent = (
    <motion.div
      {...(gameState === "choice_pending" ? interactiveMotionProps : {})}
      className={
        gameState === "choice_pending"
          ? interactiveClassName
          : "w-full h-full flex flex-col items-center justify-center"
      }
      onClick={() => gameState === "choice_pending" && handleChoice("truth")}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className={choiceTextStyle}
      >
        Wahrheit
      </motion.div>
    </motion.div>
  );

  // Bottom section content - "Pflicht"
  const bottomContent = (
    <motion.div
      {...(gameState === "choice_pending" ? interactiveMotionProps : {})}
      className={
        gameState === "choice_pending"
          ? interactiveClassName
          : "w-full h-full flex flex-col items-center justify-center"
      }
      onClick={() => gameState === "choice_pending" && handleChoice("dare")}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`${choiceTextStyle} text-[#0F0F1B]`} // Dark text on green background
      >
        Pflicht
      </motion.div>
    </motion.div>
  );

  // Handle reset modal confirmation
  const handleResetConfirm = async () => {
    try {
      await clearOldDatabase();
      setShowResetModal(false);
      router.push("/setup/players?skip_continue=true");
    } catch (error) {
      console.error("Error clearing database:", error);
      // Redirect anyway to avoid infinite loop
      router.push("/setup/players?skip_continue=true");
    }
  };

  return (
    <>
      <BackButton href="/setup/players?skip_continue=true" icon="x" />
      <Layout
        topSectionContent={topContent}
        bottomSectionContent={bottomContent}
        mainClassName="p-0 flex items-center justify-center"
      >
        <AnimatePresence mode="wait">{renderPlayerName()}</AnimatePresence>
      </Layout>
      <DatabaseResetModal
        isOpen={showResetModal}
        onConfirm={handleResetConfirm}
      />
    </>
  );
}
