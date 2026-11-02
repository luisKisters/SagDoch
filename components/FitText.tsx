"use client";

import React, { useRef } from "react";
import { useFitText } from "./useFitText";

interface FitTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Zusätzliche Abhängigkeiten, bei denen neu gemessen wird */
  fitKey?: unknown;
}

/** Block, dessen Schrift schrumpft statt abzuschneiden. */
export default function FitText({ children, fitKey, ...rest }: FitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFitText(ref, [fitKey, typeof children === "string" ? children : null]);
  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
