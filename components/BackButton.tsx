"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";

interface BackButtonProps {
  href?: string; // Optional specific href, otherwise uses router.back()
  className?: string;
  icon?: "arrow" | "x"; // Icon type
  inline?: boolean; // Whether to position inline with content instead of fixed
}

export default function BackButton({
  href,
  className = "",
  icon = "arrow",
  inline = false,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const IconComponent = icon === "x" ? X : ArrowLeft;

  const baseClasses =
    "w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg";
  const positionClasses = inline ? "relative" : "fixed top-4 left-4 z-50";

  return (
    <motion.button
      onClick={handleBack}
      className={`${baseClasses} ${positionClasses} ${className}`}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: inline ? 0 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <IconComponent size={24} color="white" />
    </motion.button>
  );
}
