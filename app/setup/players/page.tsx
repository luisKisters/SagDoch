"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Play,
  Check,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  getAllPlayers,
  addPlayer,
  Player,
  deleteAllPlayers,
  deletePlayer,
  debugDatabaseHealth,
} from "@/lib/db";
import { useRouter } from "next/navigation";

type CurrentStep = "name" | "gender" | "sexuality";

// Gender and sexuality options
const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers"];
const SEXUALITY_OPTIONS = ["Hetero", "Homo", "Bi", "Pan", "Ace"];

// Styles based on Figma data - resized for mobile
const titleStyle =
  "text-white font-bold text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]";
const inputStyle =
  "text-white font-bold text-5xl bg-transparent border-none outline-none placeholder-[#8E8E99] w-full h-12";
const playerCardStyle =
  "bg-white rounded-xl p-3 mb-3 flex items-center justify-between shadow-[0_0_8px_rgba(0,0,0,0.15)]";
const playerNameStyle = "text-[#FF005C] font-medium text-lg";
const selectionTextStyle = "text-[#FF005C] font-medium text-3xl text-center";

export default function PlayerSetupScreen() {
  const router = useRouter();

  // State management
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [currentStep, setCurrentStep] = useState<CurrentStep>("name");
  const [currentName, setCurrentName] = useState("");
  const [currentGender, setCurrentGender] = useState("");
  const [currentSexuality, setCurrentSexuality] = useState("");
  const [selectedGenderIndex, setSelectedGenderIndex] = useState(0);
  const [selectedSexualityIndex, setSelectedSexualityIndex] = useState(0);
  const [showPlayerError, setShowPlayerError] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);

  // Load players from IndexedDB on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    async function loadPlayers() {
      try {
        // Debug database health
        await debugDatabaseHealth();

        const players = await getAllPlayers();
        setPlayersList(players);

        // Check if there are existing players (game session) and no skip param
        const urlParams = new URLSearchParams(window.location.search);
        const skipContinueModal = urlParams.get("skip_continue") === "true";

        if (players.length >= 2 && !skipContinueModal) {
          setShowContinueModal(true);
        }
      } catch (error) {
        console.error("Error loading players:", error);
      }
    }
    loadPlayers();
  }, []);

  // Handle continue session
  const handleContinueSession = () => {
    setShowContinueModal(false);
    router.push("/play");
  };

  // Handle new session
  const handleNewSession = async () => {
    try {
      await deleteAllPlayers();
      setPlayersList([]);
      setShowContinueModal(false);
    } catch (error) {
      console.error("Error clearing players:", error);
      setShowContinueModal(false);
    }
  };

  // Handle delete player
  const handleDeletePlayer = async (playerId: number) => {
    try {
      await deletePlayer(playerId);
      setPlayersList((prev) => prev.filter((player) => player.id !== playerId));
    } catch (error) {
      console.error("Error deleting player:", error);
    }
  };

  // Handle name input next button
  const handleNameNext = () => {
    if (currentName.trim()) {
      setCurrentStep("gender");
      setSelectedGenderIndex(0); // Reset to first option
      setCurrentGender(GENDER_OPTIONS[0]);
    }
  };

  // Handle gender selection
  const handleGenderNavigation = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (selectedGenderIndex - 1 + GENDER_OPTIONS.length) %
          GENDER_OPTIONS.length
        : (selectedGenderIndex + 1) % GENDER_OPTIONS.length;
    setSelectedGenderIndex(newIndex);
    setCurrentGender(GENDER_OPTIONS[newIndex]);
  };

  const handleGenderNext = () => {
    setCurrentStep("sexuality");
    setSelectedSexualityIndex(0); // Reset to first option
    setCurrentSexuality(SEXUALITY_OPTIONS[0]);
  };

  // Handle sexuality selection
  const handleSexualityNavigation = (direction: "left" | "right") => {
    const newIndex =
      direction === "left"
        ? (selectedSexualityIndex - 1 + SEXUALITY_OPTIONS.length) %
          SEXUALITY_OPTIONS.length
        : (selectedSexualityIndex + 1) % SEXUALITY_OPTIONS.length;
    setSelectedSexualityIndex(newIndex);
    setCurrentSexuality(SEXUALITY_OPTIONS[newIndex]);
  };

  const handleSexualityConfirm = async () => {
    try {
      // Add player to IndexedDB
      const newPlayerId = await addPlayer({
        name: currentName,
        gender: currentGender,
        sexuality: currentSexuality,
      });

      // Add to local state
      const newPlayer: Player = {
        id: newPlayerId,
        name: currentName,
        gender: currentGender,
        sexuality: currentSexuality,
        timestamp_added: new Date(),
      };
      setPlayersList((prev) => [...prev, newPlayer]);

      // Reset form
      setCurrentName("");
      setCurrentGender("");
      setCurrentSexuality("");
      setCurrentStep("name");
    } catch (error) {
      console.error("Error adding player:", error);
    }
  };

  // Handle weiter button click - now goes to pack selection
  const handleWeiterClick = (e: React.MouseEvent) => {
    if (playersList.length < 2) {
      e.preventDefault();
      setShowPlayerError(true);
      setTimeout(() => setShowPlayerError(false), 3000); // Hide error after 3 seconds
      return;
    }

    // Ensure selected pack is in sessionStorage, fallback to Entspannt
    if (!sessionStorage.getItem("selectedPackName")) {
      sessionStorage.setItem("selectedPackName", "Entspannt");
    }
  };

  // Render player cards in top section
  const renderPlayerCards = () => (
    <div className="w-full max-h-full overflow-y-auto px-2">
      <div className="flex items-center justify-between mb-3">
        <BackButton href="/" inline />
        <motion.h1 className={`${titleStyle} pl-2 flex-1`}>
          Spieler:innen
        </motion.h1>
        <div className="w-12"></div> {/* Spacer to center the title */}
      </div>
      <AnimatePresence>
        {playersList.map((player) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={playerCardStyle}
          >
            <span className={playerNameStyle}>{player.name}</span>
            <div className="flex gap-2">
              <button
                className="w-10 h-6 bg-[#FF005C] rounded-lg flex items-center justify-center"
                onClick={() => {
                  // TODO: Add edit functionality if needed
                  console.log("Edit player:", player.name);
                }}
              >
                <Settings size={16} color="white" />
              </button>
              <button
                className="w-10 h-6 bg-[#FF005C] rounded-lg flex items-center justify-center"
                onClick={() => handleDeletePlayer(player.id!)}
              >
                <Trash2 size={16} color="white" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Error message for insufficient players */}
      <AnimatePresence>
        {showPlayerError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-500 text-white rounded-lg text-center font-medium"
          >
            Du brauchst mindestens 2 Spieler!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render name input step
  const renderNameInput = () => (
    <div className="relative flex items-center w-full px-2 h-4/5">
      <input
        type="text"
        placeholder="Name...."
        value={currentName}
        onChange={(e) => setCurrentName(e.target.value)}
        className={inputStyle}
        style={{ textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
      />
      {/* Only show next arrow if user is typing a name */}
      {currentName.trim() && (
        <motion.button
          onClick={handleNameNext}
          className="w-12 h-12 bg-[#FF005C] rounded-xl flex items-center justify-center absolute top-1/2 transform -translate-y-1/2 right-2"
          style={{
            width: "48px",
            height: "48px",
            minWidth: "48px",
            minHeight: "48px",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowRight size={24} color="#0F0F1B" />
        </motion.button>
      )}
      {/* Show weiter button when not typing - gray if insufficient players */}
      {!currentName.trim() && (
        <Link href={playersList.length >= 2 ? "/setup/packs" : "#"}>
          <motion.button
            className={`w-12 h-12 rounded-xl flex items-center justify-center absolute top-1/2 transform -translate-y-1/2 right-2 ${
              playersList.length >= 2
                ? "bg-[#FF005C]"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              minHeight: "48px",
            }}
            whileHover={playersList.length >= 2 ? { scale: 1.05 } : {}}
            whileTap={playersList.length >= 2 ? { scale: 0.95 } : {}}
            onClick={handleWeiterClick}
          >
            <ArrowRight
              size={24}
              color={playersList.length >= 2 ? "#0F0F1B" : "#666"}
            />
          </motion.button>
        </Link>
      )}
    </div>
  );

  // Render gender selection step
  const renderGenderSelection = () => (
    <div className="flex items-center justify-center w-full px-2 h-4/5">
      <motion.button
        onClick={() => handleGenderNavigation("left")}
        className="w-12 h-12 flex items-center justify-center"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft size={28} color="#FF005C" />
      </motion.button>

      <div
        className="flex-1 text-center mx-4 flex items-center justify-center"
        style={{ height: "48px" }}
      >
        <motion.div
          key={currentGender}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={selectionTextStyle}
        >
          {currentGender}
        </motion.div>
      </div>

      <motion.button
        onClick={() => handleGenderNavigation("right")}
        className="w-12 h-12 flex items-center justify-center"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight size={28} color="#FF005C" />
      </motion.button>

      <motion.button
        onClick={handleGenderNext}
        className="w-12 h-12 bg-[#FF005C] rounded-xl flex items-center justify-center ml-4"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowRight size={24} color="#0F0F1B" />
      </motion.button>
    </div>
  );

  // Render sexuality selection step
  const renderSexualitySelection = () => (
    <div className="flex items-center justify-center w-full px-2 h-4/5">
      <motion.button
        onClick={() => handleSexualityNavigation("left")}
        className="w-12 h-12 flex items-center justify-center"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft size={28} color="#FF005C" />
      </motion.button>

      <div
        className="flex-1 text-center mx-4 flex items-center justify-center"
        style={{ height: "48px" }}
      >
        <motion.div
          key={currentSexuality}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={selectionTextStyle}
        >
          {currentSexuality}
        </motion.div>
      </div>

      <motion.button
        onClick={() => handleSexualityNavigation("right")}
        className="w-12 h-12 flex items-center justify-center"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronRight size={28} color="#FF005C" />
      </motion.button>

      <motion.button
        onClick={handleSexualityConfirm}
        className="w-12 h-12 bg-[#FF005C] rounded-xl flex items-center justify-center ml-4"
        style={{
          width: "48px",
          height: "48px",
          minWidth: "48px",
          minHeight: "48px",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Check size={24} color="#0F0F1B" />
      </motion.button>
    </div>
  );

  // Render middle section content based on current step
  const renderMiddleContent = () => {
    switch (currentStep) {
      case "name":
        return renderNameInput();
      case "gender":
        return renderGenderSelection();
      case "sexuality":
        return renderSexualitySelection();
      default:
        return renderNameInput();
    }
  };

  return (
    <>
      <Layout
        topSectionContent={renderPlayerCards()}
        mainClassName="p-0 flex items-center justify-center"
      >
        {renderMiddleContent()}
      </Layout>

      {/* Continue Session Modal */}
      <AnimatePresence>
        {showContinueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Spiel fortsetzen?
                </h2>
                <button
                  onClick={handleNewSession}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X size={20} color="#666" />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Du hast bereits ein laufendes Spiel mit {playersList.length}{" "}
                Spieler:innen. Möchtest du das Spiel fortsetzen oder neu
                beginnen?
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleNewSession}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Neu beginnen
                </motion.button>
                <motion.button
                  onClick={handleContinueSession}
                  className="flex-1 bg-[#FF005C] text-white font-bold py-3 px-4 rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Fortsetzen
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
