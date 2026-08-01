import { notFound } from "next/navigation";
import { getGame } from "@/games/registry";
import { PlayClient } from "./PlayClient";

export function generateStaticParams() {
  return [{ gameId: "coin-catch" }, { gameId: "stack-sats" }];
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = getGame(gameId);
  if (!game || game.meta.status !== "playable") notFound();

  return <PlayClient meta={game.meta} />;
}
