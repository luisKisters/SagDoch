"use client";

import React, { useState, useEffect, Suspense } from "react";
import Layout from "@/components/Layout";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getPlayerById,
  getRandomQuestion,
  getAllPlayers,
  checkDatabaseCompatibility,
  clearOldDatabase,
} from "@/lib/db";
import DatabaseResetModal from "@/components/DatabaseResetModal";
import { getRandomTargetPlayer, debugTargetingLogic } from "@/lib/targeting";

type TaskType = "truth" | "dare";

// Styles based on Figma data
const titleTextStyle =
  "text-white font-bold text-4xl md:text-6xl lg:text-7xl leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]";
const taskTextStyle =
  "text-white font-bold text-xl md:text-2xl lg:text-3xl leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] text-left";
const weiterButtonStyle =
  "font-bold text-5xl md:text-6xl lg:text-7xl leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)] text-center";

// Motion props for the Weiter button
const buttonMotionProps = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

function TaskScreenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [taskText, setTaskText] = useState<string>("");
  const [taskType, setTaskType] = useState<TaskType>("truth");
  const [isLoading, setIsLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  // Load task data from URL parameters
  useEffect(() => {
    async function loadTaskData() {
      try {
        // Check database compatibility first
        const { compatible, needsReset } = await checkDatabaseCompatibility();
        if (!compatible && needsReset) {
          // Show reset modal instead of immediate redirect
          setShowResetModal(true);
          setIsLoading(false);
          return;
        }

        const playerId = searchParams.get("player");
        const type = searchParams.get("type") as TaskType;

        if (!playerId || !type || (type !== "truth" && type !== "dare")) {
          console.error("Invalid URL parameters");
          router.push("/play");
          return;
        }

        // Get player details
        const player = await getPlayerById(parseInt(playerId));
        if (!player) {
          console.error("Player not found");
          router.push("/play");
          return;
        }

        // Get all players for targeting
        const allPlayers = await getAllPlayers();

        // Debug targeting logic (remove this in production)
        debugTargetingLogic(allPlayers);

        // Get selected pack name from sessionStorage, fallback to "Entspannt"
        const selectedPackName =
          sessionStorage.getItem("selectedPackName") || "Entspannt";

        // Get random question - try up to 5 times to find a suitable question
        let question = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (!question && attempts < maxAttempts) {
          const candidateQuestion = await getRandomQuestion(
            selectedPackName,
            type
          );

          if (!candidateQuestion) {
            console.error("No questions found for this type");
            router.push("/play");
            return;
          }

          // Check if question requires targeting
          if (candidateQuestion.requires_target) {
            // Get target player
            const targetPlayer = getRandomTargetPlayer(player, allPlayers);

            if (targetPlayer) {
              // We found a valid target, use this question
              question = candidateQuestion;
            } else {
              // No valid targets, try to find another question
              attempts++;
              console.log(
                `No valid targets for player ${player.name}, attempt ${attempts}/${maxAttempts}`
              );
            }
          } else {
            // Question doesn't require targeting, we can use it
            question = candidateQuestion;
          }
        }

        if (!question) {
          console.error(
            "Could not find a suitable question after multiple attempts"
          );
          router.push("/play");
          return;
        }

        // Process the question text
        let processedText = question.text_template;

        // Replace player name placeholder (make it bold)
        processedText = processedText.replace(
          "{playerName}",
          `<strong style="font-size: 1.1em;">${player.name}</strong>`
        );

        // Replace target player name if needed
        if (question.requires_target) {
          const targetPlayer = getRandomTargetPlayer(player, allPlayers);
          if (targetPlayer) {
            processedText = processedText.replace(
              "{targetPlayerName}",
              `<strong style="font-size: 1.1em;">${targetPlayer.name}</strong>`
            );
          }
        }

        setTaskType(type);
        setTaskText(processedText);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading task data:", error);
        router.push("/play");
      }
    }

    loadTaskData();
  }, [searchParams, router]);

  // Handle continue button click
  const handleContinue = () => {
    router.push("/play");
  };

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

  // Top section content - either title or empty
  const topContent = (
    <div className="w-full h-full flex flex-col items-start justify-start px-4 pt-8">
      {taskType === "truth" ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`${titleTextStyle} mb-8 px-4`}
          >
            Wahrheit
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className={`${taskTextStyle} px-4`}
            dangerouslySetInnerHTML={{ __html: taskText }}
          />
        </>
      ) : (
        // Empty for dare - just show inactive/greyed out background
        <div className="w-full h-full" />
      )}
    </div>
  );

  // Bottom section content - either task or empty
  const bottomContent = (
    <div className="w-full h-full flex flex-col items-start justify-start px-4 pt-8">
      {taskType === "dare" ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`${titleTextStyle} text-[#0F0F1B] mb-8 px-4`}
          >
            Pflicht
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className={`${taskTextStyle} text-[#0F0F1B] px-4`}
            dangerouslySetInnerHTML={{ __html: taskText }}
          />
        </>
      ) : (
        // Empty for truth - just show inactive/greyed out background
        <div className="w-full h-full" />
      )}
    </div>
  );

  // Weiter text in middle section
  const weiterText = (
    <motion.div
      onClick={handleContinue}
      className="cursor-pointer w-full h-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      {...buttonMotionProps}
    >
      <span
        className={`${weiterButtonStyle} ${
          taskType === "truth" ? "text-[#FF005C]" : "text-[#00FFC6]"
        }`}
      >
        Weiter
      </span>
    </motion.div>
  );

  return (
    <>
      <Layout
        topSectionContent={topContent}
        bottomSectionContent={bottomContent}
        mainClassName="p-0 flex items-center justify-center"
      >
        {weiterText}
      </Layout>

      {/* Database Reset Modal */}
      <DatabaseResetModal
        isOpen={showResetModal}
        onConfirm={handleResetConfirm}
      />
    </>
  );
}

export default function TaskScreen() {
  return (
    <Suspense
      fallback={
        <Layout mainClassName="p-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white font-bold text-3xl text-center"
          >
            Lade...
          </motion.div>
        </Layout>
      }
    >
      <TaskScreenContent />
    </Suspense>
  );
}
