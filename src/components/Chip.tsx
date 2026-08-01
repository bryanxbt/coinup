import Image from "next/image";

/** Chip — CoinUp Arcade Manager mascot */
export const CHIP = {
  name: "Chip",
  title: "Arcade Manager",
  fullTitle: "Chip the Arcade Manager",
  image: "/images/chip-arcade-manager.png",
  catchphrases: [
    "Insert coin to continue.",
    "All access. All cabinets.",
    "Play with sats. Win with sats.",
    "1UP starts here.",
  ],
} as const;

type ChipProps = {
  /** Width of the portrait in pixels */
  size?: number;
  className?: string;
  priority?: boolean;
  showBadge?: boolean;
};

export function ChipPortrait({
  size = 280,
  className = "",
  priority = false,
  showBadge = true,
}: ChipProps) {
  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <Image
          src={CHIP.image}
          alt={`${CHIP.fullTitle} — CoinUp mascot`}
          width={size}
          height={size}
          priority={priority}
          className="pixelated h-full w-full object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.35)]"
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative max-w-sm rounded-2xl border border-cyan-400/30 bg-zinc-950/90 px-4 py-3 font-mono text-sm leading-relaxed text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.12)] ${className}`}
    >
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-zinc-500">
        {CHIP.name} says
      </span>
      {children}
    </div>
  );
}
