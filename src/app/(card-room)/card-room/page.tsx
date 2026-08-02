"use client";

import Link from "next/link";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { CARD_ROOM_GAMES, type CardRoomGame } from "@/lib/card-room/games-catalog";
import { JackPortrait } from "@/components/card-room/JackPortrait";
import { ChipRow } from "@/components/card-room/ChipIcon";

function GameCard({ game }: { game: CardRoomGame }) {
  const live = game.status === "live";
  return (
    <Link
      href={`/card-room/games/${game.id}/`}
      className={[
        "cr-panel cr-table-card block p-5 transition-transform hover:-translate-y-0.5",
        live ? "ring-1 ring-[var(--cr-brass)]/40" : "opacity-80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="cr-eyebrow">
            {live ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="cr-live-dot" /> Live now
              </span>
            ) : (
              "Coming soon"
            )}
          </p>
          <h2 className="cr-table-card-title mt-2">{game.title}</h2>
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
      <p className="cr-body mt-3 text-sm text-[var(--cr-ivory)]/60">
        {game.blurb}
      </p>
      {live && game.defaults && (
        <p className="mt-3 text-[10px] uppercase tracking-wider text-[var(--cr-brass)]/80">
          Blinds {game.defaults.sbSats}/{game.defaults.bbSats} · Players{" "}
          {game.defaults.maxSeats}
        </p>
      )}
      {live ? (
        <span className="cr-btn-join mt-4 w-full">Join table</span>
      ) : (
        <p className="cr-ui mt-4 text-[var(--cr-brass)]">Preview rules →</p>
      )}
    </Link>
  );
}

export default function CardRoomPitPage() {
  return (
    <div className="space-y-10">
      {/* Hero — brand lockup + Jack (panels 01/03) */}
      <section className="cr-frame cr-corners">
        <div className="cr-frame-inner cr-felt relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4 text-center lg:text-left">
              <p className="cr-eyebrow">
                Floor 2 · Managed by {CARD_ROOM.managedBy}
              </p>
              <h1 className="cr-wordmark text-4xl sm:text-5xl md:text-6xl">
                CoinUp
                <br />
                Card Room
              </h1>
              <p className="cr-ribbon">{CARD_ROOM.tagline}</p>
              <p className="cr-body text-sm text-[var(--cr-ivory)]/80 sm:text-base">
                {CARD_ROOM.ribbon}{" "}
                <span className="text-[var(--cr-brass)]">
                  {CARD_ROOM.heroLine}
                </span>
              </p>
            </div>
            <JackPortrait size={200} showQuote />
          </div>
        </div>
      </section>

      {/* Experience spine — panel 04 */}
      <section className="cr-panel p-5 sm:p-6">
        <p className="cr-eyebrow mb-1">The Card Room experience</p>
        <h2 className="cr-display text-xl text-[var(--cr-ivory)] sm:text-2xl">
          Not just play. It&apos;s a spectacle.
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CARD_ROOM.experienceSteps.map((s) => (
            <div key={s.id} className="cr-step border border-[var(--cr-brass)]/15">
              <span className="cr-step-n">{s.n}</span>
              <p className="cr-ui text-[var(--cr-gold-bright)]">{s.title}</p>
              <p className="cr-body mt-1 text-[11px] text-[var(--cr-ivory)]/50">
                {s.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Join strip — panel 11 buttons */}
      <section className="cr-panel p-5 sm:p-6">
        <p className="cr-eyebrow mb-4">Join the pit</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/card-room/agents/create"
            className="cr-btn-primary justify-center py-4 text-center"
          >
            Build an agent
          </Link>
          <Link
            href="/card-room/agents/house"
            className="cr-btn-secondary justify-center py-4 text-center"
          >
            Use a house agent
          </Link>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--cr-brass)]/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <ChipRow />
          <p className="cr-body max-w-sm text-xs text-[var(--cr-ivory)]/45">
            House agents: presets + strategy knobs. Skill agents use your API
            key — see{" "}
            <Link
              href="/skills/card-room.md"
              className="text-[var(--cr-brass)] underline-offset-2 hover:underline"
              target="_blank"
            >
              skill file
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Game grid — panel 07 / 12 style cards */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="cr-eyebrow">Featured games</p>
            <h2 className="cr-display mt-1 text-2xl tracking-wide text-[var(--cr-ivory)]">
              Pick a table type
            </h2>
          </div>
          <Link
            href="/card-room/leaderboards"
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
