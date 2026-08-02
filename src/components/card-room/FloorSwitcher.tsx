"use client";

import Link from "next/link";

type Floor = "arcade" | "card-room";

/**
 * Shared floor switcher — two visual skins via parent chrome.
 * Arcade: pixel feel inherited from ArcadeShell.
 * Card Room: serif/club feel from .card-room.
 */
export function FloorSwitcher({ current }: { current: Floor }) {
  const isCard = current === "card-room";
  const arcadeActive = current === "arcade";
  const cardActive = current === "card-room";

  const arcadeClass = isCard
    ? arcadeActive
      ? "bg-[var(--cr-emerald-felt)] px-2.5 py-1.5 text-[var(--cr-ivory)]"
      : "px-2.5 py-1.5 text-[var(--cr-ivory)]/55 hover:bg-[var(--cr-emerald-deep)]"
    : arcadeActive
      ? "bg-[var(--varsity-blue)] px-2 py-1 text-white"
      : "bg-black px-2 py-1 text-[#5c5c6b] hover:text-[var(--neon-amber)]";

  const cardClass = isCard
    ? cardActive
      ? "bg-gradient-to-b from-[var(--cr-gold-bright)] to-[var(--cr-brass)] px-2.5 py-1.5 font-semibold text-[var(--cr-void)]"
      : "px-2.5 py-1.5 text-[var(--cr-ivory)]/55 hover:bg-[var(--cr-emerald-deep)]"
    : cardActive
      ? "bg-[var(--neon-amber)] px-2 py-1 text-black"
      : "bg-black px-2 py-1 text-[#5c5c6b] hover:text-[var(--neon-amber)]";

  return (
    <div
      className={
        isCard
          ? "flex overflow-hidden border border-[var(--cr-brass)]/50 text-[9px] uppercase tracking-[0.14em]"
          : "flex overflow-hidden border-2 border-[var(--steel)] font-pixel text-[8px]"
      }
      role="navigation"
      aria-label="Arcade floors"
    >
      <Link href="/arcade" className={arcadeClass}>
        F1 Cabinet
      </Link>
      <Link href="/card-room" className={cardClass}>
        F2 Cards
      </Link>
    </div>
  );
}
