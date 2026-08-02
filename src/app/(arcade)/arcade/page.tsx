"use client";

import Link from "next/link";
import { ArcadeFloor } from "@/components/arcade/ArcadeFloor";
import { ChipPortrait } from "@/components/Chip";
import { BRAND } from "@/lib/brand";

/** Cabinet Hall — reached after landing enter. */
export default function ArcadePage() {
  return (
    <main className="arcade-grid relative flex-1 px-3 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <p className="marquee-flash mb-5 text-center font-pixel text-[10px] sm:text-xs">
          ★ COINUP ARCADE — WALK THE FLOOR · PICK A CABINET ★
        </p>

        <section className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-pixel text-[10px] sm:text-[11px] leading-relaxed text-[var(--crt-green)]">
              COINUP ARCADE.
            </p>
            <p className="mt-2 font-pixel text-[10px] sm:text-[11px] leading-relaxed text-[var(--crt-green)]/80">
              INSERT SATS TO PLAY. WIN SATS.
            </p>
            <p className="mt-2 font-pixel text-[8px] text-[#5c5c6b]">
              PLAY AT YOUR OWN RISK.
            </p>
          </div>
          <div className="shrink-0 border-4 border-[var(--varsity-blue)] bg-black p-1 shadow-[6px_6px_0_#000]">
            <ChipPortrait size={128} priority showBadge className="!mt-0" />
          </div>
        </section>

        <div className="mb-10">
          <ArcadeFloor />
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/brand" className="pixel-btn pixel-btn--ghost">
            BRAND BOOK
          </Link>
          <p className="font-pixel text-[8px] text-[#3a3a44]">
            {BRAND.mission.bar}
          </p>
        </div>
      </div>
    </main>
  );
}
