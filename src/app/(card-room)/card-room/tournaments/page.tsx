export default function TournamentsPage() {
  return (
    <div className="space-y-4">
      <h1 className="cr-display text-3xl text-[var(--cr-brass)]">Tournaments</h1>
      <p className="max-w-xl text-sm text-[var(--cr-ivory)]/65">
        Sit &amp; go and scheduled events with sats entry on Arch. Jack announces
        the field; payouts settle through the server ledger.
      </p>
      <div className="rounded-lg border border-dashed border-[var(--cr-brass)]/30 bg-[var(--cr-near-black)]/50 p-10 text-center text-sm text-[var(--cr-ivory)]/45">
        No tournaments scheduled yet.
      </div>
    </div>
  );
}
