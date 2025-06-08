"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
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
} from "lucide-react";
import { getAllPlayers, addPlayer, Player } from "@/lib/db";

type CurrentStep = "name" | "gender" | "sexuality";

// Gender and sexuality options
const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers"];
const SEXUALITY_OPTIONS = [
  "Heterosexuell",
  "Homosexuell",
  "Bisexuell",
  "Pansexuell",
  "Asexuell",
];

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
  // State management
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [currentStep, setCurrentStep] = useState<CurrentStep>("name");
  const [currentName, setCurrentName] = useState("");
  const [currentGender, setCurrentGender] = useState("");
  const [currentSexuality, setCurrentSexuality] = useState("");
  const [selectedGenderIndex, setSelectedGenderIndex] = useState(0);
  const [selectedSexualityIndex, setSelectedSexualityIndex] = useState(0);

  // Load players from IndexedDB on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    async function loadPlayers() {
      try {
        const players = await getAllPlayers();
        setPlayersList(players);
      } catch (error) {
        console.error("Error loading players:", error);
      }
    }
    loadPlayers();
  }, []);

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

  // Render player cards in top section
  const renderPlayerCards = () => (
    <div className="w-full max-h-full overflow-y-auto px-2">
      <motion.h1 className={`${titleStyle} mb-3 text-left`}>
        Spieler:innen
      </motion.h1>
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
              <button className="w-10 h-6 bg-[#FF005C] rounded-lg flex items-center justify-center">
                <Settings size={16} color="white" />
              </button>
              <button className="w-10 h-6 bg-[#FF005C] rounded-lg flex items-center justify-center">
                <Trash2 size={16} color="white" />
              </button>
            </div>
          </motion.div>
        ))}
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
      {/* Show play button when >= 2 players and not typing */}
      {playersList.length >= 2 && !currentName.trim() && (
        <Link href="/play">
          <motion.button
            className="w-12 h-12 bg-[#FF005C] rounded-xl flex items-center justify-center absolute top-1/2 transform -translate-y-1/2 right-2"
            style={{
              width: "48px",
              height: "48px",
              minWidth: "48px",
              minHeight: "48px",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Ensure selected pack is in sessionStorage, fallback to Default Pack
              if (!sessionStorage.getItem("selectedPackName")) {
                sessionStorage.setItem("selectedPackName", "Default Pack");
              }
            }}
          >
            <Play size={24} color="#0F0F1B" />
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
    <Layout
      topSectionContent={renderPlayerCards()}
      mainClassName="p-0 flex items-center justify-center"
    >
      {renderMiddleContent()}
    </Layout>
  );
}
