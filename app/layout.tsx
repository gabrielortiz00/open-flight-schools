import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Open Flight Schools",
    template: "%s | Open Flight Schools",
  },
  description: "Find and compare flight schools across the United States. Community-maintained directory of Part 61 and Part 141 schools.",
  metadataBase: new URL("https://openflightschools.com"),
  openGraph: {
    siteName: "Open Flight Schools",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`h-full ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="h-screen flex flex-col antialiased font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}