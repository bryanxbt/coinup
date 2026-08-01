import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ArcadeShell } from "@/components/ArcadeShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ArcadeShell>{children}</ArcadeShell>
      </body>
    </html>
  );
}
