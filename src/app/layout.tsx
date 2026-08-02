import type { Metadata } from "next";
import { Press_Start_2P, Inter, Cinzel, Raleway } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Luxury display — Golden Nugget–adjacent serif for Card Room */
const cinzel = Cinzel({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cr-display",
  display: "swap",
});

/** Card Room UI subheads (brand book: Raleway Semibold) */
const raleway = Raleway({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-cr-ui",
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

/**
 * Minimal root layout — no floor chrome.
 * Floor 1: (arcade)/layout.tsx → ArcadeShell
 * Card Room / The Pit: (card-room)/layout.tsx → CardRoomShell
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${inter.variable} ${cinzel.variable} ${raleway.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
