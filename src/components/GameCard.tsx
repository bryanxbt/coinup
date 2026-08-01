import Link from "next/link";
import { formatSats } from "@/lib/payments";
import type { GameMeta } from "@/games/types";

export function GameCard({ game }: { game: GameMeta }) {
  const playable = game.status === "playable";

  const inner = (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-zinc-950/80 p-5 transition ${
        playable
          ? "border-white/10 hover:border-white/25 hover:shadow-[0_0_40px_rgba(255,255,255,0.06)]"
          : "border-white/5 opacity-70"
      }`}
      style={
        playable
          ? { boxShadow: `inset 0 0 0 1px ${game.accent}22` }
          : undefined
      }
    >
      <div
        className="mb-4 flex h-28 items-center justify-center rounded-xl text-5xl"
        style={{
          background: `linear-gradient(145deg, ${game.accent}22, transparent 70%)`,
          border: `1px solid ${game.accent}33`,
        }}
      >
        <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{game.glyph}</span>
      </div>
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="font-mono text-lg font-semibold tracking-tight text-white">
          {game.title}
        </h2>
        {!playable && (
          <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Soon
          </span>
        )}
      </div>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-400">{game.tagline}</p>
      <div className="flex items-center justify-between border-t border-white/5 pt-3 font-mono text-xs">
        <span style={{ color: game.accent }}>{formatSats(game.costSats)} / play</span>
        <span className="text-zinc-500">{game.category}</span>
      </div>
      {playable && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 opacity-0 transition group-hover:opacity-100"
          style={{ background: game.accent }}
        />
      )}
    </article>
  );

  if (!playable) return inner;
  return (
    <Link href={`/play/${game.id}`} className="block h-full">
      {inner}
    </Link>
  );
}
