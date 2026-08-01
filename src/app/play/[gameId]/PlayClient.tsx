"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
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
      // notify shell balance — storage event for other tabs; force refresh via custom event
      window.dispatchEvent(new Event("coinup:balance"));
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not insert coin");
    }
  }, [meta.costSats, meta.id]);

  if (!module) {
    return (
      <main className="px-4 py-16 text-center">
        <p className="text-zinc-400">Game not found.</p>
        <Link href="/" className="mt-4 inline-block text-cyan-300 underline">
          Lobby
        </Link>
      </main>
    );
  }

  const Play = module.Play;

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-10">
      <div className="mb-8 w-full text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
          Cabinet
        </p>
        <h1 className="mt-1 font-mono text-3xl font-bold text-white">{meta.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{meta.description}</p>
        <p className="mt-3 font-mono text-sm" style={{ color: meta.accent }}>
          {formatSats(meta.costSats)} per play
        </p>
      </div>

      {phase === "ready" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-zinc-950/80 px-10 py-12">
          <div className="text-6xl">{meta.glyph}</div>
          <button
            type="button"
            onClick={insertCoin}
            className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3 font-mono text-sm font-bold text-black shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:brightness-110"
          >
            INSERT {formatSats(meta.costSats)}
          </button>
          <Link href="/" className="font-mono text-xs text-zinc-500 hover:text-zinc-300">
            ← lobby
          </Link>
          {lastScore !== null && (
            <p className="font-mono text-amber-300">Last run: {lastScore}</p>
          )}
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-10 py-12 text-center">
          <p className="font-mono text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => setPhase("ready")}
            className="rounded border border-white/20 px-4 py-2 font-mono text-sm text-white hover:bg-white/5"
          >
            Try again
          </button>
          <Link href="/" className="font-mono text-xs text-amber-300 hover:underline">
            Add credits in lobby → INSERT COIN
          </Link>
        </div>
      )}

      {phase === "playing" && session && (
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
      )}
    </main>
  );
}
