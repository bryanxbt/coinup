"use client";

import type { ArcadeBalance } from "@/lib/payments";
import { formatSats } from "@/lib/payments";

export function BalanceHeader({
  balance,
  sessionKind,
  error,
  busy,
  onFaucet,
  onRefresh,
}: {
  balance: ArcadeBalance | null;
  sessionKind?: string | null;
  error?: string | null;
  busy?: boolean;
  onFaucet?: () => void;
  onRefresh?: () => void;
}) {
  const detail = balance?.lockedDetail;
  const lockedParts =
    detail &&
    [
      detail.tableSats > 0 ? `table ${formatSats(detail.tableSats)}` : null,
      detail.tournamentSats > 0
        ? `tourney ${formatSats(detail.tournamentSats)}`
        : null,
      detail.backingSats > 0 ? `back ${formatSats(detail.backingSats)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wider text-[var(--cr-ivory)]/50">
          {sessionKind ? `${sessionKind} · ` : ""}
          Available · Locked
        </p>
        <p className="text-sm text-[var(--cr-gold-bright)] tabular-nums">
          {balance
            ? `${formatSats(balance.availableSats)} · ${formatSats(balance.lockedSats)}`
            : error
              ? "API offline"
              : "…"}
        </p>
        {lockedParts ? (
          <p className="max-w-[12rem] truncate text-[9px] text-[var(--cr-ivory)]/40">
            {lockedParts}
          </p>
        ) : null}
      </div>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="cr-btn-secondary px-2 py-1.5 text-[10px] uppercase tracking-wider"
          title="Refresh balance"
        >
          ↻
        </button>
      )}
      {onFaucet && (
        <button
          type="button"
          onClick={onFaucet}
          disabled={busy}
          className="cr-btn-secondary px-2 py-1.5 text-[10px] uppercase tracking-wider disabled:opacity-50"
          title="Mock faucet — demo ledger only"
        >
          {busy ? "…" : "Faucet"}
        </button>
      )}
    </div>
  );
}
