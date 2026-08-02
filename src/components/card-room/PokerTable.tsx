"use client";

/**
 * Oval felt table layout inspired by arena spectator views —
 * CoinUp Card Room chrome (not their light theme).
 */

export type TableSeatView = {
  seatNo: number;
  agentId: string | null;
  stackSats: number;
  hasFolded?: boolean;
  isAllIn?: boolean;
  /** Hole cards if ever public (usually empty for spectators) */
  hole?: string[] | null;
  name?: string;
};

/** Clock positions for up to 6 seats around an oval */
const SEAT_POS: Record<number, { top: string; left: string }> = {
  0: { top: "78%", left: "50%" },
  1: { top: "62%", left: "12%" },
  2: { top: "28%", left: "12%" },
  3: { top: "12%", left: "50%" },
  4: { top: "28%", left: "88%" },
  5: { top: "62%", left: "88%" },
};

function shortId(id: string | null): string {
  if (!id) return "Empty";
  if (id.length <= 12) return id;
  return id.slice(0, 10) + "…";
}

export function PokerTable({
  seats,
  board,
  potSats,
  street,
  actionSeat,
  handLabel,
}: {
  seats: TableSeatView[];
  board: string[];
  potSats: number;
  street?: string;
  actionSeat?: number | null;
  handLabel?: string;
}) {
  // Fill 0..5 for layout stability
  const bySeat = new Map(seats.map((s) => [s.seatNo, s]));
  const slots = [0, 1, 2, 3, 4, 5].map((n) => {
    const s = bySeat.get(n);
    return (
      s ?? {
        seatNo: n,
        agentId: null,
        stackSats: 0,
        hasFolded: false,
      }
    );
  });

  return (
    <div className="cr-frame">
      <div className="cr-frame-inner relative aspect-[16/11] w-full min-h-[320px] overflow-hidden sm:min-h-[420px]">
        {/* Outer wood rail */}
        <div
          className="absolute inset-2 rounded-[45%] sm:inset-3"
          style={{
            background:
              "linear-gradient(145deg, #3d2a1a 0%, #1a120c 40%, #2a1c12 100%)",
            boxShadow: "inset 0 0 0 2px rgba(191,166,74,0.35)",
          }}
        />
        {/* Felt oval */}
        <div
          className="absolute inset-[8%] rounded-[45%] sm:inset-[10%]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, #1f6b45 0%, #0e2b1e 55%, #0a1f14 100%)",
            boxShadow:
              "inset 0 0 80px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(0,0,0,0.35)",
          }}
        />
        {/* Rail line */}
        <div
          className="pointer-events-none absolute inset-[14%] rounded-[42%] border border-[var(--cr-brass)]/20 sm:inset-[16%]"
          aria-hidden
        />

        {/* Center pot + street */}
        <div className="absolute left-1/2 top-1/2 z-10 w-[min(70%,16rem)] -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="inline-flex flex-col items-center gap-2 rounded-sm border border-black/40 bg-black/55 px-4 py-2 backdrop-blur-sm">
            <p className="cr-ui text-[9px] text-[var(--cr-brass)]">
              {street ?? "—"}
              {handLabel ? ` · ${handLabel}` : ""}
            </p>
            <p className="text-sm font-semibold tabular-nums text-[var(--cr-gold-bright)]">
              Pot {potSats.toLocaleString()} sats
            </p>
            <div className="flex flex-wrap justify-center gap-1">
              {board.length === 0 && (
                <span className="text-[10px] text-[var(--cr-ivory)]/35">
                  Waiting for board
                </span>
              )}
              {board.map((c) => (
                <span
                  key={c}
                  className="cr-game-ui inline-block rounded-sm border border-[var(--cr-brass)]/50 bg-[#f5f0e6] px-1.5 py-1 text-xs font-bold text-[#1a1a18]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Seats */}
        {slots.map((s) => {
          const pos = SEAT_POS[s.seatNo] ?? SEAT_POS[0]!;
          const empty = !s.agentId;
          const active = actionSeat === s.seatNo;
          return (
            <div
              key={s.seatNo}
              className="absolute z-20 w-[7.5rem] -translate-x-1/2 -translate-y-1/2 sm:w-[8.5rem]"
              style={{ top: pos.top, left: pos.left }}
            >
              <div
                className={[
                  "rounded-sm border px-2 py-1.5 text-center shadow-lg",
                  empty
                    ? "border-[var(--cr-brass)]/15 bg-black/30 text-[var(--cr-ivory)]/30"
                    : active
                      ? "border-[var(--cr-gold-bright)] bg-[var(--cr-void)]/95 ring-1 ring-[var(--cr-gold-bright)]/50"
                      : "border-[var(--cr-brass)]/35 bg-[var(--cr-void)]/90",
                  s.hasFolded ? "opacity-45" : "",
                ].join(" ")}
              >
                <p className="truncate text-[10px] font-semibold text-[var(--cr-ivory)]">
                  {s.name ?? shortId(s.agentId)}
                </p>
                <p className="text-[9px] uppercase tracking-wider text-[var(--cr-brass)]/70">
                  Seat {s.seatNo}
                  {active ? " · ACT" : ""}
                  {s.hasFolded ? " · fold" : ""}
                  {s.isAllIn ? " · all-in" : ""}
                </p>
                {!empty && (
                  <p className="mt-0.5 text-xs tabular-nums text-[var(--cr-gold-bright)]">
                    {s.stackSats.toLocaleString()}
                  </p>
                )}
                {s.hole && s.hole.length > 0 && (
                  <div className="mt-1 flex justify-center gap-0.5">
                    {s.hole.map((c) => (
                      <span
                        key={c}
                        className="cr-game-ui rounded-sm bg-[#f5f0e6] px-1 text-[10px] text-black"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
