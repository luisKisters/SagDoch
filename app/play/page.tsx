"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThreeBand from "@/components/ThreeBand";
import FitText from "@/components/FitText";
import DatabaseResetModal from "@/components/DatabaseResetModal";
import {
  Pack,
  Player,
  getAllPacks,
  getAllPlayers,
  getGameSession,
  saveGameSession,
} from "@/lib/db";
import { TaskType, drawTask, typesFor } from "@/app/_game/game";
import { useDbGuard } from "@/app/_game/useDbGuard";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wer ist dran → Wahrheit oder Pflicht (oder Zufall). */
export default function PlayPage() {
  const router = useRouter();
  const guard = useDbGuard();

  const [players, setPlayers] = useState<Player[]>([]);
  const [current, setCurrent] = useState<Player | null>(null);
  const [pack, setPack] = useState<Pack | undefined>();
  const [ready, setReady] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);

  const titleRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);
  const [hold, setHold] = useState(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---- Laden + Spielstand prüfen ----
  useEffect(() => {
    if (!guard.ok) return;
    let alive = true;
    (async () => {
      try {
        const list = await getAllPlayers();
        const session = getGameSession();
        if (!alive) return;
        if (!session.playing || list.length < 2) {
          router.replace("/setup/players");
          return;
        }
        if (session.phase === "task" && session.task) {
          router.replace("/game/task");
          return;
        }
        let cur = list.find((p) => p.id === session.current_player_id);
        let phase = session.phase;
        if (!cur) {
          cur = list[0];
          phase = "reveal";
          saveGameSession({ current_player_id: cur.id ?? null, phase });
        }
        const packs = await getAllPacks(true).catch(() => [] as Pack[]);
        if (!alive) return;
        setPack(packs.find((p) => p.name === session.pack_name));
        setPlayers(list);
        setCurrent(cur);
        if (phase === "reveal") setRevealing(true);
        else setHold(false);
        setReady(true);
      } catch (error) {
        console.error("Error loading game:", error);
        router.replace("/setup/players");
      }
    })();
    return () => {
      alive = false;
    };
  }, [guard.ok, router]);

  // ---- Wer ist dran: Namen rollen durch, rasten ein, fliegen in den Titel ----
  useLayoutEffect(() => {
    // eine Schriftgröße für alle Namen, damit beim Rollen nichts springt
    const el = nameRef.current;
    if (!revealing || !el || players.length === 0) return;
    const keep = el.textContent;
    el.style.fontSize = "";
    let fs = parseFloat(getComputedStyle(el).fontSize);
    const limit = (el.parentElement?.clientWidth ?? window.innerWidth) - 40;
    const widest = () =>
      Math.max(
        ...players.map((p) => {
          el.textContent = p.name;
          return el.offsetWidth;
        })
      );
    while (widest() > limit && fs > 16) {
      fs -= 2;
      el.style.fontSize = `${fs}px`;
    }
    el.textContent = keep;
  }, [revealing, players]);

  useEffect(() => {
    if (!revealing || !current || players.length === 0) return;
    const el = nameRef.current;
    if (!el) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (fn: () => void, ms: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    const finish = () => {
      setRevealing(false);
      setHold(false);
      saveGameSession({ phase: "choice" });
    };

    const N = players.length;
    const target = Math.max(
      0,
      players.findIndex((p) => p.id === current.id)
    );
    const steps = 12 + Math.floor(Math.random() * 3);
    let n = 0;

    const fly = () => {
      const title = titleRef.current;
      if (!title || !overlayRef.current) return finish();
      const a = el.getBoundingClientRect();
      const b = title.getBoundingClientRect();
      const scale = b.height / a.height;
      if (labelRef.current) labelRef.current.style.opacity = "0";
      if (barRef.current) barRef.current.style.opacity = "0";
      overlayRef.current.style.backgroundColor = "transparent";
      el.style.transition = "transform .5s cubic-bezier(.6,0,.2,1), color .5s";
      el.style.transformOrigin = "left top";
      el.style.transform = `translate(${b.left - a.left}px,${
        b.top - a.top
      }px) scale(${scale})`;
      el.style.color = "#fff";
      optRefs.current.forEach((o, i) => {
        if (o)
          o.style.transition = `opacity .35s ${0.15 + i * 0.08}s, transform .45s ${
            0.15 + i * 0.08
          }s cubic-bezier(.2,1.4,.4,1)`;
      });
      setHold(false);
      after(finish, 560);
    };

    const lock = () => {
      el.textContent = current.name;
      el.classList.remove("is-tick");
      el.classList.add("is-lock");
      barRef.current?.classList.add("is-full");
      after(fly, 750);
    };

    if (prefersReducedMotion()) {
      el.textContent = current.name;
      el.style.color = "var(--sd-mint)";
      after(finish, 700);
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const tick = () => {
      n++;
      if (n < steps) {
        el.textContent = players[(((target - (steps - n)) % N) + N) % N].name;
        el.classList.remove("is-tick");
        void el.offsetWidth;
        el.classList.add("is-tick");
        after(tick, 45 + Math.pow(n / steps, 3) * 320);
      } else {
        lock();
      }
    };
    after(tick, 120);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [revealing, current, players]);

  // ---- Wahl: Frage ziehen, speichern, weiter ----
  const choose = useCallback(
    async (type: TaskType) => {
      if (!current || revealing) return;
      const available = typesFor(pack);
      const order = available.includes(type)
        ? [type, ...available.filter((t) => t !== type)]
        : available;
      const session = getGameSession();
      busy.current = true;
      try {
        for (const t of order) {
          const task = await drawTask(current, players, session.pack_name, t);
          if (task) {
            saveGameSession({ phase: "task", task });
            router.push("/game/task");
            return;
          }
        }
        busy.current = false;
        showToast("In diesem Pack gibt es keine Fragen");
      } catch (error) {
        console.error("Error drawing task:", error);
        busy.current = false;
        showToast("Das hat nicht geklappt");
      }
    },
    [current, revealing, pack, players, router, showToast]
  );

  const pickOption = (type: TaskType) => {
    if (busy.current || revealing) return;
    if (!typesFor(pack).includes(type)) {
      showToast(
        type === "dare"
          ? "Dieses Pack hat nur Wahrheit"
          : "Dieses Pack hat nur Pflicht"
      );
      return;
    }
    choose(type);
  };

  // ---- Zufall: Wahrheit und Pflicht leuchten abwechselnd, immer langsamer ----
  const random = () => {
    if (busy.current || revealing) return;
    const [t, d] = optRefs.current;
    const available = typesFor(pack);
    const winner: TaskType =
      available[Math.floor(Math.random() * available.length)];
    const els = [t, d];
    if (!t || !d || prefersReducedMotion()) {
      busy.current = true;
      choose(winner);
      return;
    }
    busy.current = true;
    const parity = winner === "truth" ? 0 : 1;
    const steps = parity === 1 ? 9 : 10;
    let n = 0;
    const flip = () => {
      n++;
      const on = n % 2;
      els[on]!.classList.remove("sd-dim");
      els[1 - on]!.classList.add("sd-dim");
      if (n < steps) {
        setTimeout(flip, 70 + Math.pow(n / steps, 2.2) * 330);
        return;
      }
      els[on]!.classList.add("sd-win");
      setTimeout(() => {
        busy.current = false;
        choose(winner);
      }, 650);
    };
    flip();
  };

  const available = typesFor(pack);
  const title = current?.name ?? "";

  return (
    <>
      <ThreeBand
        screen="choice"
        back={{ label: "Pause", icon: "pause", href: "/pause" }}
        title={title}
        titleSize={32}
        titleRef={titleRef}
        titleHidden={revealing}
        hold={hold}
        toast={toast}
        top={
          <button
            type="button"
            ref={(n) => {
              optRefs.current[0] = n;
            }}
            className={`sd-big sd-tap${
              ready && !available.includes("truth") ? " sd-dim" : ""
            }`}
            data-slot="option"
            onClick={() => pickOption("truth")}
          >
            <FitText className="sd-t sd-sh">Wahrheit</FitText>
          </button>
        }
        bottom={
          <button
            type="button"
            ref={(n) => {
              optRefs.current[1] = n;
            }}
            className={`sd-big sd-tap${
              ready && !available.includes("dare") ? " sd-dim" : ""
            }`}
            data-slot="option"
            onClick={() => pickOption("dare")}
          >
            <FitText className="sd-t">Pflicht</FitText>
          </button>
        }
        next={{ label: "Zufall", icon: "dice", onClick: random }}
        overlay={
          !ready ? (
            <div className="sd-reveal" />
          ) : revealing && current ? (
            <div className="sd-reveal" ref={overlayRef} role="status">
              <div className="sd-reveal-label" ref={labelRef}>
                Wer ist dran?
              </div>
              <div
                className="sd-reveal-name"
                ref={nameRef}
                data-slot="title"
              >
                {players[0]?.name ?? ""}
              </div>
              <div className="sd-reveal-bar" ref={barRef} />
            </div>
          ) : null
        }
      />
      <DatabaseResetModal
        isOpen={guard.needsReset}
        onConfirm={guard.confirmReset}
      />
    </>
  );
}
