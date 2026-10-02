import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const shareTech = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Site URL + base path are inlined at build from next.config.ts `env` (PAGES=1 → GitHub Pages under /NEXUS_SAGE_grok,
 * else :3000 at "/"). Metadata URLs are NOT basePath-prefixed by Next, so prefix by hand; OG/canonical are absolute.
 */
const BASE_PATH = process.env.SAGE_BASE_PATH ?? "";
const SITE_URL = (process.env.SAGE_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "SAGE://DESK",
  description: "NEXUS SAGE C-suite briefing desk — Fallout × Matrix phosphor terminal",
  applicationName: "NEXUS SAGE Desk",
  icons: {
    icon: [{ url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" }],
  },
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    url: `${SITE_URL}/`,
    title: "SAGE://DESK",
    description: "NEXUS SAGE C-suite briefing desk — Fallout × Matrix phosphor terminal",
    siteName: "NEXUS SAGE",
    images: [
      {
        url: `${SITE_URL}/og.jpg`,
        width: 1200,
        height: 630,
        alt: "SAGE desk — green phosphor on charcoal",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAGE://DESK",
    description: "NEXUS SAGE C-suite briefing desk",
    images: [`${SITE_URL}/og.jpg`],
  },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="phosphor" className={`dark ${shareTech.variable} ${jetbrains.variable}`}>
      {/* next/font vars on <html>: @theme inline resolves --font-mono / --font-display at :root. */}
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
