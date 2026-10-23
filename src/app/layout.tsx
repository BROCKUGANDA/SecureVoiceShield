import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecureVoice Shield — Is this voice real?",
  description:
    "Shield protects customers and banks from cloned voices, spoofed numbers and SIM swaps. Check a call, a number or a voice note and get a plain-language verdict — never a guarantee.",
  keywords: [
    "SecureVoice Shield",
    "voice cloning",
    "deepfake voice detection",
    "SIM swap fraud",
    "scam protection",
    "UAE",
    "Kenya",
    "Uganda",
    "Tanzania",
  ],
  authors: [{ name: "SecureVoice" }],
  openGraph: {
    title: "SecureVoice Shield — Is this voice real?",
    description:
      "Scammers clone voices, spoof numbers and swap SIMs. Shield scores every suspicious call, voice note and OTP request — and answers in plain language.",
    type: "website",
    siteName: "SecureVoice Shield",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#12533f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
