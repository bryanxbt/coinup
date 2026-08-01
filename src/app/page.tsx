import Image from "next/image";
import { ChipBubble, ChipPortrait } from "@/components/Chip";
import { GameCard } from "@/components/GameCard";
import { listLobbyGames } from "@/games/registry";
import Link from "next/link";
import { BRAND, chipExpressions, colors, officialRoster } from "@/lib/brand";
import { withBase } from "@/lib/paths";

export default function LobbyPage() {
  const games = listLobbyGames();
  const playable = games.filter((g) => g.status === "playable");
  const soon = games.filter((g) => g.status !== "playable");

  return (
    <main className="arcade-grid relative flex-1 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Hero */}
        <section className="mb-14 flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="flex-1 text-center sm:text-left">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-amber-400/90">
              {BRAND.taglines.floor}
            </p>
            <h1 className="mb-2 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {BRAND.forever}
            </h1>
            <p className="mb-4 max-w-xl text-base leading-relaxed text-zinc-400">
              Virtual cabinets on{" "}
              <span className="text-zinc-200">{BRAND.chain}</span>.{" "}
              {BRAND.taglines.product} Floor manager:{" "}
              <span className="text-cyan-300">Chip</span>.
            </p>
            <p
              className="mb-6 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.12em]"
              style={{ color: colors.magenta }}
            >
              {BRAND.mission.bar}
            </p>
            <ChipBubble className="mx-auto sm:mx-0" expression="hyped">
              Welcome to {BRAND.fullName}. All access. All cabinets.{" "}
              {BRAND.taglines.jacket}
            </ChipBubble>
          </div>
          <ChipPortrait size={256} priority className="shrink-0" />
        </section>

        {/* Open cabinets */}
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
            Open cabinets · {playable.length}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {playable.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Forever roster — coming soon */}
        {soon.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-1 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              Forever roster
            </h2>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
              And more coming soon…
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {soon.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Brand guide reference strip */}
        <section className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="relative min-h-[220px] border-b border-white/10 md:border-b-0 md:border-r">
              <Image
                src={withBase(BRAND.assets.brandBookV1)}
                alt="CoinUp Brand Book v1.0"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.3em]"
                style={{ color: colors.purple }}
              >
                Brand guide
              </p>
              <h2 className="font-mono text-lg font-bold text-white">
                CHIP.EXE // EXPRESSIONS
              </h2>
              <ul className="grid grid-cols-2 gap-2 font-mono text-[11px] text-zinc-400">
                {(
                  Object.entries(chipExpressions) as [
                    string,
                    { label: string },
                  ][]
                ).map(([key, val]) => (
                  <li
                    key={key}
                    className="rounded border border-white/10 bg-black/40 px-2 py-1.5"
                    style={{ color: colors.crtGreen }}
                  >
                    {val.label}
                  </li>
                ))}
              </ul>
              <p className="text-sm leading-relaxed text-zinc-500">
                Full living brand book (80–120 page target): mission, pixel
                system, Chip bible, cabinets, merch, social.{" "}
                {officialRoster.length} named cabinets on the forever list.
              </p>
              <Link
                href="/brand"
                className="inline-flex w-fit rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 font-mono text-xs font-bold text-white"
              >
                OPEN BRAND BOOK →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
