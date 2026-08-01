"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { TypeText } from "@/components/arcade/TypeText";
import { getGame } from "@/games/registry";
import type { GameMeta, GameSession } from "@/games/types";
import { formatSats, mockPaymentClient } from "@/lib/payments";
import { getPlayerId } from "@/lib/player";

type Phase = "ready" | "playing" | "error";

export function PlayClient({ meta }: { meta: GameMeta }) {
  const module = useMemo(() => getGame(meta.id), [meta.id]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const insertCoin = useCallback(async () => {
    setError(null);
    try {
      const result = await mockPaymentClient.insertCoin({
        gameId: meta.id,
        costSats: meta.costSats,
        playerId: getPlayerId(),
      });
      setSession({
        gameId: meta.id,
        sessionId: result.sessionId,
        creditsSpent: meta.costSats,
        startedAt: Date.now(),
      });
      setPhase("playing");
      setLastScore(null);
      window.dispatchEvent(new Event("coinup:balance"));
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not insert coin");
    }
  }, [meta.costSats, meta.id]);

  if (!module) {
    return (
      <main className="arcade-grid px-4 py-16 text-center">
        <p className="font-pixel text-[10px] text-[var(--orange)]">
          CABINET NOT FOUND
        </p>
        <Link href="/" className="pixel-link mt-4 inline-block font-pixel text-[9px]">
          ← LOBBY
        </Link>
      </main>
    );
  }

  const Play = module.Play;

  return (
    <main className="arcade-grid mx-auto flex max-w-3xl flex-col items-center px-4 py-10">
      <div className="mb-8 w-full text-center">
        <p className="font-pixel text-[8px] text-[#5c5c6b]">CABINET</p>
        <h1 className="mt-2 font-pixel text-sm text-white sm:text-base">
          {meta.title.toUpperCase()}
        </h1>
        <p className="mx-auto mt-3 max-w-md font-pixel text-[8px] leading-relaxed text-[#8a8a9a]">
          <TypeText
            text={meta.description.toUpperCase()}
            speed={12}
            className="font-pixel text-[8px] leading-relaxed text-[#8a8a9a]"
            holdCursor={false}
          />
        </p>
        <p
          className="mt-4 font-pixel text-[10px]"
          style={{ color: meta.accent }}
        >
          {formatSats(meta.costSats).toUpperCase()} / PLAY
          {meta.players === 2 && meta.potSats
            ? ` · POT ${formatSats(meta.potSats).toUpperCase()}`
            : ""}
        </p>
        {meta.players === 2 && (
          <p className="mt-2 font-pixel text-[8px] text-[var(--neon-magenta)]">
            2-PLAYER LIVE · BOTH MUST PAY
          </p>
        )}
      </div>

      {phase === "ready" && (
        <div className="pixel-panel flex w-full max-w-sm flex-col items-center gap-5 border-[var(--neon-amber)] px-8 py-10">
          <div className="text-5xl">{meta.glyph}</div>
          {meta.players === 2 && (
            <p className="text-center font-pixel text-[8px] leading-relaxed text-[#8a8a9a]">
              INSERT COIN TO ENTER THE LIVE ROOM. WHEN A SECOND PLAYER PAYS, BEST
              OF 3 BEGINS. WINNER TAKES THE POT.
            </p>
          )}
          <button type="button" onClick={insertCoin} className="pixel-btn w-full">
            INSERT {formatSats(meta.costSats).toUpperCase()}
          </button>
          <Link href="/" className="font-pixel text-[8px] text-[#5c5c6b] hover:text-[var(--crt-green)]">
            ← LOBBY
          </Link>
          {lastScore !== null && (
            <p className="font-pixel text-[10px] text-[var(--neon-amber)]">
              LAST RUN: {lastScore}
            </p>
          )}
        </div>
      )}

      {phase === "error" && (
        <div className="pixel-panel flex w-full max-w-sm flex-col items-center gap-4 border-[var(--orange)] px-8 py-10 text-center">
          <p className="font-pixel text-[10px] leading-relaxed text-[var(--orange)]">
            {error?.toUpperCase()}
          </p>
          <button
            type="button"
            onClick={() => setPhase("ready")}
            className="pixel-btn pixel-btn--ghost"
          >
            TRY AGAIN
          </button>
          <Link href="/" className="font-pixel text-[8px] text-[var(--neon-amber)]">
            INSERT COIN IN LOBBY →
          </Link>
        </div>
      )}

      {phase === "playing" && session && (
        <div className="pixel-panel border-[var(--varsity-blue)] p-4">
          <Play
            session={session}
            onScore={async (payload) => {
              setLastScore(payload.score);
              await mockPaymentClient.submitScore({
                gameId: payload.gameId,
                sessionId: payload.sessionId,
                playerId: getPlayerId(),
                score: payload.score,
              });
            }}
            onExit={() => {
              setSession(null);
              setPhase("ready");
            }}
          />
        </div>
      )}
    </main>
  );
}
