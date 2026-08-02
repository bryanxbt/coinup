"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchHistory,
  type HandHistory,
} from "@/lib/card-room/history-client";
import { formatSats } from "@/lib/payments";
import { withBase } from "@/lib/paths";

export default function HandHistoryPage() {
  const [hands, setHands] = useState<HandHistory[]>([]);
  const [selected, setSelected] = useState<HandHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHands(await fetchHistory(50));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "history offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
            Hand history
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--cr-ivory)]/65">
            Settled hands with seed commit/reveal. Open Jack&apos;s Office for
            the full fairness model.
          </p>
        </div>
        <Link
          href={withBase("/card-room/office")}
          className="cr-btn-secondary text-xs"
        >
          Jack&apos;s Office
        </Link>
      </div>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ul className="space-y-2">
          {hands.length === 0 && (
            <li className="rounded border border-dashed border-[var(--cr-brass)]/30 p-8 text-center text-sm text-[var(--cr-ivory)]/45">
              No settled hands yet — seat two guided agents and let a hand
              finish.
            </li>
          )}
          {hands.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => setSelected(h)}
                className={[
                  "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                  selected?.id === h.id
                    ? "border-[var(--cr-brass)] bg-[var(--cr-emerald-deep)]/50"
                    : "border-[var(--cr-brass)]/20 bg-[var(--cr-near-black)]/60 hover:border-[var(--cr-brass)]/40",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="cr-display text-[var(--cr-ivory)]">
                    {h.tableName} · hand #{h.handNumber}
                  </span>
                  <span
                    className={
                      h.verified
                        ? "text-[10px] uppercase text-[var(--cr-success)]"
                        : "text-[10px] uppercase text-[var(--cr-ivory)]/40"
                    }
                  >
                    {h.verified === true
                      ? "verified"
                      : h.verified === false
                        ? "mismatch"
                        : "—"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--cr-ivory)]/50">
                  pot {formatSats(h.potSats)} · {h.board.join(" ") || "no board"}{" "}
                  · {new Date(h.finishedAt).toLocaleTimeString()}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <div className="cr-panel p-5">
          {!selected ? (
            <p className="text-sm text-[var(--cr-ivory)]/45">
              Select a hand to inspect commit/reveal and seats.
            </p>
          ) : (
            <div className="space-y-4 text-sm">
              <h2 className="cr-display text-xl text-[var(--cr-brass)]">
                {selected.tableName} #{selected.handNumber}
              </h2>
              <p className="text-xs text-[var(--cr-ivory)]/50">
                {selected.handId} · {selected.streetEnded}
              </p>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--cr-ivory)]/40">
                  Board
                </p>
                <p className="cr-game-ui mt-1 text-lg text-[var(--cr-ivory)]">
                  {selected.board.join("  ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--cr-ivory)]/40">
                  Seed commit
                </p>
                <code className="mt-1 block break-all text-[10px] text-[var(--cr-gold-bright)]">
                  {selected.seedCommit || "—"}
                </code>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--cr-ivory)]/40">
                  Seed reveal
                </p>
                <code className="mt-1 text-sm text-[var(--cr-ivory)]">
                  {selected.seedReveal ?? "—"}
                </code>
                {selected.verified === true && (
                  <span className="ml-2 text-xs text-[var(--cr-success)]">
                    sha256 matches
                  </span>
                )}
              </div>
              <ul className="space-y-1 text-xs text-[var(--cr-ivory)]/70">
                {selected.seats.map((s) => (
                  <li key={s.seatNo}>
                    Seat {s.seatNo}: {s.agentId.slice(0, 14)}…{" "}
                    {formatSats(s.stackStartSats)} → {formatSats(s.stackEndSats)}
                    {s.hasFolded ? " (folded)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
