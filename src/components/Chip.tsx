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
          <p className="font-pixel text-xs text-white">{CHIP.name.toUpperCase()}</p>
          <p className="font-pixel text-[8px] text-[var(--neon-amber)]">
            {CHIP.title.toUpperCase()}
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
      className={`pixel-panel relative max-w-sm border-[var(--neon-cyan)] px-4 py-3 font-pixel text-[9px] leading-relaxed text-[var(--neon-cyan)] ${className}`}
    >
      <span className="mb-2 block text-[8px] text-[#5c5c6b]">
        {CHIP.name.toUpperCase()}
        {expression ? ` · ${chipExpressions[expression].label}` : ""}
      </span>
      {children}
    </div>
  );
}
