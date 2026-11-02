"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import ThreeBand from "@/components/ThreeBand";
import ScrollList from "@/components/ScrollList";
import PlayerRow, { PickField } from "@/components/PlayerRow";
import {
  Player,
  addPlayer,
  deletePlayer,
  getAllPlayers,
  updatePlayer,
} from "@/lib/db";
import { hasProfile, isReady, notReadyMessage } from "@/app/_game/game";

const MAX_NAME = 40;

function PlayersScreen() {
  const router = useRouter();
  const fromPause = useSearchParams().get("from") === "pause";
  const suffix = fromPause ? "?from=pause" : "";

  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<{ id: number; field: PickField } | null>(
    null
  );
  const [fresh, setFresh] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let alive = true;
    getAllPlayers()
      .then((list) => {
        if (!alive) return;
        setPlayers(list);
        setLoaded(true);
        if (list.length === 0) inputRef.current?.focus({ preventScroll: true });
      })
      .catch((e) => {
        console.error("Error loading players:", e);
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const ready = isReady(players);
  const goNext = () => router.push(`/setup/packs${suffix}`);
  const blocked = () => showToast(notReadyMessage(players));

  const handleAdd = async () => {
    const name = draft.trim();
    if (!name) {
      // Enter im leeren Feld = Weiter
      return ready ? goNext() : blocked();
    }
    try {
      const id = await addPlayer({ name, gender: "", sexuality: "" });
      const player: Player = {
        id,
        name,
        gender: "",
        sexuality: "",
        timestamp_added: new Date(),
      };
      setPlayers((prev) => [...prev, player]);
      setDraft("");
      setFresh(id);
      setTimeout(() => setFresh(null), 500);
      setOpen({ id, field: "gender" });
      inputRef.current?.blur(); // Tastatur zu, Auswahl ist jetzt dran
    } catch (error) {
      console.error("Error adding player:", error);
      showToast("Das hat nicht geklappt");
    }
  };

  const handlePick = async (p: Player, field: PickField, value: string) => {
    const updated: Player = { ...p, [field]: value };
    const completes = !hasProfile(p) && hasProfile(updated);
    // Tastatur im selben Tipp-Ereignis wieder öffnen (iOS erlaubt es nur so)
    if (completes) inputRef.current?.focus({ preventScroll: true });
    setPlayers((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    try {
      await updatePlayer(updated);
    } catch (error) {
      console.error("Error updating player:", error);
    }
    // Kurz sichtbar lassen, dann zur nächsten Frage oder zu.
    setTimeout(() => {
      setOpen((cur) => {
        if (!cur || cur.id !== p.id) return cur;
        if (!updated.gender) return { id: p.id!, field: "gender" };
        if (!updated.sexuality) return { id: p.id!, field: "sexuality" };
        return null;
      });
    }, 220);
  };

  const handleToggle = (p: Player, field: PickField) => {
    inputRef.current?.blur();
    setOpen((cur) =>
      cur && cur.id === p.id && cur.field === field
        ? null
        : { id: p.id!, field }
    );
  };

  const handleDelete = async (p: Player) => {
    setPlayers((prev) => prev.filter((x) => x.id !== p.id));
    setOpen((cur) => (cur?.id === p.id ? null : cur));
    try {
      await deletePlayer(p.id!);
    } catch (error) {
      console.error("Error deleting player:", error);
    }
  };

  const newestFirst = [...players].reverse();

  return (
    <ThreeBand
      screen="players"
      back={{
        label: "Zurück",
        href: fromPause ? "/pause" : "/spielen",
      }}
      title="Spieler:innen"
      toast={toast}
      top={
        <>
          <div className="sd-inrow" data-slot="input">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              onPointerDown={() => setOpen(null)}
              placeholder="Name…"
              aria-label="Name"
              maxLength={MAX_NAME}
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="go"
            />
            <button
              type="button"
              className="sd-add sd-tap"
              aria-label="Hinzufügen"
              // mousedown: Fokus im Feld lassen, damit die Tastatur nicht zuklappt
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAdd}
            >
              <Plus strokeWidth={3} aria-hidden />
            </button>
          </div>
          <ScrollList data-slot="content" watch={players.length}>
            {newestFirst.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                open={open && open.id === p.id ? open.field : null}
                isNew={fresh === p.id}
                onToggle={(f) => handleToggle(p, f)}
                onPick={(f, v) => handlePick(p, f, v)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </ScrollList>
        </>
      }
      bottom={
        <div className="sd-inner is-center" style={{ alignItems: "center", textAlign: "center" }}>
          <div className="sd-grp" style={{ gap: 10 }} data-slot="action">
            <div
              style={{ fontWeight: 700, fontSize: 44, letterSpacing: 0 }}
              aria-live="polite"
            >
              {players.length}
            </div>
            <div className="sd-hint">
              Spieler:innen{players.length < 2 ? " · mindestens 2" : ""}
            </div>
            <div className="sd-hint" style={{ maxWidth: 300 }}>
              {loaded && players.length >= 2 && !ready
                ? "Bei allen noch Gender und Orientierung wählen"
                : "Enter im leeren Feld geht weiter"}
            </div>
          </div>
        </div>
      }
      next={{
        label: "Weiter",
        onClick: goNext,
        disabled: !ready,
        onBlocked: blocked,
      }}
    />
  );
}

export default function PlayersPage() {
  return (
    <Suspense fallback={null}>
      <PlayersScreen />
    </Suspense>
  );
}
