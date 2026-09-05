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

export const metadata: Metadata = {
  title: "SAGE://DESK",
  description: "NEXUS SAGE C-suite briefing desk — Fallout × Matrix phosphor terminal",
  applicationName: "NEXUS SAGE Desk",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "SAGE://DESK",
    description: "NEXUS SAGE C-suite briefing desk — Fallout × Matrix phosphor terminal",
    siteName: "NEXUS SAGE",
    images: [
      {
        url: "/og.jpg",
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
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="phosphor" className="dark">
      <body className={`${shareTech.variable} ${jetbrains.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
