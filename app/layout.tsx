import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://biswajit1999.github.io/pid-loop-lab/"),
  title: { default: "PID Loop Lab — Interactive PID Tuning Simulator", template: "%s | PID Loop Lab" },
  description: "A rigorous browser-based PID controller simulator with plant models, P/I/D telemetry, anti-windup, disturbances, tuning rules, metrics, and engineering export.",
  keywords: ["PID tuner", "PID tuning", "PID simulator", "control systems simulator", "Ziegler Nichols", "Cohen Coon", "SIMC PID", "PID autotune"],
  authors: [{ name: "Biswajit Jana" }],
  creator: "Biswajit Jana",
  openGraph: {
    title: "PID Loop Lab",
    description: "Interactive PID Tuning & Control-System Simulator",
    type: "website",
    images: [{ url: "social-preview.png", width: 1280, height: 640, alt: "PID Loop Lab closed-loop diagram and response curves" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <Header />
        {children}
        <footer className="site-footer">
          <span>PID LOOP LAB · OPEN-SOURCE CONTROL ENGINEERING</span>
          <span>Author: Biswajit Jana · 2026</span>
        </footer>
      </body>
    </html>
  );
}
