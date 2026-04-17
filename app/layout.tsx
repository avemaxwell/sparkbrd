import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Caveat, Bebas_Neue, Special_Elite } from "next/font/google";
import HelpBubble from "@/components/layout/HelpBubble";
import SignupNudge from "@/components/layout/SignupNudge";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"], variable: "--font-special-elite" });

export const metadata: Metadata = {
  title: "Sparkurio — Creativity, sparked by humans.",
  description: "A place for visual inspiration, curated by real people.",
  openGraph: {
    title: "Sparkurio — Creativity, sparked by humans.",
    description: "A place for visual inspiration, curated by real people.",
    url: "https://sparkurio.com",
    siteName: "Sparkurio",
    images: [
      {
        url: "https://sparkurio.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sparkurio — Creativity, sparked by humans.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparkurio — Creativity, sparked by humans.",
    description: "A place for visual inspiration, curated by real people.",
    images: ["https://sparkurio.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable} ${caveat.variable} ${bebasNeue.variable} ${specialElite.variable}`}>
      <body>{children}<HelpBubble /><SignupNudge /><GoogleAnalytics gaId="G-WFKZ3Y5F34" /><Analytics /></body>
    </html>
  );
}
