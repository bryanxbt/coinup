import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { ArcadeShell } from "@/components/ArcadeShell";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CoinUp — Bitcoin Arcade on Arch",
  description:
    "Insert Bitcoin. Play. Win Bitcoin. Virtual arcade games for Arch Network.",
  openGraph: {
    title: "CoinUp",
    description: "Bitcoin arcade on Arch Network",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pressStart.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-background text-foreground font-pixel">
        <ArcadeShell>{children}</ArcadeShell>
      </body>
    </html>
  );
}
