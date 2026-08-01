import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/brand/Markdown";
import { loadChapterMarkdown } from "@/lib/brand-book/load";
import {
  chapters,
  getAdjacent,
  getChapter,
} from "@/lib/brand-book/toc";

export function generateStaticParams() {
  return chapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ch = getChapter(slug);
  if (!ch) return { title: "Brand Book" };
  return {
    title: `${ch.number} ${ch.title} — CoinUp Brand Book`,
    description: ch.summary,
  };
}

export default async function BrandChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ch = getChapter(slug);
  const md = loadChapterMarkdown(slug);
  if (!ch || !md) notFound();

  const { prev, next } = getAdjacent(slug);

  return (
    <article>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-pink-400">
        Chapter {ch.number}
        {ch.flagship ? " · Flagship" : ""} · ~{ch.pageTarget} pages
      </p>
      <Markdown source={md} />

      <nav className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
        {prev ? (
          <Link
            href={`/brand/${prev.slug}`}
            className="font-mono text-xs text-zinc-400 hover:text-white"
          >
            ← {prev.number} {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <Link
          href="/brand"
          className="font-mono text-xs text-zinc-600 hover:text-zinc-400"
        >
          Index
        </Link>
        {next ? (
          <Link
            href={`/brand/${next.slug}`}
            className="font-mono text-xs text-zinc-400 hover:text-white"
          >
            {next.number} {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
