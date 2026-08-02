"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TypeLines } from "@/components/arcade/TypeText";

const LANDING_LINES = [
  "COINUP ARCADE.",
  "BUILT FOR BITCOIN.",
  "POWERED BY ARCH NETWORK.",
  "INSERT SATS TO PLAY. WIN SATS.",
  "PLAY AT YOUR OWN RISK.",
];

/**
 * Site entry — typewriter attract screen.
 * Enter → /arcade. Card Room is reached from the arcade header.
 */
export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push("/arcade");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, router]);

  return (
    <div className="arcade-root flex min-h-full flex-1 flex-col">
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="crt-frame w-full max-w-lg border-2 border-[var(--crt-green)] bg-black/80 p-6 shadow-[0_0_40px_rgba(0,222,118,0.25)] sm:p-8">
          <TypeLines
            lines={LANDING_LINES}
            speed={18}
            lineGap={140}
            lineClassName="font-pixel text-[11px] sm:text-xs leading-loose text-[var(--crt-green)] mb-1"
            onAllDone={() => setReady(true)}
          />
          {ready && (
            <Link
              href="/arcade"
              className="pixel-btn pixel-btn--green mt-8 block w-full text-center"
            >
              CLICK TO ENTER
            </Link>
          )}
        </div>
        <p className="mt-8 font-pixel text-[8px] text-[#3a3a44]">
          [ ENTER / CLICK WHEN READY ]
        </p>
      </main>
    </div>
  );
}
