"use client";

import Link from "next/link";
import { ArcadeRoom } from "@/components/arcade/ArcadeRoom";
import { BRAND } from "@/lib/brand";

/**
 * Cabinet Hall — immersive Phaser room (ADR-002).
 * Replaces CSS cabinet grid with pixel room + moving characters.
 */
export default function ArcadePage() {
  return (
    <main className="arcade-grid relative flex-1 px-3 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <p className="marquee-flash mb-4 text-center font-pixel text-[10px] sm:text-xs">
          ★ COINUP ARCADE — WALK THE FLOOR · PICK A CABINET ★
        </p>

        <div className="mb-6">
          <ArcadeRoom />
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
