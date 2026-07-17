import type { Metadata } from "next";
import {
  Inter, Space_Grotesk, Caveat, Bebas_Neue, Special_Elite,
  Alex_Brush, Bad_Script, Great_Vibes, Julius_Sans_One, Amatic_SC,
  Dancing_Script, Homemade_Apple, Limelight,
  Updock, Cabin_Sketch, Splash, Sedgwick_Ave_Display, Unkempt,
  Love_Ya_Like_A_Sister, Englebert, Kablammo,
  Pacifico, Satisfy, Lobster, Bangers, Permanent_Marker, Architects_Daughter,
  Indie_Flower, Righteous, Monoton, Fjalla_One, Yeseva_One, Playfair_Display,
} from "next/font/google";
import HelpBubble from "@/components/layout/HelpBubble";
import RoleOnboardingGate from "@/components/onboarding/RoleOnboardingGate";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
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
const updock = Updock({ weight: "400", subsets: ["latin"], variable: "--font-updock" });
const cabinSketch = Cabin_Sketch({ weight: "400", subsets: ["latin"], variable: "--font-cabin-sketch" });
const splash = Splash({ weight: "400", subsets: ["latin"], variable: "--font-splash" });
const sedgwickAve = Sedgwick_Ave_Display({ weight: "400", subsets: ["latin"], variable: "--font-sedgwick" });
const unkempt = Unkempt({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-unkempt" });
const loveYa = Love_Ya_Like_A_Sister({ weight: "400", subsets: ["latin"], variable: "--font-love-ya" });
const engelbert = Englebert({ weight: "400", subsets: ["latin"], variable: "--font-engelbert" });
const kablammo = Kablammo({ subsets: ["latin"], variable: "--font-kablammo" });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-satisfy" });
const lobster = Lobster({ weight: "400", subsets: ["latin"], variable: "--font-lobster" });
const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers" });
const permanentMarker = Permanent_Marker({ weight: "400", subsets: ["latin"], variable: "--font-permanent-marker" });
const architectsDaughter = Architects_Daughter({ weight: "400", subsets: ["latin"], variable: "--font-architects-daughter" });
const indieFlower = Indie_Flower({ weight: "400", subsets: ["latin"], variable: "--font-indie-flower" });
const righteous = Righteous({ weight: "400", subsets: ["latin"], variable: "--font-righteous" });
const monoton = Monoton({ weight: "400", subsets: ["latin"], variable: "--font-monoton" });
const fjallaOne = Fjalla_One({ weight: "400", subsets: ["latin"], variable: "--font-fjalla" });
const yesevaOne = Yeseva_One({ weight: "400", subsets: ["latin"], variable: "--font-yeseva" });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Sparkurio — Confidence for tomorrow’s classroom.",
  description: "Sparkurio is where educators discover, organize, and share classroom-tested teaching resources.",
  openGraph: {
    title: "Sparkurio — Confidence for tomorrow’s classroom.",
    description: "Sparkurio is where educators discover, organize, and share classroom-tested teaching resources.",
    url: "https://sparkurio.com",
    siteName: "Sparkurio",
    images: [
      {
        url: "https://sparkurio.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sparkurio — Confidence for tomorrow’s classroom.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sparkurio — Confidence for tomorrow’s classroom.",
    description: "Sparkurio is where educators discover, organize, and share classroom-tested teaching resources.",
    images: ["https://sparkurio.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${caveat.variable} ${bebasNeue.variable} ${specialElite.variable} ${alexBrush.variable} ${badScript.variable} ${greatVibes.variable} ${juliusSansOne.variable} ${amaticSC.variable} ${dancingScript.variable} ${homemadeApple.variable} ${limelight.variable} ${updock.variable} ${cabinSketch.variable} ${splash.variable} ${sedgwickAve.variable} ${unkempt.variable} ${loveYa.variable} ${engelbert.variable} ${kablammo.variable} ${pacifico.variable} ${satisfy.variable} ${lobster.variable} ${bangers.variable} ${permanentMarker.variable} ${architectsDaughter.variable} ${indieFlower.variable} ${righteous.variable} ${monoton.variable} ${fjallaOne.variable} ${yesevaOne.variable} ${playfairDisplay.variable}`}>
      <body>{children}<HelpBubble /><RoleOnboardingGate /><GoogleAnalytics gaId="G-WFKZ3Y5F34" /><Analytics /></body>
    </html>
  );
}
