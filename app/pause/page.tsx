"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Users, X } from "lucide-react";
import ThreeBand from "@/components/ThreeBand";
import FitText from "@/components/FitText";
import ActionRow from "@/components/ActionRow";
import { Player, endGameSession, getAllPlayers, getGameSession } from "@/lib/db";
import { roundOf } from "@/app/_game/game";

/** Pause: Info oben, Nebenaktionen als Zeilen unten. Das Spiel bleibt gespeichert. */
export default function PausePage() {
  const router = useRouter();
  const [info, setInfo] = useState<{
    name: string;
    pack: string;
    round: number;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const players: Player[] = await getAllPlayers();
      const s = getGameSession();
      if (!alive) return;
      const cur = players.find((p) => p.id === s.current_player_id);
      if (!s.playing || !cur) {
        router.replace("/");
        return;
      }
      setInfo({
        name: cur.name,
        pack: s.pack_name,
        round: roundOf(s.turns_played, players.length),
      });
    })().catch(() => router.replace("/"));
    return () => {
      alive = false;
    };
  }, [router]);

  const end = () => {
    endGameSession();
    router.push("/");
  };

  return (
    <ThreeBand
      screen="pause"
      back={{ label: "Zurück ins Spiel", href: "/play" }}
      title="Pause"
      top={
        <div className="sd-big" data-slot="content">
          <div className="sd-grp">
            <FitText className="sd-t sd-sh">Pause</FitText>
            <div className="sd-s">
              {info ? (
                <>
                  {info.name} ist dran · {info.pack} · Runde {info.round}
                  <br />
                  Das Spiel bleibt gespeichert
                </>
              ) : (
                "Das Spiel bleibt gespeichert"
              )}
            </div>
          </div>
        </div>
      }
      bottom={
        <div className="sd-inner is-center">
          <ActionRow
            icon={<Users strokeWidth={2.2} aria-hidden />}
            label="Spieler ändern"
            href="/setup/players?from=pause"
          />
          <ActionRow
            icon={<Layers strokeWidth={2.2} aria-hidden />}
            label="Pack wechseln"
            href="/setup/packs?from=pause"
          />
          <ActionRow
            icon={<X strokeWidth={2.6} aria-hidden />}
            label="Spiel beenden"
            onClick={end}
            danger
          />
        </div>
      }
      next={{ label: "Weiterspielen", href: "/play" }}
    />
  );
}
