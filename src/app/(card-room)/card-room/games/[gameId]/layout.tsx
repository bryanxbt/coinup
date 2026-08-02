import { CARD_ROOM_GAMES } from "@/lib/card-room/games-catalog";

/** Static export: prebuild every catalog game page. */
export function generateStaticParams() {
  return CARD_ROOM_GAMES.map((g) => ({ gameId: g.id }));
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
