"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BootSequence } from "./arcade/BootSequence";
import { Header } from "./Header";
import {
  formatSats,
  mockPaymentClient,
  type ArcadeBalance,
} from "@/lib/payments";
import { getPlayerId } from "@/lib/player";

const BOOT_KEY = "coinup.booted.v1";

export function ArcadeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<ArcadeBalance | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      if (sessionStorage.getItem(BOOT_KEY) === "1") {
        setBooting(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finishBoot = useCallback(() => {
    setBooting(false);
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

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
    setToast(`+${formatSats(amount)} MOCK CREDITS`);
    window.setTimeout(() => setToast(null), 2500);
  };

  const showBoot = hydrated && booting && pathname === "/";

  return (
    <div className="arcade-root">
      {showBoot && <BootSequence onDone={finishBoot} />}
      <Header balance={balance} onAddCoin={onAddCoin} />
      <div className="flex-1">{children}</div>
      {toast && (
        <div className="pixel-panel fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border-[var(--neon-amber)] px-4 py-2 font-pixel text-[10px] text-[var(--neon-amber)]">
          {toast}
        </div>
      )}
      <footer className="border-t-2 border-[var(--steel)] bg-black px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <p className="font-pixel text-[10px] text-[var(--neon-amber)]">
            COINUP ARCADE
          </p>
          <p className="max-w-2xl font-pixel text-[8px] leading-relaxed text-[#5c5c6b]">
            OUR MISSION: BUILD THE GREATEST DIGITAL ARCADE EVER.
            <br />
            ALL GAMES. ALL PEOPLE. ALL THE TIME.
          </p>
          <p className="font-pixel text-[8px] text-[#3a3a44]">
            BITCOIN ON{" "}
            <a
              href="https://arch.network"
              className="pixel-link"
              target="_blank"
              rel="noreferrer"
            >
              ARCH NETWORK
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
