import Link from "next/link";
import { formatSats } from "@/lib/payments";
import type { GameMeta } from "@/games/types";

export function GameCard({ game }: { game: GameMeta }) {
  const playable = game.status === "playable";

  const inner = (
    <article
      className={`pixel-panel group relative flex h-full flex-col p-4 ${
        playable ? "hover:border-[var(--neon-cyan)]" : "opacity-60"
      }`}
      style={
        playable
          ? { borderColor: game.accent, boxShadow: `4px 4px 0 ${game.accent}55` }
          : undefined
      }
    >
      <div
        className="mb-3 flex h-24 items-center justify-center border-2 border-[var(--steel)] bg-black text-4xl"
        style={{ borderColor: `${game.accent}88` }}
      >
        <span className="pixelated select-none">{game.glyph}</span>
      </div>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="font-pixel text-[11px] leading-snug text-white sm:text-xs">
          {game.title.toUpperCase()}
        </h2>
        {!playable && <span className="pixel-tag">SOON</span>}
      </div>
      <p className="mb-4 flex-1 font-pixel text-[8px] leading-relaxed text-[#8a8a9a]">
        {game.tagline}
      </p>
      <div className="flex items-center justify-between border-t-2 border-[var(--steel)] pt-3 font-pixel text-[8px]">
        <span style={{ color: game.accent }}>
          {formatSats(game.costSats).toUpperCase()}
        </span>
        <span className="text-[#5c5c6b]">{game.category.toUpperCase()}</span>
      </div>
      {playable && (
        <p className="mt-3 font-pixel text-[8px] text-[var(--crt-green)]">
          ▶ PLAY
        </p>
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
