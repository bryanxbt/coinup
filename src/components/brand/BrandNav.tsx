"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { chapters } from "@/lib/brand-book/toc";

export function BrandNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      <Link
        href="/brand"
        className={`rounded px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider ${
          pathname === "/brand"
            ? "bg-pink-500/20 text-pink-300"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        }`}
      >
        Index
      </Link>
      {chapters.map((ch) => {
        const href = `/brand/${ch.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={ch.slug}
            href={href}
            className={`rounded px-2 py-1.5 font-mono text-[11px] leading-snug ${
              active
                ? "bg-pink-500/20 text-pink-300"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            }`}
          >
            <span className="text-zinc-600">{ch.number}</span>{" "}
            {ch.title}
            {ch.flagship && (
              <span className="ml-1 text-[9px] text-amber-400/80">★</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
