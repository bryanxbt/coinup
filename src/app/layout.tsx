import type { Metadata } from "next";
import {
  Press_Start_2P,
  Inter,
  Cinzel_Decorative,
  Raleway,
} from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

/** Brand book panel 09 — Body: Inter Regular */
const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Brand book panel 09 — Display / Headlines: Golden Nugget.
 * Cinzel Decorative is the licensed web stand-in (ornate casino serif).
 */
const goldenNugget = Cinzel_Decorative({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-cr-display",
  display: "swap",
});

/** Brand book panel 09 — Subhead / UI: Raleway Semibold */
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
 * / → landing typewriter (page.tsx)
 * /arcade/* → (arcade)/layout.tsx → ArcadeShell
 * /card-room/* → (card-room)/layout.tsx → CardRoomShell
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${inter.variable} ${goldenNugget.variable} ${raleway.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
