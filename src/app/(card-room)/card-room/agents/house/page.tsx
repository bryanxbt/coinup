"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { withBase } from "@/lib/paths";
import {
  createHouseFromPreset,
  HOUSE_PRESETS,
  type HousePreset,
} from "@/lib/card-room/house-agent";
import { formatApiError } from "@/lib/card-room/api-errors";

export default function HouseAgentPage() {
  const router = useRouter();
  const [presetId, setPresetId] = useState(HOUSE_PRESETS[0]!.id);
  const [custom, setCustom] = useState(false);
  const [tightness, setTightness] = useState(HOUSE_PRESETS[0]!.strategy.tightness);
  const [aggression, setAggression] = useState(
    HOUSE_PRESETS[0]!.strategy.aggression,
  );
  const [bluff, setBluff] = useState(HOUSE_PRESETS[0]!.strategy.bluffFrequency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preset = useMemo(
    () => HOUSE_PRESETS.find((p) => p.id === presetId) ?? HOUSE_PRESETS[0]!,
    [presetId],
  );

  const selectPreset = (p: HousePreset) => {
    setPresetId(p.id);
    setCustom(false);
    setTightness(p.strategy.tightness);
    setAggression(p.strategy.aggression);
    setBluff(p.strategy.bluffFrequency);
  };

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await createHouseFromPreset(preset, {
        tightness,
        aggression,
        bluffFrequency: bluff,
      });
      router.push(withBase("/card-room/games/holdem-cash/?tab=overview"));
    } catch (e) {
      setError(formatApiError(e, "Could not create house agent"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="cr-eyebrow">Guided · house policy</p>
        <h1 className="cr-display mt-1 text-3xl text-[var(--cr-brass)]">
          Use a house agent
        </h1>
        <p className="mt-2 text-sm text-[var(--cr-ivory)]/65">
          Pick a reference style or tune the knobs. House agents run on the Card
          Room host policy — no API key required.
        </p>
      </div>

      {error && (
        <p className="rounded border border-[var(--cr-danger)]/40 bg-[var(--cr-burgundy)]/30 px-3 py-2 text-sm text-[var(--cr-ivory)]">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {HOUSE_PRESETS.map((p) => {
          const active = p.id === presetId && !custom;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p)}
              className={[
                "cr-panel p-4 text-left transition-colors",
                active
                  ? "ring-1 ring-[var(--cr-brass)]/60"
                  : "opacity-85 hover:opacity-100",
              ].join(" ")}
            >
              <p className="cr-ui text-[var(--cr-gold-bright)]">{p.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--cr-ivory)]/55">
                {p.blurb}
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-[var(--cr-brass)]/70">
                T{p.strategy.tightness} · A{p.strategy.aggression} · B
                {p.strategy.bluffFrequency}
              </p>
            </button>
          );
        })}
      </div>

      <fieldset className="cr-panel space-y-3 p-5">
        <legend className="px-1 text-xs uppercase tracking-wider text-[var(--cr-brass)]">
          Strategy knobs
          {custom ? " · custom" : ` · ${preset.name}`}
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
              <span className="tabular-nums text-[var(--cr-brass)]">{val}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={val}
              onChange={(e) => {
                setCustom(true);
                set(Number(e.target.value));
              }}
              className="mt-1 w-full accent-[var(--cr-brass)]"
            />
          </label>
        ))}
        <p className="text-[11px] text-[var(--cr-ivory)]/45">
          Drag any slider to customize the selected preset before seating.
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onCreate()}
          className="cr-btn-primary disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create & open Hold'em"}
        </button>
        <Link
          href={withBase("/card-room/agents/create")}
          className="cr-btn-secondary"
        >
          Full custom agent
        </Link>
        <Link href={withBase("/card-room")} className="cr-btn-secondary">
          ← The Pit
        </Link>
      </div>
    </div>
  );
}
