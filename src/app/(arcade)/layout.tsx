import { ArcadeShell } from "@/components/ArcadeShell";

/**
 * Arcade chrome (Cabinet Hall, brand, play) via ArcadeShell.
 * Landing is root / (outside this group). Card Room is a sibling group.
 */
export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArcadeShell>{children}</ArcadeShell>;
}
