"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "./Header";
import {
  formatSats,
  mockPaymentClient,
  type ArcadeBalance,
} from "@/lib/payments";
import { getPlayerId } from "@/lib/player";

export function ArcadeShell({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<ArcadeBalance | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const bal = await mockPaymentClient.getBalance(getPlayerId());
    setBalance(bal);
  }, []);

  useEffect(() => {
    void refresh();
    const onBalance = () => void refresh();
    window.addEventListener("coinup:balance", onBalance);
    window.addEventListener("storage", onBalance);
    return () => {
      window.removeEventListener("coinup:balance", onBalance);
      window.removeEventListener("storage", onBalance);
    };
  }, [refresh]);

  const onAddCoin = async () => {
    const amount = 10_000;
    await mockPaymentClient.deposit({
      amountSats: amount,
      playerId: getPlayerId(),
    });
    await refresh();
    setToast(`+${formatSats(amount)} added (mock credits)`);
    window.setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header balance={balance} onAddCoin={onAddCoin} />
      <div className="flex-1">{children}</div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-400/40 bg-zinc-950/95 px-5 py-2 font-mono text-sm text-amber-200 shadow-lg">
          {toast}
        </div>
      )}
      <footer className="border-t border-white/5 px-4 py-6 text-center text-xs text-zinc-600 sm:px-8">
        CoinUp · Bitcoin arcade on{" "}
        <a
          href="https://arch.network"
          className="text-zinc-400 underline-offset-2 hover:text-zinc-300 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Arch Network
        </a>
        {" · "}
        Build Together Labs · mock credits until mainnet rails
      </footer>
    </div>
  );
}
