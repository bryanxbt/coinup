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
        className={`block border-2 px-2 py-1.5 font-pixel text-[8px] ${
          pathname === "/brand"
            ? "border-[var(--neon-magenta)] bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)]"
            : "border-transparent text-[#5c5c6b] hover:border-[var(--steel)] hover:text-white"
        }`}
      >
        INDEX
      </Link>
      {chapters.map((ch) => {
        const href = `/brand/${ch.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={ch.slug}
            href={href}
            className={`block border-2 px-2 py-1.5 font-pixel text-[8px] leading-snug ${
              active
                ? "border-[var(--neon-magenta)] bg-[var(--neon-magenta)]/15 text-[var(--neon-magenta)]"
                : "border-transparent text-[#5c5c6b] hover:border-[var(--steel)] hover:text-white"
            }`}
          >
            <span className="text-[#3a3a44]">{ch.number}</span>{" "}
            {ch.title.toUpperCase()}
            {ch.flagship ? " ★" : ""}
          </Link>
        );
      })}
    </nav>
  );
}
