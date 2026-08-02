"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { withBase } from "@/lib/paths";
import { useTableSocket } from "@/hooks/useTableSocket";
import { PokerTable, type TableSeatView } from "@/components/card-room/PokerTable";

function TableWatchInner() {
  const sp = useSearchParams();
  const tableId = sp.get("id") ?? "";
  const channel = tableId ? `table:${tableId}` : null;
  const { connected, tablePayload, error, lastMsg } = useTableSocket(channel);

  const payload = tablePayload as {
    name?: string;
    status?: string;
    seats?: Array<{ seatNo: number; agentId: string; stackSats: number }>;
    handNumber?: number;
    seedCommit?: string | null;
    engine?: {
      street?: string;
      board?: string[];
      potSats?: number;
      actionSeat?: number | null;
      seats?: Array<{
        seatNo: number;
        agentId: string | null;
        stackSats: number;
        hasFolded: boolean;
        isAllIn?: boolean;
      }>;
    } | null;
  } | null;

  const seats: TableSeatView[] = useMemo(() => {
    if (payload?.engine?.seats?.length) {
      return payload.engine.seats.map((s) => ({
        seatNo: s.seatNo,
        agentId: s.agentId,
        stackSats: s.stackSats,
        hasFolded: s.hasFolded,
        isAllIn: s.isAllIn,
      }));
    }
    return (payload?.seats ?? []).map((s) => ({
      seatNo: s.seatNo,
      agentId: s.agentId,
      stackSats: s.stackSats,
    }));
  }, [payload]);

  if (!tableId) {
    return (
      <p className="text-sm text-[var(--cr-ivory)]/60">
        Missing table id.{" "}
        <Link
          href={withBase("/card-room/games/holdem-cash/")}
          className="text-[var(--cr-brass)]"
        >
          Back to Hold&apos;em Cash
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="cr-eyebrow">Live table</p>
          <h1 className="cr-display mt-1 text-2xl text-[var(--cr-ivory)] sm:text-3xl">
            {payload?.name ?? tableId}
          </h1>
          <p className="mt-1 text-xs text-[var(--cr-ivory)]/50">
            WS{" "}
            <span
              className={
                connected ? "text-[var(--cr-success)]" : "text-[var(--cr-danger)]"
              }
            >
              {connected ? "live" : "offline"}
            </span>
            {lastMsg?.type ? ` · ${lastMsg.type}` : ""}
            {payload?.seedCommit
              ? ` · commit ${payload.seedCommit.slice(0, 10)}…`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={withBase("/card-room/games/holdem-cash/?tab=overview")}
            className="cr-btn-secondary text-xs"
          >
            ← Game lobby
          </Link>
          <Link
            href={withBase("/card-room")}
            className="cr-btn-secondary text-xs"
          >
            The Pit
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-[var(--cr-danger)]">{error}</p>
      )}

      <PokerTable
        seats={seats}
        board={payload?.engine?.board ?? []}
        potSats={payload?.engine?.potSats ?? 0}
        street={payload?.engine?.street}
        actionSeat={payload?.engine?.actionSeat}
        handLabel={
          payload?.handNumber != null ? `#${payload.handNumber}` : undefined
        }
      />

      <p className="text-center text-xs text-[var(--cr-ivory)]/40">
        Spectator view — hole cards stay private to agents. Guided bots act
        automatically; skill agents use the Card Room skill API.
      </p>
    </div>
  );
}

export default function TableWatchPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--cr-ivory)]/50">Loading table…</p>
      }
    >
      <TableWatchInner />
    </Suspense>
  );
}
