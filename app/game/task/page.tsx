"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";
import ThreeBand from "@/components/ThreeBand";
import FitText from "@/components/FitText";
import ActionRow from "@/components/ActionRow";
import DatabaseResetModal from "@/components/DatabaseResetModal";
import {
  GameTask,
  Player,
  getAllPlayers,
  getGameSession,
  saveGameSession,
} from "@/lib/db";
import { renderTemplate } from "@/lib/task";
import { drawTask, nextPlayerAfter, roundOf } from "@/app/_game/game";
import { useDbGuard } from "@/app/_game/useDbGuard";

/** Aufgabe: Frage oben, „Andere Frage“ unten, Weiter = nächste Person. */
export default function TaskPage() {
  const router = useRouter();
  const guard = useDbGuard();

  const [players, setPlayers] = useState<Player[]>([]);
  const [current, setCurrent] = useState<Player | null>(null);
  const [task, setTask] = useState<GameTask | null>(null);
  const [packName, setPackName] = useState("");
  const [turns, setTurns] = useState(0);
  const [version, setVersion] = useState(0); // animiert eine neue Frage
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!guard.ok) return;
    let alive = true;
    (async () => {
      try {
        const list = await getAllPlayers();
        const s = getGameSession();
        const cur = list.find((p) => p.id === s.current_player_id);
        if (!alive) return;
        if (!s.playing || s.phase !== "task" || !s.task || !cur || list.length < 2) {
          router.replace("/play");
          return;
        }
        setPlayers(list);
        setCurrent(cur);
        setTask(s.task);
        setPackName(s.pack_name);
        setTurns(s.turns_played);
      } catch (error) {
        console.error("Error loading task:", error);
        router.replace("/play");
      }
    })();
    return () => {
      alive = false;
    };
  }, [guard.ok, router]);

  const reroll = useCallback(async () => {
    if (!current || !task || busy.current) return;
    busy.current = true;
    try {
      const next = await drawTask(current, players, packName, task.type);
      if (next) {
        saveGameSession({ task: next });
        setTask(next);
        setVersion((v) => v + 1);
      } else {
        setToast("Keine weitere Frage");
        setTimeout(() => setToast(null), 1700);
      }
    } finally {
      busy.current = false;
    }
  }, [current, task, players, packName]);

  const next = () => {
    if (!current) return;
    const following = nextPlayerAfter(players, current.id ?? null);
    saveGameSession({
      current_player_id: following?.id ?? null,
      turns_played: turns + 1,
      phase: "reveal",
      task: null,
    });
    router.push("/play");
  };

  const target = task?.target_player_id
    ? players.find((p) => p.id === task.target_player_id)
    : undefined;
  const parts =
    current && task
      ? renderTemplate(task.text_template, current.name, target?.name)
      : [];
  const length = parts.reduce((n, p) => n + p.text.length, 0);

  return (
    <>
      <ThreeBand
        screen="task"
        back={{ label: "Pause", icon: "pause", href: "/pause" }}
        title={current?.name ?? ""}
        toast={toast}
        top={
          task ? (
            <div className="sd-q" data-slot="content">
              <div className="sd-grp" style={{ alignItems: "stretch" }}>
                <FitText className="sd-q-lab sd-sh">
                  {task.type === "truth" ? "Wahrheit" : "Pflicht"}
                </FitText>
                <div
                  key={version}
                  className={`sd-q-txt sd-sh${length > 110 ? " is-long" : ""}${
                    version > 0 ? " sd-swap" : ""
                  }`}
                >
                  {parts.map((p, i) =>
                    p.kind === "text" ? (
                      <React.Fragment key={i}>{p.text}</React.Fragment>
                    ) : p.kind === "player" ? (
                      <b key={i}>{p.text}</b>
                    ) : (
                      <b key={i}>
                        <u>{p.text}</u>
                      </b>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="sd-q" />
          )
        }
        bottom={
          <div className="sd-inner is-center">
            <ActionRow
              icon={<Shuffle strokeWidth={2.2} aria-hidden />}
              label="Andere Frage"
              onClick={reroll}
            />
            <div className="sd-hint" style={{ paddingLeft: 4 }}>
              {packName} · Runde {roundOf(turns, players.length)}
            </div>
          </div>
        }
        next={{ label: "Weiter", onClick: next, disabled: !task }}
      />
      <DatabaseResetModal
        isOpen={guard.needsReset}
        onConfirm={guard.confirmReset}
      />
    </>
  );
}
