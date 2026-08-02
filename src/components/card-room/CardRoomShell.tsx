"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { FundsModeBanner, resolveFundsMode } from "./FundsModeBanner";
import { BalanceHeader } from "./BalanceHeader";
import { withBase } from "@/lib/paths";
import {
  cardRoomPaymentClient,
  newIdempotencyKey,
  type ArcadeBalance,
} from "@/lib/payments";
import { ensureSession, type CrSession } from "@/lib/card-room/session";
import {
  CR_BALANCE_EVENT,
  notifyCardRoomBalance,
} from "@/lib/card-room/balance-events";
import { ensureRuntimeConfig } from "@/lib/card-room/runtime-config";

const NAV = [
  {
    href: "/card-room",
    label: "The Pit",
    match: (p: string) => p === "/card-room" || p === "/card-room/",
  },
  {
    href: "/card-room/games/holdem-cash",
    label: "Hold'em",
    match: (p: string) => p.includes("/games/holdem"),
  },
  { href: "/card-room/agents", label: "My Agents" },
  { href: "/card-room/discover", label: "Discover" },
  { href: "/card-room/leaderboards", label: "Leaders" },
  { href: "/card-room/history", label: "History" },
  { href: "/card-room/office", label: "Office" },
] as const;

function isActive(
  pathname: string,
  href: string,
  match?: (p: string) => boolean,
) {
  if (match) return match(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CardRoomShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [balance, setBalance] = useState<ArcadeBalance | null>(null);
  const [session, setSession] = useState<CrSession | null>(null);
  const [balError, setBalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await ensureSession();
      setSession(s);
      const bal = await cardRoomPaymentClient.getBalance();
      setBalance(bal);
      setBalError(null);
    } catch (e) {
      setBalError(e instanceof Error ? e.message : "ledger offline");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await ensureRuntimeConfig();
      await refresh();
    })();
    const onBal = () => void refresh();
    window.addEventListener(CR_BALANCE_EVENT, onBal);
    const poll = window.setInterval(() => void refresh(), 12_000);
    return () => {
      window.removeEventListener(CR_BALANCE_EVENT, onBal);
      window.clearInterval(poll);
    };
  }, [refresh]);

  const onFaucet = async () => {
    if (resolveFundsMode() !== "mock") return;
    setBusy(true);
    try {
      await ensureSession();
      await cardRoomPaymentClient.faucet({
        amountSats: 50_000,
        idempotencyKey: newIdempotencyKey(),
      });
      notifyCardRoomBalance();
      await refresh();
    } catch (e) {
      setBalError(e instanceof Error ? e.message : "faucet failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-room flex min-h-full flex-col">
      <div className="cr-header-rule" />
      <header className="cr-header">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <Link href={withBase("/card-room")} className="group min-w-0">
              <p className="cr-eyebrow">Managed by {CARD_ROOM.managedBy}</p>
              <p className="cr-display-xl mt-1 text-xl sm:text-2xl">
                {CARD_ROOM.name}
              </p>
              <p className="cr-ui mt-1 text-[var(--cr-ivory)]/50">
                {CARD_ROOM.tagline}
              </p>
            </Link>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <BalanceHeader
                balance={balance}
                sessionKind={session?.kind}
                error={balError}
                busy={busy}
                onRefresh={() => void refresh()}
                onFaucet={
                  resolveFundsMode() === "mock"
                    ? () => void onFaucet()
                    : undefined
                }
              />
              <Link
                href={withBase("/arcade")}
                className="cr-btn-secondary whitespace-nowrap px-3 py-2 text-[10px]"
                title="Return to the arcade"
              >
                ← Arcade
              </Link>
            </div>
          </div>

          <nav
            className="flex flex-wrap items-center gap-0.5 border-t border-[var(--cr-brass)]/20 pt-3 sm:gap-1"
            aria-label="Card Room"
          >
            {NAV.map((item) => {
              const active = isActive(
                pathname,
                item.href,
                "match" in item ? item.match : undefined,
              );
              return (
                <Link
                  key={item.href}
                  href={withBase(item.href)}
                  className={["cr-nav-link", active ? "is-active" : ""].join(
                    " ",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <FundsModeBanner />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="cr-footer px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
          <div className="cr-divider w-48" />
          <p className="cr-display text-base tracking-[0.12em] text-[var(--cr-brass)]">
            {CARD_ROOM.heroLine}
          </p>
          <p className="max-w-md text-sm italic leading-relaxed text-[var(--cr-ivory)]/55">
            “{CARD_ROOM.jack.quote}”
          </p>
          <p className="cr-ui text-[var(--cr-ivory)]/35">
            CoinUp Card Room · {CARD_ROOM.jack.name} · Sats on Arch
          </p>
        </div>
      </footer>
    </div>
  );
}
