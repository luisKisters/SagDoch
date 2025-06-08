"use client";

import React from "react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { motion } from "framer-motion";

// Styles from Figma data (approximated with Tailwind)
const topTextStyle =
  "text-white font-bold text-6xl md:text-8xl lg:text-9xl text-center leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]";
const middleTextStyle =
  "text-white font-bold text-5xl md:text-7xl lg:text-8xl text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]";
const bottomTextStyle =
  "font-bold text-6xl md:text-8xl lg:text-9xl text-center leading-tight drop-shadow-[0_0_10px_rgba(0,0,0,0.4)]";

const textMotionProps = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: "easeOut" },
});

// Motion props for the interactive wrapper div
const interactiveWrapperMotionProps = {
  whileHover: { scale: 1.05, opacity: 0.95 },
  whileTap: { scale: 0.95 },
};
const interactiveWrapperClassName =
  "w-full h-full flex flex-col items-center justify-center cursor-pointer no-underline";

export default function GameModeSelectionScreen() {
  // The PRD mentions: "Make "Wahrheit oder Pflicht" (top area) and "Wähle" (middle area)
  // effectively one clickable region leading to player setup."
  // We achieve this by wrapping both the top and middle sections content in a single Link for navigation,
  // but visually they will be in their respective layout slots.
  // The Layout component is modified to take top and bottom content directly.

  const topContent = (
    <motion.div {...textMotionProps()} className={topTextStyle}>
      Wahrheit
      <br />
      oder
      <br />
      Pflicht
    </motion.div>
  );

  const middleContent = (
    <motion.div {...textMotionProps(0.2)} className={middleTextStyle}>
      Wähle
    </motion.div>
  );

  const bottomContent = (
    <motion.div
      {...textMotionProps(0.4)}
      className={`${bottomTextStyle} text-[#8E8E99] cursor-not-allowed`}
    >
      Ich hab
      <br />
      noch nie
    </motion.div>
  );

  return (
    <Layout
      topSectionContent={
        <Link href="/setup/packs" passHref legacyBehavior={false}>
          <motion.div
            {...interactiveWrapperMotionProps}
            className={interactiveWrapperClassName}
          >
            {topContent}
          </motion.div>
        </Link>
      }
      bottomSectionContent={
        <div className={interactiveWrapperClassName + " pointer-events-none"}>
          {bottomContent}
        </div>
      }
      mainClassName="p-0 flex items-center justify-center" // Ensure middle content is also centered
    >
      <Link href="/setup/packs" passHref legacyBehavior={false}>
        <motion.div
          {...interactiveWrapperMotionProps}
          className={interactiveWrapperClassName}
        >
          {middleContent}
        </motion.div>
      </Link>
    </Layout>
  );
}
