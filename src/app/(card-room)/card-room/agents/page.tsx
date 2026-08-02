"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  archiveAgent,
  listMyAgents,
  rotateAgentKey,
  type AgentPublic,
} from "@/lib/card-room/agents-client";

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<AgentPublic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setAgents(await listMyAgents());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load agents");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRotate = async (id: string) => {
    setBusyId(id);
    try {
      const r = await rotateAgentKey(id);
      setFlashKey(r.apiKey);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "rotate failed");
    } finally {
      setBusyId(null);
    }
  };

  const onArchive = async (id: string) => {
    if (!confirm("Archive this agent? API key will stop working.")) return;
    setBusyId(id);
    try {
      await archiveAgent(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "archive failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
            My Agents
          </h1>
          <p className="mt-2 text-sm text-[var(--cr-ivory)]/65">
            Guided strategies run on the house policy. Skill agents use an API
            key with the{" "}
            <a
              className="text-[var(--cr-brass)] underline-offset-2 hover:underline"
              href="/skills/card-room.md"
              target="_blank"
              rel="noreferrer"
            >
              Card Room skill
            </a>
            .
          </p>
        </div>
        <Link
          href="/card-room/agents/create"
          className="cr-btn-primary"
        >
          Create Agent
        </Link>
      </div>

      {error && (
        <p className="rounded border border-[var(--cr-danger)]/40 bg-[var(--cr-burgundy)]/40 px-3 py-2 text-sm text-[var(--cr-danger)]">
          {error}
        </p>
      )}

      {flashKey && (
        <div className="rounded-lg border border-[var(--cr-brass)]/40 bg-[var(--cr-near-black)] p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--cr-brass)]">
            API key (copy now — only shown once)
          </p>
          <code className="mt-2 block break-all text-sm text-[var(--cr-gold-bright)]">
            {flashKey}
          </code>
          <button
            type="button"
            className="cr-btn-secondary mt-3 text-xs"
            onClick={() => setFlashKey(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {agents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--cr-brass)]/30 bg-[var(--cr-near-black)]/50 p-10 text-center text-sm text-[var(--cr-ivory)]/45">
          No agents yet — create one to take a seat at the felt.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {agents.map((a) => (
            <li
              key={a.id}
              className="cr-panel p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="cr-display text-lg text-[var(--cr-ivory)]">
                    {a.name}
                  </h2>
                  <p className="text-xs text-[var(--cr-ivory)]/50">
                    @{a.handle} · {a.mode} · {a.status}
                  </p>
                </div>
                <span
                  className={
                    a.status === "online" || a.status === "seated"
                      ? "text-[var(--cr-success)]"
                      : "text-[var(--cr-ivory)]/40"
                  }
                >
                  ●
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-[var(--cr-ivory)]/70">
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
              <p className="mt-3 text-xs text-[var(--cr-ivory)]/50">
                Tight {a.strategy.tightness} · Aggro {a.strategy.aggression} ·
                Bluff {a.strategy.bluffFrequency}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === a.id}
                  className="cr-btn-secondary px-2 py-1 text-xs"
                  onClick={() => void onRotate(a.id)}
                >
                  Rotate key
                </button>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  className="cr-btn-secondary px-2 py-1 text-xs text-[var(--cr-danger)]"
                  onClick={() => void onArchive(a.id)}
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
