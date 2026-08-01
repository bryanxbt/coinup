import { GameCard } from "@/components/GameCard";
import { listLobbyGames } from "@/games/registry";

export default function LobbyPage() {
  const games = listLobbyGames();
  const playable = games.filter((g) => g.status === "playable");
  const soon = games.filter((g) => g.status !== "playable");

  return (
    <main className="arcade-grid relative flex-1 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-12 text-center sm:text-left">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-amber-400/90">
            Insert coin to continue
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The Bitcoin{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
              arcade
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-400">
            Virtual cabinets on{" "}
            <span className="text-zinc-200">Arch Network</span>. Pay entry in
            sats. Climb boards. Win Bitcoin. Mock credits for now — real rails
            next.
          </p>
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
              Coming soon
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
