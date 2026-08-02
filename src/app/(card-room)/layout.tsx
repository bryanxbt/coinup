import { CardRoomShell } from "@/components/card-room/CardRoomShell";

/**
 * Card Room (The Pit) — premium club chrome (no CRT/neon ArcadeShell).
 */
export default function CardRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CardRoomShell>{children}</CardRoomShell>;
}
