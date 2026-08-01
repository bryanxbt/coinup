import Image from "next/image";
import Link from "next/link";
import { BRAND, colors, palettePrimary } from "@/lib/brand";
import { BRAND_BOOK, chapters } from "@/lib/brand-book/toc";

export default function BrandIndexPage() {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.35em] text-pink-400">
        {BRAND_BOOK.subtitle}
      </p>
      <h1 className="mb-2 font-mono text-4xl font-bold tracking-tight text-white">
        {BRAND_BOOK.title}
      </h1>
      <p className="mb-6 max-w-2xl text-zinc-400">
        Living entertainment brand bible — mascot, universe, pixel law, cabinets,
        merch, social, events. Target depth 80–120 pages. Visual source of truth
        below; chapters in the sidebar.
      </p>

      <blockquote className="mb-10 border-l-4 border-amber-400 bg-amber-400/5 py-3 pl-4 font-mono text-sm text-amber-100">
        {BRAND.mission.full}
      </blockquote>

      {/* Official board */}
      <section className="mb-12">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
          Visual Brand Book v{BRAND.version}
        </h2>
        <a
          href={BRAND.assets.brandBookV1}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl border border-white/10 bg-black"
        >
          <Image
            src={BRAND.assets.brandBookV1}
            alt="CoinUp Arcade Brand Book v1.0 full board"
            width={1024}
            height={1536}
            className="h-auto w-full"
            priority
          />
        </a>
        <p className="mt-2 font-mono text-[10px] text-zinc-600">
          brand-book-v1.jpg · click to open full size
        </p>
      </section>

      {/* Swatches */}
      <section className="mb-12">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
          Primary palette
        </h2>
        <div className="flex flex-wrap gap-3">
          {palettePrimary.map((s) => (
            <div key={s.hex} className="w-24">
              <div
                className="mb-1 h-14 rounded-lg border border-white/10"
                style={{ background: s.hex }}
              />
              <p className="font-mono text-[10px] text-zinc-400">{s.name}</p>
              <p className="font-mono text-[10px] text-zinc-600">{s.hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values + personality */}
      <section className="mb-12 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-pink-400">
            Values
          </h2>
          <ul className="space-y-2">
            {BRAND.values.map((v) => (
              <li key={v.id} className="font-mono text-sm text-zinc-300">
                <span style={{ color: colors.green }}>{v.label}</span>
                <span className="text-zinc-600"> — {v.blurb}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-pink-400">
            Personality
          </h2>
          <ul className="space-y-2">
            {BRAND.personality.map((v) => (
              <li key={v.id} className="font-mono text-sm text-zinc-300">
                <span style={{ color: colors.cyan }}>{v.label}</span>
                <span className="text-zinc-600"> — {v.blurb}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TOC */}
      <section>
        <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
          Chapters · {chapters.length}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {chapters.map((ch) => (
            <Link
              key={ch.slug}
              href={`/brand/${ch.slug}`}
              className="rounded-lg border border-white/10 bg-zinc-950/80 px-4 py-3 transition hover:border-pink-500/40 hover:bg-pink-500/5"
            >
              <p className="font-mono text-[10px] text-zinc-600">
                {ch.number}
                {ch.flagship ? " · FLAGSHIP" : ""} · {ch.pageTarget} pp
              </p>
              <p className="font-mono text-sm font-semibold text-white">
                {ch.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{ch.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
