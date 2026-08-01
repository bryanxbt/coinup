"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { TypeLines, TypeText } from "@/components/arcade/TypeText";
import { ChipPortrait } from "@/components/Chip";
import { GameCard } from "@/components/GameCard";
import { listLobbyGames } from "@/games/registry";
import { BRAND, chipExpressions, colors, officialRoster } from "@/lib/brand";
import { withBase } from "@/lib/paths";

export default function LobbyPage() {
  const games = useMemo(() => listLobbyGames(), []);
  const playable = games.filter((g) => g.status === "playable");
  const soon = games.filter((g) => g.status !== "playable");

  const [phase, setPhase] = useState(0);
  // phase: 0 hero types → 1 show cabinets → 2 show roster → 3 brand strip

  const heroLines = useMemo(
    () => [
      BRAND.taglines.floor.toUpperCase(),
      BRAND.forever,
      `BITCOIN ARCADE · ${BRAND.chain.toUpperCase()}`,
      BRAND.taglines.product.toUpperCase(),
      BRAND.mission.bar,
    ],
    [],
  );

  return (
    <main className="arcade-grid relative flex-1 px-3 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Attract marquee */}
        <p className="marquee-flash mb-6 text-center font-pixel text-[10px] sm:text-xs">
          ★ COINUP ARCADE — FREE PLAY UNTIL YOU INSERT COIN ★
        </p>

        {/* Hero */}
        <section className="mb-12 flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <TypeLines
              lines={heroLines}
              speed={16}
              lineGap={140}
              lineClassName="font-pixel text-[10px] sm:text-[11px] leading-relaxed text-[var(--crt-green)] mb-2"
              onAllDone={() => setPhase((p) => Math.max(p, 1))}
            />
            {phase >= 1 && (
              <div className="pixel-panel mt-6 border-[var(--neon-cyan)] p-4 text-left">
                <p className="hud-label mb-2 text-[var(--neon-cyan)]">CHIP.EXE</p>
                <TypeText
                  text={`WELCOME TO ${BRAND.fullName.toUpperCase()}. ALL ACCESS. ALL CABINETS. ${BRAND.taglines.jacket.toUpperCase()}`}
                  speed={14}
                  className="font-pixel text-[9px] leading-relaxed text-[var(--neon-cyan)]"
                  as="p"
                  holdCursor
                  onDone={() => setPhase((p) => Math.max(p, 2))}
                />
              </div>
            )}
          </div>
          <div className="shrink-0 border-4 border-[var(--varsity-blue)] bg-black p-1 shadow-[6px_6px_0_#000]">
            <ChipPortrait size={256} priority showBadge className="!mt-0" />
          </div>
        </section>

        {/* Open cabinets */}
        {phase >= 1 && (
          <section className="mb-12 animate-[fadeIn_0.3s_step-end]">
            <h2 className="mb-4 font-pixel text-[10px] text-[#5c5c6b]">
              <TypeText
                text={`OPEN CABINETS // ${playable.length}`}
                speed={20}
                holdCursor={false}
                className="font-pixel text-[10px] text-[#5c5c6b]"
              />
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {playable.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Forever roster */}
        {phase >= 2 && soon.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 font-pixel text-[10px] text-[#5c5c6b]">
              FOREVER ROSTER
            </h2>
            <p className="mb-4 font-pixel text-[8px] text-[#3a3a44]">
              <TypeText
                text="AND MORE COMING SOON..."
                speed={24}
                holdCursor
                className="font-pixel text-[8px] text-[#3a3a44]"
                onDone={() => setPhase((p) => Math.max(p, 3))}
              />
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {soon.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {/* Brand strip */}
        {phase >= 3 && (
          <section className="pixel-panel mb-10 overflow-hidden border-[var(--neon-magenta)]">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative min-h-[200px] border-b-2 border-[var(--steel)] md:border-b-0 md:border-r-2">
                <Image
                  src={withBase(BRAND.assets.brandBookV1)}
                  alt="CoinUp Brand Book v1.0"
                  fill
                  unoptimized
                  className="pixelated object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
                <p
                  className="font-pixel text-[8px]"
                  style={{ color: colors.purple }}
                >
                  BRAND BOOK v{BRAND.version}
                </p>
                <h2 className="font-pixel text-[11px] text-white sm:text-xs">
                  CHIP.EXE // EXPRESSIONS
                </h2>
                <ul className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(chipExpressions) as [
                      string,
                      { label: string },
                    ][]
                  ).map(([key, val]) => (
                    <li
                      key={key}
                      className="border-2 border-[var(--steel)] bg-black px-2 py-1.5 font-pixel text-[8px]"
                      style={{ color: colors.crtGreen }}
                    >
                      {val.label}
                    </li>
                  ))}
                </ul>
                <p className="font-pixel text-[8px] leading-relaxed text-[#5c5c6b]">
                  {officialRoster.length} CABINETS ON THE FOREVER LIST.
                  PIXEL SYSTEM ONLINE.
                </p>
                <Link href="/brand" className="pixel-btn pixel-btn--pink w-fit">
                  OPEN BRAND BOOK
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
