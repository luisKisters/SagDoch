"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ThreeBand from "@/components/ThreeBand";
import FitText from "@/components/FitText";
import { hasResumableGame } from "@/lib/db";

/** Start: Wahrheit oder Pflicht (tippbar) oben, „Ich hab noch nie“ unten (kommt bald). */
export default function StartScreen() {
  const [resume, setResume] = useState(false);

  useEffect(() => {
    setResume(hasResumableGame());
  }, []);

  return (
    <ThreeBand
      screen="home"
      back={null}
      title="SagDoch"
      top={
        <Link
          href="/setup/players"
          className="sd-big sd-tap"
          data-slot="option"
          aria-label="Wahrheit oder Pflicht spielen"
        >
          <FitText className="sd-t sd-sh">
            Wahrheit
            <br />
            oder
            <br />
            Pflicht
          </FitText>
        </Link>
      }
      bottom={
        <div className="sd-big" data-slot="option" aria-disabled="true">
          <FitText className="sd-t" style={{ color: "var(--sd-muted)" }}>
            Ich hab
            <br />
            noch nie
          </FitText>
          <div className="sd-s">kommt bald</div>
        </div>
      }
      next={
        resume
          ? { label: "Weiterspielen", href: "/play" }
          : { label: "Spielen", href: "/setup/players" }
      }
    />
  );
}
