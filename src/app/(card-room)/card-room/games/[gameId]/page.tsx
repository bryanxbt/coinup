"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { getGame } from "@/lib/card-room/games-catalog";
import {
  listTables,
  registerAtTable,
  type TableSummary,
} from "@/lib/card-room/tables-client";
import { listMyAgents, type AgentPublic } from "@/lib/card-room/agents-client";
import { ensureHouseAgent } from "@/lib/card-room/house-agent";
import { ensureAvailableSats } from "@/lib/card-room/ensure-funds";
import { notifyCardRoomBalance } from "@/lib/card-room/balance-events";
import { formatSats } from "@/lib/payments";
import {
  fetchLeaderboard,
  type LeaderboardRow,
} from "@/lib/card-room/discover-client";

type Tab = "overview" | "leaderboard" | "rules";

function GameDetailInner() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const gameId = String(params.gameId ?? "");
  const game = getGame(gameId);
  const tab = (search.get("tab") as Tab) || "overview";

  const [tables, setTables] = useState<TableSummary[]>([]);
  const [agents, setAgents] = useState<AgentPublic[]>([]);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [agentId, setAgentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const setTab = (t: Tab) => {
    router.replace(`/card-room/games/${gameId}/?tab=${t}`,
      { scroll: false },
    );
  };

  const refresh = useCallback(async () => {
    try {
      const [t, a, lb] = await Promise.all([
        listTables().catch(() => [] as TableSummary[]),
        listMyAgents().catch(() => [] as AgentPublic[]),
        fetchLeaderboard({ sort: "profit", limit: 20 }).catch(() => ({
          rows: [] as LeaderboardRow[],
        })),
      ]);
      setTables(t);
      setAgents(a);
      setRows(lb.rows);
      setAgentId((prev) => {
        if (prev && a.some((x) => x.id === prev)) return prev;
        return a[0]?.id ?? "";
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const liveTables = useMemo(() => {
    if (!game?.tableGame) return tables;
    return tables.filter((t) => t.game === game.tableGame || !t.game);
  }, [tables, game]);

  if (!game) {
    return (
      <p className="text-sm text-[var(--cr-ivory)]/60">
        Unknown game.{" "}
        <Link href="/card-room" className="text-[var(--cr-brass)]">
          Back to the pit
        </Link>
      </p>
    );
  }

  const live = game.status === "live";
  const d = game.defaults;
  const r = game.rules;

  const onSeat = async (table: TableSummary) => {
    let id = agentId;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      if (!id) {
        const house = await ensureHouseAgent();
        id = house.id;
        setAgentId(id);
        await refresh();
      }
      const buyIn = table.minBuyIn;
      await ensureAvailableSats(buyIn);
      await registerAtTable({
        tableId: table.id,
        agentId: id,
        buyInSats: buyIn,
      });
      notifyCardRoomBalance();
      setMsg(`Seated at ${table.name}. Opening table…`);
      router.push(`/card-room/tables/view/?id=${encodeURIComponent(table.id)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "seat failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Game header — arena style, Card Room chrome */}
      <section className="cr-panel overflow-hidden p-0">
        <div className="border-b border-[var(--cr-brass)]/25 bg-[var(--cr-near-black)]/90 px-5 py-6 sm:px-8">
          <p className="cr-eyebrow">
            the pit / {game.shortTitle.toLowerCase()}
          </p>
          <h1 className="cr-display-xl mt-2 text-3xl sm:text-4xl">
            {game.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--cr-ivory)]/70">
            {game.overview}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/card-room/agents/create"
              className="cr-btn-primary text-xs"
            >
              Build an agent
            </Link>
            <Link
              href="/card-room/agents/house"
              className="cr-btn-secondary text-xs"
            >
              Use house agent
            </Link>
            <Link
              href="/card-room"
              className="cr-btn-secondary text-xs"
            >
              ← The Pit
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[var(--cr-brass)]/20 px-2 py-2 sm:px-4">
          {(
            [
              ["overview", "Overview"],
              ["leaderboard", "Leaderboard"],
              ["rules", "Rules"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "cr-nav-link",
                tab === id ? "is-active" : "",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          {live && (
            <span className="ml-auto mr-2 inline-flex items-center gap-1.5 cr-ui text-[var(--cr-success)]">
              <span className="cr-live-dot" /> Live
            </span>
          )}
        </div>
      </section>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]" role="alert">
          {error}
        </p>
      )}
      {msg && (
        <p className="text-sm text-[var(--cr-success)]" role="status">
          {msg}
        </p>
      )}

      {tab === "overview" && (
        <div className="space-y-6">
          {/* Spec strip */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Blinds", r.blinds ?? "—"],
              ["Table size", r.tableSize ?? "—"],
              ["Buy-in", r.buyIn ?? r.startingStack ?? "—"],
              ["Action clock", r.actionTimeout ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="cr-panel px-4 py-3">
                <p className="cr-ui text-[var(--cr-ivory)]/40">{k}</p>
                <p className="mt-1 font-semibold tabular-nums text-[var(--cr-ivory)]">
                  {v}
                </p>
              </div>
            ))}
          </div>

          {live ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="cr-eyebrow">Open tables</p>
                  <h2 className="cr-display mt-1 text-xl text-[var(--cr-ivory)]">
                    Seat an agent
                  </h2>
                </div>
                <label className="text-xs text-[var(--cr-ivory)]/70">
                  Agent
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="mt-1 block min-w-[12rem] rounded border border-[var(--cr-brass)]/30 bg-[var(--cr-void)] px-2 py-1.5"
                  >
                    {agents.length === 0 && (
                      <option value="">House agent on seat</option>
                    )}
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.mode})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <ul className="space-y-3">
                {liveTables.length === 0 && (
                  <li className="cr-panel p-8 text-center text-sm text-[var(--cr-ivory)]/50">
                    No tables online — is the API running?
                  </li>
                )}
                {liveTables.map((t) => (
                  <li
                    key={t.id}
                    className="cr-panel flex flex-wrap items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <h3 className="cr-display text-lg text-[var(--cr-ivory)]">
                        {t.name}
                      </h3>
                      <p className="text-xs text-[var(--cr-ivory)]/50">
                        {t.status} · {t.seated}/{t.maxSeats} seated · blinds{" "}
                        {t.sbSats}/{t.bbSats} · hand #{t.handNumber}
                        {t.handId ? " · live hand" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/card-room/tables/view/?id=${encodeURIComponent(t.id)}`}
                        className="cr-btn-secondary text-xs"
                      >
                        Watch table
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        className="cr-btn-primary text-xs disabled:opacity-50"
                        onClick={() => void onSeat(t)}
                      >
                        {busy
                          ? "…"
                          : `Enter · ${formatSats(t.minBuyIn)}`}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="cr-panel p-8 text-center text-sm text-[var(--cr-ivory)]/55">
              This game is not open yet. Read the Rules tab for the planned
              format.
            </div>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="cr-panel overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="cr-ui text-[var(--cr-brass)]">
              <tr className="border-b border-[var(--cr-brass)]/20">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Games</th>
                <th className="px-4 py-3">Wins</th>
                <th className="px-4 py-3">Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--cr-ivory)]/45"
                  >
                    No ranks yet — play cash tables to appear here.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr
                  key={row.agentId}
                  className="border-t border-[var(--cr-brass)]/10"
                >
                  <td className="px-4 py-2 tabular-nums text-[var(--cr-brass)]">
                    {row.rank}
                  </td>
                  <td className="px-4 py-2">
                    {row.name}{" "}
                    <span className="text-xs text-[var(--cr-ivory)]/40">
                      @{row.handle}
                    </span>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{row.gamesPlayed}</td>
                  <td className="px-4 py-2 tabular-nums">{row.wins}</td>
                  <td className="px-4 py-2 tabular-nums">
                    {row.profitSats > 0 ? "+" : ""}
                    {formatSats(row.profitSats)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "rules" && (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Starting / buy-in", r.startingStack ?? r.buyIn],
              ["Table size", r.tableSize],
              ["Blinds", r.blinds],
              ["Action timeout", r.actionTimeout],
              ["Min stack", r.minStack],
              ["Max tables", r.maxTables],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={String(k)} className="cr-panel px-4 py-3">
                  <p className="cr-ui text-[var(--cr-ivory)]/40">{k}</p>
                  <p className="mt-1 text-[var(--cr-ivory)]">{v}</p>
                </div>
              ))}
          </div>
          <div className="cr-panel p-5">
            <h3 className="cr-display text-lg text-[var(--cr-brass)]">
              Game rules
            </h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--cr-ivory)]/70">
              {r.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {r.chipRules && (
              <>
                <h3 className="cr-display mt-6 text-lg text-[var(--cr-brass)]">
                  Chip rules
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--cr-ivory)]/70">
                  {r.chipRules.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
            {r.season && (
              <>
                <h3 className="cr-display mt-6 text-lg text-[var(--cr-brass)]">
                  Season
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--cr-ivory)]/70">
                  {r.season.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--cr-ivory)]/50">Loading game…</p>
      }
    >
      <GameDetailInner />
    </Suspense>
  );
}
