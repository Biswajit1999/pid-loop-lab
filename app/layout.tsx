import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://biswajit1999.github.io/pid-loop-lab/"),
  applicationName: "PID Loop Lab",
  title: { default: "PID Loop Lab — Interactive PID Tuning Simulator", template: "%s | PID Loop Lab" },
  description: "A rigorous browser-based PID controller simulator with plant models, P/I/D telemetry, anti-windup, disturbances, tuning rules, metrics, and engineering export.",
  keywords: ["PID tuner", "PID tuning", "PID simulator", "control systems simulator", "Ziegler Nichols", "Cohen Coon", "SIMC PID", "PID autotune"],
  authors: [{ name: "Biswajit Jana" }],
  creator: "Biswajit Jana",
  alternates: { canonical: "/" },
  manifest: "manifest.webmanifest",
  icons: { icon: [{ url: "https://biswajit1999.github.io/pid-loop-lab/icon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "PID Loop Lab",
    description: "Interactive PID Tuning & Control-System Simulator",
    type: "website",
    images: [{ url: "social-preview.png", width: 1280, height: 640, alt: "PID Loop Lab closed-loop diagram and response curves" }],
  },
  twitter: { card: "summary_large_image", title: "PID Loop Lab", description: "Interactive PID tuning and control-system simulator", images: ["social-preview.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "PID Loop Lab",
          url: "https://biswajit1999.github.io/pid-loop-lab/",
          description: "A free, open-source interactive PID tuning and control-system simulator.",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any modern web browser",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
          author: { "@type": "Person", name: "Biswajit Jana" },
          license: "https://opensource.org/licenses/MIT",
          isAccessibleForFree: true,
        }).replaceAll("<", "\\u003c") }} />
        <Header />
        {children}
        <footer className="site-footer">
          <span>PID LOOP LAB · OPEN-SOURCE CONTROL ENGINEERING</span>
          <span>Author: Biswajit Jana · <a href="https://github.com/Biswajit1999/pid-loop-lab">GitHub / MIT</a></span>
        </footer>
      </body>
    </html>
  );
}
