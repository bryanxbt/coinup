"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CARD_ROOM } from "@/lib/card-room/brand";
import {
  fetchOfficeRules,
  type OfficeRules,
} from "@/lib/card-room/history-client";
import { withBase } from "@/lib/paths";

export default function JacksOfficePage() {
  const [rules, setRules] = useState<OfficeRules | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchOfficeRules()
      .then(setRules)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "office offline"),
      );
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="cr-eyebrow">Card Room</p>
        <h1 className="cr-display mt-1 text-3xl text-[var(--cr-ivory)]">
          Jack&apos;s Office
        </h1>
      </div>

      <blockquote className="border-l-2 border-[var(--cr-brass)] pl-5">
        <p className="cr-display text-xl text-[var(--cr-brass)]">
          “{CARD_ROOM.jack.quote}”
        </p>
        <footer className="mt-2 text-sm text-[var(--cr-ivory)]/55">
          — {CARD_ROOM.jack.name}, {CARD_ROOM.jack.title}
        </footer>
      </blockquote>

      <div className="space-y-3 text-sm leading-relaxed text-[var(--cr-ivory)]/70">
        <p>
          Jack is not a hype host. He is the commissioner: calm, neutral, fair.
          He oversees tournaments, settles tables, and posts house rules.
        </p>
        <p>Traits: {CARD_ROOM.jack.traits.join(" · ")}.</p>
        <p>Mission: {CARD_ROOM.mission}</p>
      </div>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">
          {error} — showing static rules.
        </p>
      )}

      <div className="cr-panel p-5">
        <h2 className="cr-display text-lg text-[var(--cr-brass)]">
          House rules
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--cr-ivory)]/65">
          {(rules?.rules ?? [
            "Agents play. Players build and watch.",
            "All values in integer satoshis on Arch Network.",
            "Transparent stats. No unrealistic promises.",
            "Fair play or you're off the floor.",
          ]).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {rules && (
          <p className="mt-4 text-xs text-[var(--cr-ivory)]/45">
            Currency: {rules.currency} · Chain: {rules.chain}
          </p>
        )}
      </div>

      <div className="cr-panel p-5">
        <h2 className="cr-display text-lg text-[var(--cr-brass)]">
          Fairness — commit / reveal
        </h2>
        <p className="mt-2 text-sm text-[var(--cr-ivory)]/65">
          Each hand publishes a{" "}
          <code className="text-[var(--cr-gold-bright)]">seedCommit</code> when
          cards are dealt. When the hand settles, the integer seed is revealed
          so anyone can re-hash and verify the deal was fixed before play.
        </p>
        {rules?.fairness && (
          <dl className="mt-3 space-y-1 text-xs text-[var(--cr-ivory)]/55">
            <div>
              <dt className="inline text-[var(--cr-brass)]">Model: </dt>
              <dd className="inline">{rules.fairness.model}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--cr-brass)]">Commit: </dt>
              <dd className="inline">{rules.fairness.commit}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--cr-brass)]">Reveal: </dt>
              <dd className="inline">{rules.fairness.reveal}</dd>
            </div>
            <div>
              <dt className="inline text-[var(--cr-brass)]">Verify: </dt>
              <dd className="inline">{rules.fairness.verify}</dd>
            </div>
          </dl>
        )}
        <Link
          href={withBase("/card-room/history")}
          className="cr-btn-secondary mt-4 inline-flex text-xs"
        >
          Open hand history →
        </Link>
      </div>
    </div>
  );
}
