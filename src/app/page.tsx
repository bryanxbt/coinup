import { ChipBubble, ChipPortrait } from "@/components/Chip";
import { GameCard } from "@/components/GameCard";
import { listLobbyGames } from "@/games/registry";

export default function LobbyPage() {
  const games = listLobbyGames();
  const playable = games.filter((g) => g.status === "playable");
  const soon = games.filter((g) => g.status !== "playable");

  return (
    <main className="arcade-grid relative flex-1 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-14 flex flex-col items-center gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="flex-1 text-center sm:text-left">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-amber-400/90">
              Insert coin to continue
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              The Bitcoin{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                arcade
              </span>
            </h1>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-zinc-400">
              Virtual cabinets on{" "}
              <span className="text-zinc-200">Arch Network</span>. Pay entry in
              sats. Climb boards. Win Bitcoin. Managed on the floor by{" "}
              <span className="text-cyan-300">Chip</span>.
            </p>
            <ChipBubble className="mx-auto sm:mx-0">
              Welcome to CoinUp. I&apos;m Chip — all-access manager. Grab
              credits, pick a cabinet, and show me what you got.
            </ChipBubble>
          </div>
          <ChipPortrait size={260} priority className="shrink-0" />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
            Open cabinets · {playable.length}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {playable.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {soon.length > 0 && (
          <section>
            <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">
              Coming soon · Chip is stocking these
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {soon.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
