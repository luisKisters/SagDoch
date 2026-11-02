"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import ThreeBand from "@/components/ThreeBand";
import ScrollList from "@/components/ScrollList";
import FitText from "@/components/FitText";
import PackCard, { PackPills } from "@/components/PackCard";
import ActionRow from "@/components/ActionRow";
import DatabaseResetModal from "@/components/DatabaseResetModal";
import {
  Pack,
  getAllPacks,
  getAllPlayers,
  getGameSession,
  getUserProfile,
  saveGameSession,
  updateUserProfile,
} from "@/lib/db";
import { resetShownHistory } from "@/lib/task";
import { useDbGuard } from "@/app/_game/useDbGuard";

const BST_CODE = "BST";

// Reihenfolge wie in packs.csv (IndexedDB liefert nach id sortiert).
const PACK_ORDER = [
  "entspannt",
  "bisschen-spicy",
  "spicy-18",
  "tiefgruendig",
  "alk-kiffen",
  "partyyyy",
];
const orderOf = (p: Pack) => {
  const i = PACK_ORDER.indexOf(p.id);
  return i === -1 ? PACK_ORDER.length : i;
};

function PacksScreen() {
  const router = useRouter();
  const fromPause = useSearchParams().get("from") === "pause";
  const guard = useDbGuard();

  const [packs, setPacks] = useState<Pack[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [bstUnlocked, setBstUnlocked] = useState(true);
  const codeRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (includeHidden?: boolean) => {
    const profile = await getUserProfile();
    const withHidden = includeHidden ?? !!profile?.bst_code_activated;
    setBstUnlocked(withHidden);
    const list = (await getAllPacks(withHidden)).sort(
      (a, b) => orderOf(a) - orderOf(b) || a.name.localeCompare(b.name, "de")
    );
    setPacks(list);
    setSelected((cur) => {
      const saved = getGameSession().pack_name;
      if (cur && list.some((p) => p.name === cur)) return cur;
      if (saved && list.some((p) => p.name === saved)) return saved;
      return list[0]?.name ?? null;
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!guard.ok) return;
    load().catch((e) => {
      console.error("Error loading packs:", e);
      setLoaded(true);
    });
  }, [guard.ok, load]);

  useEffect(() => {
    if (showCode) codeRef.current?.focus();
  }, [showCode]);

  const current = packs.find((p) => p.name === selected) ?? null;

  const select = (pack: Pack) => {
    setSelected(pack.name);
    saveGameSession({ pack_name: pack.name });
  };

  const submitCode = async () => {
    if (code.trim().toUpperCase() !== BST_CODE) {
      setCodeError("Ungültiger Code.");
      return;
    }
    try {
      const profile = await getUserProfile();
      await updateUserProfile({
        id: "local_user_profile",
        promo_code_activated: profile?.promo_code_activated ?? false,
        bst_code_activated: true,
        unlocked_pack_names: profile?.unlocked_pack_names ?? [],
      });
      await load(true);
      setShowCode(false);
      setCode("");
      setCodeError("");
    } catch (error) {
      console.error("Error saving code:", error);
      setCodeError("Das hat nicht geklappt.");
    }
  };

  const start = async () => {
    if (!current) return;
    if (fromPause) {
      // Spiel läuft weiter, nur das Pack wechselt: dieselbe Person wählt neu.
      saveGameSession({ pack_name: current.name, phase: "choice", task: null });
      router.push("/play");
      return;
    }
    const players = await getAllPlayers();
    if (players.length < 2) {
      router.push("/setup/players");
      return;
    }
    resetShownHistory();
    const first = players[Math.floor(Math.random() * players.length)];
    saveGameSession({
      playing: true,
      pack_name: current.name,
      current_player_id: first.id ?? null,
      turns_played: 0,
      phase: "reveal",
      task: null,
    });
    router.push("/play");
  };

  return (
    <>
      <ThreeBand
        screen="packs"
        back={{
          label: "Zurück",
          href: fromPause ? "/setup/players?from=pause" : "/setup/players",
        }}
        title="Pack wählen"
        top={
          current ? (
            <div className="sd-big" data-slot="content">
              <div className="sd-grp" key={current.name}>
                <FitText
                  className="sd-t sd-sh sd-swap-scale"
                  style={{ fontSize: "clamp(30px, 8vw, 48px)" }}
                >
                  {current.name}
                </FitText>
                <div className="sd-s" style={{ maxWidth: 420, opacity: 0.9 }}>
                  {current.description}
                </div>
                <div style={{ marginTop: 12 }}>
                  <PackPills pack={current} />
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-big">
              <div className="sd-s">
                {loaded ? "Keine Packs gefunden" : "Lade…"}
              </div>
            </div>
          )
        }
        bottom={
          <ScrollList
            data-slot="option"
            style={{ paddingTop: 16 }}
            watch={packs.length + (showCode ? 1 : 0)}
          >
            {packs.map((p) => (
              <PackCard
                key={p.id}
                pack={p}
                selected={p.name === selected}
                onSelect={() => select(p)}
              />
            ))}
            {loaded && !bstUnlocked && !showCode && (
              <ActionRow
                icon={<KeyRound strokeWidth={2.2} aria-hidden />}
                label="Geheimer Code?"
                onClick={() => setShowCode(true)}
              />
            )}
            {showCode && (
              <>
                <div className="sd-arow-input">
                  <input
                    ref={codeRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && submitCode()}
                    placeholder="Code…"
                    aria-label="Geheimer Code"
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                  <button type="button" className="sd-tap" onClick={submitCode}>
                    OK
                  </button>
                </div>
                {codeError && <div className="sd-error">{codeError}</div>}
              </>
            )}
          </ScrollList>
        }
        next={{ label: "Los", onClick: start, disabled: !current }}
      />
      <DatabaseResetModal
        isOpen={guard.needsReset}
        onConfirm={guard.confirmReset}
      />
    </>
  );
}

export default function PacksPage() {
  return (
    <Suspense fallback={null}>
      <PacksScreen />
    </Suspense>
  );
}
