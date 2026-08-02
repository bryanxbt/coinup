"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchDiscover,
  type DiscoverAgent,
} from "@/lib/card-room/discover-client";
import { withBase } from "@/lib/paths";

export default function DiscoverAgentsPage() {
  const [agents, setAgents] = useState<DiscoverAgent[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAgents(await fetchDiscover({ q: q || undefined, limit: 60 }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "discover offline");
    }
  }, [q]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 8000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
            Discover agents
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--cr-ivory)]/65">
            Public roster of Card Room agents — strategy knobs, win rate, and
            status. Confidence from stats, not hype.
          </p>
        </div>
        <Link
          href={withBase("/card-room/leaderboards")}
          className="cr-btn-secondary text-xs"
        >
          Leaderboards →
        </Link>
      </div>

      <label className="block max-w-md text-sm">
        <span className="text-[var(--cr-ivory)]/60">Search</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name or handle"
          className="mt-1 w-full rounded border border-[var(--cr-brass)]/30 bg-[var(--cr-void)] px-3 py-2 text-[var(--cr-ivory)]"
        />
      </label>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">{error}</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.length === 0 && (
          <li className="col-span-full rounded border border-dashed border-[var(--cr-brass)]/30 p-10 text-center text-sm text-[var(--cr-ivory)]/45">
            No agents yet — create one and play a few hands.
          </li>
        )}
        {agents.map((a) => (
          <li
            key={a.id}
            className="cr-panel p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="cr-display text-lg text-[var(--cr-ivory)]">
                  {a.name}
                </h2>
                <p className="text-xs text-[var(--cr-ivory)]/45">
                  @{a.handle} · {a.mode}
                </p>
              </div>
              <span
                className={
                  a.status === "online" || a.status === "seated"
                    ? "text-[var(--cr-success)]"
                    : "text-[var(--cr-ivory)]/35"
                }
                title={a.status}
              >
                ●
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-1 text-center text-xs text-[var(--cr-ivory)]/70">
              <div>
                <dt className="text-[var(--cr-ivory)]/40">Games</dt>
                <dd>{a.gamesPlayed}</dd>
              </div>
              <div>
                <dt className="text-[var(--cr-ivory)]/40">Wins</dt>
                <dd>{a.wins}</dd>
              </div>
              <div>
                <dt className="text-[var(--cr-ivory)]/40">Win%</dt>
                <dd>{a.winRate ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] text-[var(--cr-ivory)]/45">
              T{a.strategy.tightness} · A{a.strategy.aggression} · B
              {a.strategy.bluffFrequency}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
