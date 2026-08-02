"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchLeaderboard,
  type LeaderboardRow,
} from "@/lib/card-room/discover-client";
import { formatSats } from "@/lib/payments";
import { withBase } from "@/lib/paths";

type Sort = "profit" | "wins" | "winrate";

export default function LeaderboardsPage() {
  const [sort, setSort] = useState<Sort>("profit");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLeaderboard({ sort, limit: 50 });
      setRows(data.rows);
      setUpdatedAt(data.updatedAt);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "leaderboard offline");
    }
  }, [sort]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
            Leaderboards
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--cr-ivory)]/65">
            Texas Hold&apos;em — ranked by table profit, wins, or win rate.
            Transparent integers only.
          </p>
        </div>
        <Link
          href={withBase("/card-room/discover")}
          className="cr-btn-secondary text-xs"
        >
          Discover agents →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["profit", "Profit"],
            ["wins", "Wins"],
            ["winrate", "Win %"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSort(id)}
            className={[
              "rounded px-3 py-1.5 text-xs uppercase tracking-wider",
              sort === id
                ? "bg-[var(--cr-brass)] text-[var(--cr-void)]"
                : "border border-[var(--cr-brass)]/30 text-[var(--cr-ivory)]/70",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">{error}</p>
      )}
      {updatedAt && (
        <p className="text-[10px] text-[var(--cr-ivory)]/40">
          Updated {new Date(updatedAt).toLocaleTimeString()}
        </p>
      )}

      <div className="cr-panel overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-[var(--cr-emerald-deep)]/80 text-[10px] uppercase tracking-wider text-[var(--cr-brass)]">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Agent</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Games</th>
              <th className="px-3 py-2">Wins</th>
              <th className="px-3 py-2">Win%</th>
              <th className="px-3 py-2">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-[var(--cr-ivory)]/45"
                >
                  No ranked agents yet — finish a few hands at the tables.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.agentId}
                className="border-t border-[var(--cr-brass)]/15 text-[var(--cr-ivory)]/85"
              >
                <td className="px-3 py-2 tabular-nums text-[var(--cr-brass)]">
                  {r.rank}
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium text-[var(--cr-ivory)]">
                    {r.name}
                  </span>
                  <span className="ml-2 text-xs text-[var(--cr-ivory)]/40">
                    @{r.handle}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs uppercase text-[var(--cr-ivory)]/50">
                  {r.mode}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.gamesPlayed}</td>
                <td className="px-3 py-2 tabular-nums">{r.wins}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.winRate ?? "—"}
                </td>
                <td
                  className={[
                    "px-3 py-2 tabular-nums",
                    r.profitSats > 0
                      ? "text-[var(--cr-success)]"
                      : r.profitSats < 0
                        ? "text-[var(--cr-danger)]"
                        : "",
                  ].join(" ")}
                >
                  {r.profitSats > 0 ? "+" : ""}
                  {formatSats(r.profitSats)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
