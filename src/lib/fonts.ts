import {
  Andika,
  Caveat,
  DM_Sans,
  DM_Serif_Display,
  Fredoka,
  Inter,
  Nunito,
  Playfair_Display,
  Poppins,
  Quicksand,
  Space_Grotesk,
} from "next/font/google";

const andika = Andika({ subsets: ["latin"], weight: ["400", "700"], variable: "--f-andika" });
const nunito = Nunito({ subsets: ["latin"], variable: "--f-nunito", preload: false });
const quicksand = Quicksand({ subsets: ["latin"], variable: "--f-quicksand", preload: false });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--f-fredoka", preload: false });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-poppins", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--f-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--f-dm-sans", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--f-space-grotesk", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", preload: false });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--f-dm-serif", preload: false });
const caveat = Caveat({ subsets: ["latin"], variable: "--f-caveat", preload: false });

export const fontVariables = [andika, nunito, quicksand, fredoka, poppins, inter, dmSans, spaceGrotesk, playfair, dmSerif, caveat]
  .map((f) => f.variable)
  .join(" ");
