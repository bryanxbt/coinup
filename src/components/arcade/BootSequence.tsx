"use client";

import { useEffect, useState } from "react";
import { TypeLines } from "./TypeText";

const BOOT_LINES = [
  "CHIP.EXE // BOOT",
  "COINUP ARCADE BIOS v1.0",
  "LOADING PIXEL SYSTEM...",
  "MOUNTING CABINETS...",
  "SATS ONLINE",
  "ALL ACCESS GRANTED",
  "INSERT COIN TO CONTINUE",
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [ready, setReady] = useState(false);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        setSkip(true);
        onDone();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  useEffect(() => {
    if (skip) return;
    // safety max boot time
    const t = window.setTimeout(() => onDone(), 12000);
    return () => window.clearTimeout(t);
  }, [onDone, skip]);

  if (skip) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#000012] px-6"
      role="dialog"
      aria-label="Arcade boot sequence"
      onClick={() => {
        setSkip(true);
        onDone();
      }}
    >
      <div className="crt-frame w-full max-w-lg border-2 border-[var(--crt-green)] bg-black/80 p-6 shadow-[0_0_40px_rgba(0,222,118,0.25)]">
        <p className="mb-4 font-pixel text-[10px] leading-relaxed text-[var(--crt-green)] opacity-70">
          [ CLICK / ENTER TO SKIP ]
        </p>
        <TypeLines
          lines={BOOT_LINES}
          speed={18}
          lineGap={120}
          lineClassName="font-pixel text-[11px] sm:text-xs leading-loose text-[var(--crt-green)]"
          onAllDone={() => setReady(true)}
        />
        {ready && (
          <button
            type="button"
            className="pixel-btn pixel-btn--green mt-6 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onDone();
            }}
          >
            ENTER ARCADE
          </button>
        )}
      </div>
    </div>
  );
}
