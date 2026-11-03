"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import ActionRow from "./ActionRow";
import { detectPlatform, installLabel, promptInstall, useInstallState, type Platform } from "@/lib/install";

/**
 * Nebenaktion „Als App installieren“ für Screens im Spiel. Nur im Browser sichtbar.
 * Wo der Browser es kann, öffnet sie den echten Dialog, sonst die passende Anleitung.
 */
export default function InstallRow() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const { canPrompt, justInstalled } = useInstallState();
  useEffect(() => setPlatform(detectPlatform()), []);

  const info = platform ? installLabel(platform, canPrompt) : null;
  if (!info || justInstalled) return null;

  const icon = <Download strokeWidth={2.4} aria-hidden />;
  return canPrompt ? (
    <ActionRow icon={icon} label={info.label} onClick={() => void promptInstall()} />
  ) : (
    <ActionRow icon={icon} label={info.label} href="/willkommen#installieren" />
  );
}
