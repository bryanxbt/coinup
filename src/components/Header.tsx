"use client";

import Link from "next/link";
import { formatSats, type ArcadeBalance } from "@/lib/payments";

export function Header({
  balance,
  onAddCoin,
}: {
  balance: ArcadeBalance | null;
  onAddCoin: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-8">
      <Link href="/" className="group flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-white">
          COIN<span className="text-amber-400">UP</span>
        </span>
        <span className="hidden text-xs uppercase tracking-[0.2em] text-zinc-500 sm:inline group-hover:text-zinc-400">
          Arch Arcade
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 font-mono text-sm text-amber-200">
          {balance ? formatSats(balance.availableSats) : "—"}
        </div>
        <button
          type="button"
          onClick={onAddCoin}
          className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 font-mono text-sm font-semibold text-black shadow-[0_0_20px_rgba(251,191,36,0.35)] transition hover:brightness-110"
        >
          INSERT COIN
        </button>
      </div>
    </header>
  );
}
