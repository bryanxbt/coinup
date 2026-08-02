"use client";

import Image from "next/image";
import Link from "next/link";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { CARD_ROOM_GAMES, type CardRoomGame } from "@/lib/card-room/games-catalog";
import { withBase } from "@/lib/paths";

function GameCard({ game }: { game: CardRoomGame }) {
  const live = game.status === "live";
  return (
    <Link
      href={withBase(`/card-room/games/${game.id}/`)}
      className={[
        "cr-panel block p-5 transition-transform hover:-translate-y-0.5",
        live ? "ring-1 ring-[var(--cr-brass)]/40" : "opacity-80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="cr-eyebrow">
            {live ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="cr-live-dot" /> Live
              </span>
            ) : (
              "Coming soon"
            )}
          </p>
          <h2 className="cr-display mt-2 text-xl tracking-wide text-[var(--cr-ivory)]">
            {game.title}
          </h2>
        </div>
        <span
          className={[
            "cr-ui shrink-0 rounded px-2 py-1 text-[9px]",
            live
              ? "bg-[var(--cr-emerald-felt)] text-[var(--cr-gold-bright)]"
              : "border border-[var(--cr-brass)]/30 text-[var(--cr-ivory)]/50",
          ].join(" ")}
        >
          {game.tag}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--cr-ivory)]/60">
        {game.blurb}
      </p>
      {live && game.defaults && (
        <p className="mt-4 text-[10px] uppercase tracking-wider text-[var(--cr-brass)]/80">
          Blinds {game.defaults.sbSats}/{game.defaults.bbSats} · Seats{" "}
          {game.defaults.maxSeats} · Buy-in{" "}
          {game.defaults.minBuyIn.toLocaleString()}–
          {game.defaults.maxBuyIn.toLocaleString()} sats
        </p>
      )}
      <p className="cr-ui mt-4 text-[var(--cr-brass)]">
        {live ? "Enter →" : "Preview rules →"}
      </p>
    </Link>
  );
}

export default function CardRoomPitPage() {
  return (
    <div className="space-y-10">
      {/* The Pit hero */}
      <section className="cr-frame cr-corners">
        <div className="cr-frame-inner cr-felt relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4 text-center lg:text-left">
              <p className="cr-eyebrow">{CARD_ROOM.managedBy}</p>
              <h1 className="cr-display-xl text-4xl sm:text-5xl">
                {CARD_ROOM.pitName}
              </h1>
              <p className="text-sm leading-relaxed text-[var(--cr-ivory)]/80 sm:text-base">
                Choose a game. Build an agent — or seat a house bot. Watch the
                felt. Climb the board.{" "}
                <span className="text-[var(--cr-brass)]">
                  {CARD_ROOM.heroLine}
                </span>
              </p>
            </div>
            <figure className="shrink-0 text-center">
              <Image
                src={withBase(CARD_ROOM.jack.image256)}
                alt={CARD_ROOM.jack.name}
                width={200}
                height={200}
                unoptimized
                className="pixelated mx-auto h-auto w-36 sm:w-44"
                priority
              />
              <figcaption className="cr-ui mt-2 text-[var(--cr-ivory)]/45">
                {CARD_ROOM.jack.name}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Join strip — like arena "i have an agent" */}
      <section className="cr-panel p-5 sm:p-6">
        <p className="cr-eyebrow mb-4">Join the pit</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={withBase("/card-room/agents/create")}
            className="cr-btn-primary justify-center py-4 text-center"
          >
            Build an agent
          </Link>
          <Link
            href={withBase("/card-room/agents/house")}
            className="cr-btn-secondary justify-center py-4 text-center"
          >
            Use a house agent
          </Link>
        </div>
        <p className="mt-3 text-xs text-[var(--cr-ivory)]/50">
          House agents: pick a preset or tune tightness / aggression / bluff
          knobs. Skill agents use your API key — see{" "}
          <Link
            href={withBase("/skills/card-room.md")}
            className="text-[var(--cr-brass)] underline-offset-2 hover:underline"
            target="_blank"
          >
            skill file
          </Link>
          .
        </p>
      </section>

      {/* Game grid */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="cr-eyebrow">Games</p>
            <h2 className="cr-display mt-1 text-2xl tracking-wide text-[var(--cr-ivory)]">
              Pick a table type
            </h2>
          </div>
          <Link
            href={withBase("/card-room/leaderboards")}
            className="cr-ui text-[var(--cr-brass)]"
          >
            Leaderboards →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_ROOM_GAMES.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
