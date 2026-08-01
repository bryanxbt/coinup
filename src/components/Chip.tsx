import Image from "next/image";
import { BRAND, chipExpressions, type ChipExpression } from "@/lib/brand";
import { withBase } from "@/lib/paths";

/** Chip — CoinUp Arcade Manager mascot (see docs/BRAND.md) */
export const CHIP = {
  name: "Chip",
  title: "Arcade Manager",
  fullTitle: "Chip the Arcade Manager",
  image: BRAND.assets.chipHero,
  catchphrases: [
    BRAND.taglines.floor,
    "All access. All cabinets.",
    BRAND.taglines.product,
    BRAND.taglines.oneUp,
    BRAND.taglines.jacket,
  ],
  expressions: chipExpressions,
} as const;

type ChipProps = {
  size?: number;
  className?: string;
  priority?: boolean;
  showBadge?: boolean;
};

export function ChipPortrait({
  size = 256,
  className = "",
  priority = false,
  showBadge = true,
}: ChipProps) {
  // Prefer native 256 grid so browser scales integer pixels (Pixel System)
  const src =
    size <= 32
      ? BRAND.assets.chipGrid32
      : size <= 64
        ? BRAND.assets.chipGrid64
        : size <= 128
          ? BRAND.assets.chipGrid128
          : BRAND.assets.chipGrid256;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image
          src={withBase(src)}
          alt={`${CHIP.fullTitle} — CoinUp mascot`}
          width={size}
          height={size}
          priority={priority}
          unoptimized
          className="pixelated h-full w-full object-contain drop-shadow-[0_0_40px_rgba(37,99,235,0.4)]"
        />
      </div>
      {showBadge && (
        <div className="mt-3 text-center">
          <p className="font-mono text-lg font-bold tracking-tight text-white">
            {CHIP.name}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/90">
            {CHIP.title}
          </p>
        </div>
      )}
    </div>
  );
}

export function ChipBubble({
  children,
  className = "",
  expression,
}: {
  children: React.ReactNode;
  className?: string;
  expression?: ChipExpression;
}) {
  return (
    <div
      className={`relative max-w-sm rounded-2xl border border-cyan-400/30 bg-zinc-950/90 px-4 py-3 font-mono text-sm leading-relaxed text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.12)] ${className}`}
    >
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        {CHIP.name}
        {expression ? ` · ${chipExpressions[expression].label}` : " says"}
      </span>
      {children}
    </div>
  );
}
