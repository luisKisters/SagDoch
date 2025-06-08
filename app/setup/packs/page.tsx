"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Lock, Unlock, X, Check, Eye } from "lucide-react";
import {
  getAllPacks,
  getUserProfile,
  updateUserProfile,
  Pack,
  UserProfile,
} from "@/lib/db";

// Styles based on Figma data
const titleStyle =
  "text-white font-bold text-4xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]";
const packCardStyle =
  "bg-white rounded-lg p-3 mb-3 shadow-[0_0_6px_rgba(0,0,0,0.1)] cursor-pointer";
const packNameStyle = "text-[#FF005C] font-bold text-lg mb-1";
const packDescriptionStyle = "text-gray-600 text-xs mb-2 line-clamp-2";
const packLabelStyle = "text-xs font-bold px-2 py-1 rounded";
const buttonStyle =
  "bg-[#FF005C] text-white font-bold py-3 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed";

const PROMO_CODE = "summerfun25";
const BST_CODE = "BST";
const PROMO_CUTOFF_DATE = new Date("2025-07-16T00:00:00Z");

export default function PackSelectionScreen() {
  // State management
  const [packs, setPacks] = useState<Pack[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedPackName, setSelectedPackName] = useState<string | null>(null);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showBSTInput, setShowBSTInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [bstCode, setBstCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [bstError, setBstError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load packs and user profile
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function loadData() {
      try {
        const profileData = await getUserProfile();
        const includeHidden = profileData?.bst_code_activated || false;
        const [packsData] = await Promise.all([getAllPacks(includeHidden)]);

        setPacks(packsData);
        setUserProfile(profileData || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading pack data:", error);
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Check if a pack is unlocked
  const isPackUnlocked = (pack: Pack): boolean => {
    if (!pack.is_locked) return true;
    if (userProfile?.promo_code_activated) return true;
    if (userProfile?.unlocked_pack_names.includes(pack.name)) return true;
    if (
      pack.name === "35. BST: Verbundenheit" &&
      userProfile?.bst_code_activated
    )
      return true;
    return false;
  };

  // Separate and sort packs
  const unlockedPacks = packs.filter((pack) => isPackUnlocked(pack));
  const lockedPacks = packs.filter((pack) => !isPackUnlocked(pack));

  // Handle pack selection
  const handlePackSelect = (pack: Pack) => {
    if (isPackUnlocked(pack)) {
      setSelectedPackName(pack.name);
      // Store selected pack in sessionStorage for use in other screens
      sessionStorage.setItem("selectedPackName", pack.name);
    } else {
      // Trigger wiggle animation for locked packs
      const element = document.getElementById(`pack-${pack.id}`);
      if (element) {
        element.classList.add("animate-pulse");
        setTimeout(() => {
          element.classList.remove("animate-pulse");
        }, 600);
      }
    }
  };

  // Handle unlock all packs
  const handleUnlockAll = async () => {
    try {
      // Update user profile to unlock all packs
      const allPackNames = packs.map((pack) => pack.name);
      const updatedProfile: UserProfile = {
        ...userProfile,
        id: "local_user_profile",
        promo_code_activated: true,
        bst_code_activated: userProfile?.bst_code_activated || false,
        unlocked_pack_names: allPackNames,
      };

      await updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      console.log("All packs unlocked!");
    } catch (error) {
      console.error("Error unlocking all packs:", error);
    }
  };

  // Handle promo code submission
  const handlePromoSubmit = async () => {
    setPromoError("");

    // Validate code and date
    if (promoCode !== PROMO_CODE) {
      setPromoError("Ungültiger oder abgelaufener Code.");
      return;
    }

    if (new Date() >= PROMO_CUTOFF_DATE) {
      setPromoError("Ungültiger oder abgelaufener Code.");
      return;
    }

    try {
      // Update user profile
      const updatedProfile: UserProfile = {
        ...userProfile,
        id: "local_user_profile",
        promo_code_activated: true,
        bst_code_activated: userProfile?.bst_code_activated || false,
        unlocked_pack_names: userProfile?.unlocked_pack_names || ["Entspannt"],
      };

      await updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setShowPromoModal(false);
      setPromoCode("");
      console.log("Promo code activated successfully!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      setPromoError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
  };

  // Handle BST code submission
  const handleBSTSubmit = async () => {
    setBstError("");

    if (bstCode !== BST_CODE) {
      setBstError("Ungültiger Code.");
      return;
    }

    try {
      // Update user profile to activate BST pack
      const updatedProfile: UserProfile = {
        ...userProfile,
        id: "local_user_profile",
        promo_code_activated: userProfile?.promo_code_activated || false,
        bst_code_activated: true,
        unlocked_pack_names: [
          ...(userProfile?.unlocked_pack_names || ["Entspannt"]),
          "35. BST: Verbundenheit",
        ],
      };

      await updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);

      // Reload packs to include the hidden BST pack
      const packsData = await getAllPacks(true);
      setPacks(packsData);

      setShowBSTInput(false);
      setBstCode("");
      console.log("BST code activated successfully!");
    } catch (error) {
      console.error("Error updating user profile:", error);
      setBstError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
  };

  // Render pack card component
  const renderPackCard = (pack: Pack) => {
    const unlocked = isPackUnlocked(pack);
    const isSelected = selectedPackName === pack.name;

    return (
      <motion.div
        key={pack.id}
        id={`pack-${pack.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${packCardStyle} ${
          isSelected
            ? "ring-4 ring-[#FF005C] bg-gradient-to-r from-pink-50 to-white shadow-xl scale-105"
            : "ring-1 ring-gray-200 hover:shadow-md"
        } ${unlocked ? "" : "opacity-75"} transition-all duration-300`}
        onClick={() => handlePackSelect(pack)}
        whileHover={{
          scale: unlocked ? (isSelected ? 1.05 : 1.03) : 1.0,
          y: unlocked ? -2 : 0,
        }}
        whileTap={{ scale: unlocked ? 0.98 : 1.0 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={packNameStyle}>{pack.name}</h3>
            <p className={packDescriptionStyle}>{pack.description}</p>
            <div className="flex gap-2">
              {pack.is_18_plus && (
                <span className={`${packLabelStyle} bg-red-100 text-red-800`}>
                  18+
                </span>
              )}
              <span className={`${packLabelStyle} bg-gray-100 text-gray-800`}>
                {pack.type === "truth_and_dare"
                  ? "Wahrheit & Pflicht"
                  : pack.type === "only_truth"
                  ? "Nur Wahrheit"
                  : "Nur Pflicht"}
              </span>
              {pack.name === "35. BST: Verbundenheit" && (
                <span
                  className={`${packLabelStyle} bg-purple-100 text-purple-800`}
                >
                  BST
                </span>
              )}
            </div>
          </div>
          <div className="ml-3 flex items-center">
            {unlocked ? (
              <Unlock size={24} color="#00C851" />
            ) : (
              <Lock size={24} color="#666" />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Layout mainClassName="p-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white font-bold text-3xl text-center"
        >
          Lade...
        </motion.div>
      </Layout>
    );
  }

  // Top section content - pack list with unlocked first, then locked
  const topContent = (
    <div className="w-full max-h-full overflow-y-auto px-4">
      <motion.h1 className={`${titleStyle} mb-6`}>Wähle ein Pack</motion.h1>

      {/* Unlocked Packs */}
      <AnimatePresence>{unlockedPacks.map(renderPackCard)}</AnimatePresence>

      {/* Locked Packs Section */}
      {lockedPacks.length > 0 && (
        <div className="mt-6">
          <motion.h2
            className="text-white font-bold text-2xl mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Gesperrte Packs
          </motion.h2>

          <AnimatePresence>{lockedPacks.map(renderPackCard)}</AnimatePresence>
        </div>
      )}

      {/* BST Code Input Section */}
      {!userProfile?.bst_code_activated && (
        <div className="mt-8 pb-4">
          {!showBSTInput ? (
            <motion.button
              onClick={() => setShowBSTInput(true)}
              className="w-full text-white/60 font-medium text-sm py-2 px-4 border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-2">
                <Eye size={16} />
                Geheimer Code?
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Code eingeben..."
                  value={bstCode}
                  onChange={(e) => setBstCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <motion.button
                  onClick={handleBSTSubmit}
                  className="px-4 py-2 bg-white text-[#FF005C] font-bold rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  OK
                </motion.button>
              </div>
              {bstError && (
                <div className="mt-2 text-red-300 text-sm">{bstError}</div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );

  // Middle section - Weiter button
  const weiterButton = (
    <Link href={selectedPackName ? "/setup/players" : "#"}>
      <motion.button
        className={`${buttonStyle} text-2xl py-4 px-8`}
        disabled={!selectedPackName}
        whileHover={selectedPackName ? { scale: 1.05 } : {}}
        whileTap={selectedPackName ? { scale: 0.95 } : {}}
        onClick={() => {
          // Store selected pack in sessionStorage
          if (selectedPackName) {
            sessionStorage.setItem("selectedPackName", selectedPackName);
          }
        }}
      >
        Weiter
      </motion.button>
    </Link>
  );

  // Get selected pack info for bottom section
  const selectedPack = packs.find((pack) => pack.name === selectedPackName);

  // Bottom section - selection status and promo code button
  const bottomContent = (
    <div className="w-full flex flex-col items-center justify-center p-4 space-y-4">
      <div className="text-center">
        {selectedPackName ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#0F0F1B] font-bold text-lg"
          >
            "{selectedPackName}" ausgewählt
          </motion.div>
        ) : (
          <div className="text-center">
            <div className="text-[#0F0F1B] font-medium text-lg opacity-60 mb-2">
              Wähle ein Pack aus
            </div>
            <div className="text-[#0F0F1B] text-sm opacity-50">
              <span className="line-through">Schaue 3 Werbungen</span> →{" "}
              <span className="font-bold">KOSTENLOS</span>
            </div>
          </div>
        )}
      </div>

      {/* Show ad info for locked packs */}
      {selectedPack && !isPackUnlocked(selectedPack) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[#0F0F1B] text-sm"
        >
          <span className="line-through">
            Schaue {selectedPack.cost_in_ads} Werbungen
          </span>{" "}
          → <span className="font-bold">KOSTENLOS</span>
        </motion.div>
      )}

      {/* Unlock All Button */}
      <motion.button
        onClick={handleUnlockAll}
        className="flex items-center gap-2 bg-[#0F0F1B] text-[#00FFC6] font-bold py-3 px-6 rounded-xl shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Gift size={20} />
        Einfach freischalten
      </motion.button>
    </div>
  );

  return (
    <>
      <Layout
        topSectionContent={topContent}
        bottomSectionContent={bottomContent}
        mainClassName="p-0 flex items-center justify-center"
      >
        {weiterButton}
      </Layout>

      {/* Promo Code Modal */}
      <AnimatePresence>
        {showPromoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPromoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Einfach freischalten
                </h2>
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  <X size={20} color="#666" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Promo-Code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF005C]"
                />
              </div>

              {promoError && (
                <div className="mb-4 text-red-600 text-sm">{promoError}</div>
              )}

              <motion.button
                onClick={handlePromoSubmit}
                className={`${buttonStyle} w-full`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Einlösen
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
