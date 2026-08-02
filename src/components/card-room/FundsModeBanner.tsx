"use client";

/**
 * Always-visible funds mode banner for Card Room money surfaces.
 * Mock ≠ withdrawable BTC. Arch modes show network label.
 */

export type FundsMode = "mock" | "arch-localnet" | "arch-testnet" | "arch-mainnet";

export function resolveFundsMode(): FundsMode {
  const m = process.env.NEXT_PUBLIC_PAYMENTS_MODE;
  if (
    m === "arch-localnet" ||
    m === "arch-testnet" ||
    m === "arch-mainnet" ||
    m === "mock"
  ) {
    return m;
  }
  return "mock";
}

const COPY: Record<
  FundsMode,
  { label: string; detail: string; tone: "mock" | "test" | "main" }
> = {
  mock: {
    label: "Demo ledger",
    detail:
      "Mock sats on the Card Room server — not withdrawable Bitcoin. Faucet for play only.",
    tone: "mock",
  },
  "arch-localnet": {
    label: "Arch localnet",
    detail: "Local Bitcoin/Arch settlement. Dev funds only — not mainnet BTC.",
    tone: "test",
  },
  "arch-testnet": {
    label: "Arch testnet",
    detail: "Testnet sats. No mainnet value. Withdraw requires wallet link.",
    tone: "test",
  },
  "arch-mainnet": {
    label: "Arch mainnet",
    detail: "Real satoshis. Withdraw only after wallet bind. Play at your own risk.",
    tone: "main",
  },
};

export function FundsModeBanner({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  if (process.env.NEXT_PUBLIC_CR_FUNDS_BANNER === "false") return null;

  const mode = resolveFundsMode();
  const copy = COPY[mode];
  const toneClass =
    copy.tone === "main"
      ? "border-[var(--cr-danger)]/40 bg-[var(--cr-burgundy)]/60 text-[var(--cr-ivory)]"
      : copy.tone === "test"
        ? "border-[var(--cr-brass)]/35 bg-[var(--cr-emerald-deep)]/90 text-[var(--cr-ivory)]/90"
        : "border-[var(--cr-brass)]/25 bg-[#120c0a]/95 text-[var(--cr-ivory)]/75";

  return (
    <div
      role="status"
      className={[
        "border-b px-4 py-2 text-center text-[10px] uppercase tracking-[0.18em]",
        toneClass,
        className,
      ].join(" ")}
    >
      <span className="font-semibold tracking-[0.2em] text-[var(--cr-gold-bright)]">
        {copy.label}
      </span>
      {!compact && (
        <span className="mt-0.5 block font-normal normal-case tracking-normal opacity-90 sm:mt-0 sm:ml-2 sm:inline">
          {copy.detail}
        </span>
      )}
    </div>
  );
}
