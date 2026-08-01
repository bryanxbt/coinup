"use client";

import Link from "next/link";
import type { GameMeta } from "@/games/types";
import { formatSats } from "@/lib/payments";

type Props = {
  game: GameMeta;
  selected?: boolean;
  onSelect?: () => void;
};

/**
 * Front-facing cabinet sprite (CSS pixel machine).
 * Brand ch.10: marquee · screen · body · coin door · accent neon.
 */
export function PixelCabinet({ game, selected, onSelect }: Props) {
  const playable = game.status === "playable";
  const accent = game.accent;

  const className = `cabinet group relative w-[104px] shrink-0 border-0 bg-transparent p-0 text-left no-underline sm:w-[120px] ${
    selected ? "cabinet--selected" : ""
  } ${playable ? "cabinet--live" : "cabinet--soon"}`;

  const body = (
    <>
      <div className="cabinet-marquee">
        <span className="cabinet-marquee-text">{shortTitle(game.title)}</span>
      </div>

      <div className="cabinet-bezel">
        <div className="cabinet-screen">
          <span className="cabinet-glyph" aria-hidden>
            {game.glyph}
          </span>
          {playable ? (
            <span className="cabinet-attract">INSERT</span>
          ) : (
            <span className="cabinet-attract cabinet-attract--dim">SOON</span>
          )}
        </div>
      </div>

      <div className="cabinet-body">
        <div className="cabinet-sideart" aria-hidden>
          <span className="cabinet-c">C</span>
        </div>
        <div className="cabinet-controls" aria-hidden>
          <span className="cabinet-stick" />
          <span className="cabinet-btn" />
          <span className="cabinet-btn cabinet-btn--b" />
        </div>
        <div className="cabinet-coin">
          <span className="cabinet-slot" />
        </div>
      </div>

      <div className="cabinet-base" />

      <div className="cabinet-plate">
        <p className="cabinet-title">{game.title.toUpperCase()}</p>
        <p className="cabinet-cost">
          {playable ? formatSats(game.costSats).toUpperCase() : "COMING SOON"}
        </p>
        {playable && game.players === 2 && (
          <p className="cabinet-mp">2P LIVE</p>
        )}
      </div>

      {!playable && <div className="cabinet-tape">WIP</div>}
    </>
  );

  if (playable) {
    if (game.externalUrl) {
      return (
        <a
          href={game.externalUrl}
          target="_blank"
          rel="noreferrer"
          className={`${className} cursor-pointer`}
          style={{ ["--cab-accent" as string]: accent }}
          aria-label={`${game.title} — play on $SOLE`}
          onClick={onSelect}
        >
          {body}
        </a>
      );
    }
    return (
      <Link
        href={`/play/${game.id}`}
        className={`${className} cursor-pointer`}
        style={{ ["--cab-accent" as string]: accent }}
        aria-label={`${game.title} — play`}
        onClick={onSelect}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${className} cursor-pointer`}
      style={{ ["--cab-accent" as string]: accent }}
      aria-label={`${game.title} — coming soon`}
      onClick={onSelect}
    >
      {body}
    </button>
  );
}

function shortTitle(title: string): string {
  if (title.length <= 10) return title.toUpperCase();
  return title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 6);
}
