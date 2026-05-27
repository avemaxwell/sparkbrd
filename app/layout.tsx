import type { Metadata } from "next";
import {
  DM_Sans, Instrument_Serif, Caveat, Bebas_Neue, Special_Elite,
  Alex_Brush, Bad_Script, Great_Vibes, Julius_Sans_One, Amatic_SC,
  Dancing_Script, Homemade_Apple, Limelight,
} from "next/font/google";
import HelpBubble from "@/components/layout/HelpBubble";
import SignupNudge from "@/components/layout/SignupNudge";
import SummerStyleQuiz from "@/components/SummerStyleQuiz";
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
const alexBrush = Alex_Brush({ weight: "400", subsets: ["latin"], variable: "--font-alex-brush" });
const badScript = Bad_Script({ weight: "400", subsets: ["latin"], variable: "--font-bad-script" });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], variable: "--font-great-vibes" });
const juliusSansOne = Julius_Sans_One({ weight: "400", subsets: ["latin"], variable: "--font-julius" });
const amaticSC = Amatic_SC({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-amatic" });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" });
const homemadeApple = Homemade_Apple({ weight: "400", subsets: ["latin"], variable: "--font-homemade-apple" });
const limelight = Limelight({ weight: "400", subsets: ["latin"], variable: "--font-limelight" });

export const metadata: Metadata = {
  title: "Sparkurio — Creativity, sparked by humans.",
  description: "Sparkurio is a visual inspiration platform where real people curate beautiful boards, discover new ideas, and bring their creativity to life.",
  openGraph: {
    title: "Sparkurio — Creativity, sparked by humans.",
    description: "Sparkurio is a visual inspiration platform where real people curate beautiful boards, discover new ideas, and bring their creativity to life.",
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
    description: "Sparkurio is a visual inspiration platform where real people curate beautiful boards, discover new ideas, and bring their creativity to life.",
    images: ["https://sparkurio.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable} ${caveat.variable} ${bebasNeue.variable} ${specialElite.variable} ${alexBrush.variable} ${badScript.variable} ${greatVibes.variable} ${juliusSansOne.variable} ${amaticSC.variable} ${dancingScript.variable} ${homemadeApple.variable} ${limelight.variable}`}>
      <body>{children}<HelpBubble /><SignupNudge /><SummerStyleQuiz /><GoogleAnalytics gaId="G-WFKZ3Y5F34" /><Analytics /></body>
    </html>
  );
}
