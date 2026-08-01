import Image from "next/image";
import Link from "next/link";
import { BrandNav } from "@/components/brand/BrandNav";
import { BRAND } from "@/lib/brand";
import { BRAND_BOOK } from "@/lib/brand-book/toc";
import { withBase } from "@/lib/paths";

export const metadata = {
  title: `${BRAND_BOOK.title} — ${BRAND.fullName}`,
  description: BRAND_BOOK.subtitle,
};

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-0 md:gap-8 md:px-6 md:py-8">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 md:flex md:border-r-0">
        <div className="sticky top-0 max-h-screen overflow-y-auto py-4 pr-2">
          <Link href="/brand" className="mb-4 flex items-center gap-2 px-2">
            <Image
              src={withBase(BRAND.assets.chipGrid32)}
              alt="Chip"
              width={32}
              height={32}
              unoptimized
              className="pixelated"
            />
            <div>
              <p className="font-pixel text-[9px] text-white">BRAND BOOK</p>
              <p className="font-pixel text-[8px] text-[#5c5c6b]">
                v{BRAND.version}
              </p>
            </div>
          </Link>
          <BrandNav />
          <Link
            href="/"
            className="mt-6 block px-2 font-pixel text-[8px] text-[#5c5c6b] hover:text-[var(--crt-green)]"
          >
            ← LOBBY
          </Link>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 md:px-2">{children}</div>
    </div>
  );
}
