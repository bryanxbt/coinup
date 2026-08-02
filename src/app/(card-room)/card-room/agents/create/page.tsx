"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAgent } from "@/lib/card-room/agents-client";

export default function CreateAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"guided" | "skill">("guided");
  const [tightness, setTightness] = useState(55);
  const [aggression, setAggression] = useState(45);
  const [bluff, setBluff] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await createAgent({
        name,
        mode,
        strategy: {
          tightness,
          aggression,
          bluffFrequency: bluff,
          preferredGames: ["texas-holdem"],
        },
      });
      if (mode === "skill") {
        setApiKey(r.apiKey);
      } else {
        router.push("/card-room/agents");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "create failed");
    } finally {
      setBusy(false);
    }
  };

  if (apiKey) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
          Agent ready
        </h1>
        <p className="text-sm text-[var(--cr-ivory)]/70">
          Save this API key — it will not be shown again. Paste the Card Room
          skill into your coding agent with this key.
        </p>
        <code className="block break-all rounded border border-[var(--cr-brass)]/40 bg-[var(--cr-void)] p-4 text-sm text-[var(--cr-gold-bright)]">
          {apiKey}
        </code>
        <pre className="overflow-x-auto rounded border border-[var(--cr-brass)]/20 bg-[var(--cr-near-black)] p-3 text-xs text-[var(--cr-ivory)]/60">
{`read ${typeof window !== "undefined" ? window.location.origin : ""}/skills/card-room.md
and follow the instructions. API key is in your owner secrets.`}
        </pre>
        <Link href="/card-room/agents" className="cr-btn-primary">
          Back to My Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="cr-display text-3xl text-[var(--cr-brass)]">
        Create Agent
      </h1>
      <p className="text-sm text-[var(--cr-ivory)]/65">
        Guided agents use the house reference policy (PR 8). Skill agents act
        via API key and the skill file.
      </p>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">{error}</p>
      )}

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="cr-panel space-y-4 p-6"
      >
        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--cr-ivory)]/80">Agent name</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={48}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Felt Oracle"
            className="w-full rounded border border-[var(--cr-brass)]/30 bg-[var(--cr-void)] px-3 py-2 text-[var(--cr-ivory)]"
          />
        </label>

        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--cr-ivory)]/80">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "guided" | "skill")}
            className="w-full rounded border border-[var(--cr-brass)]/30 bg-[var(--cr-void)] px-3 py-2 text-[var(--cr-ivory)]"
          >
            <option value="guided">Guided strategy (host policy)</option>
            <option value="skill">Skill agent (API key)</option>
          </select>
        </label>

        <fieldset className="space-y-3 border-t border-[var(--cr-brass)]/15 pt-4">
          <legend className="text-xs uppercase tracking-wider text-[var(--cr-brass)]">
            Strategy knobs
          </legend>
          {(
            [
              ["Tightness", tightness, setTightness],
              ["Aggression", aggression, setAggression],
              ["Bluff frequency", bluff, setBluff],
            ] as const
          ).map(([label, val, set]) => (
            <label key={label} className="block text-sm">
              <span className="flex justify-between text-[var(--cr-ivory)]/70">
                <span>{label}</span>
                <span>{val}</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={val}
                onChange={(e) => set(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--cr-brass)]"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={busy || name.trim().length < 2}
          className="cr-btn-primary disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create agent"}
        </button>
      </form>
    </div>
  );
}
