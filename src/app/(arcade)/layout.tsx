import { ArcadeShell } from "@/components/ArcadeShell";

/**
 * Floor 1 — Cabinet Hall. Owns neon CRT chrome via ArcadeShell.
 * Card Room is a sibling route group and never mounts this layout.
 */
export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ArcadeShell>{children}</ArcadeShell>;
}
