import type { Metadata } from "next";
import { Schibsted_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import CommandBar from "@/components/CommandBar";
import Footer from "@/components/Footer";

const ui = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-ui" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "QuantPrep — free quant interview prep",
  description: "Free practice for quant trading interviews: timed numerical sims, sequences, probability, and firm-specific prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${mono.variable}`}>
      <body>
        <CommandBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
