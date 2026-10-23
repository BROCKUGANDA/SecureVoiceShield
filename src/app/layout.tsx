import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shield/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shield.securevoice.example";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SecureVoice Shield — Is this voice real?",
    template: "%s · SecureVoice Shield",
  },
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
  applicationName: "SecureVoice Shield",
  openGraph: {
    title: "SecureVoice Shield — Is this voice real?",
    description:
      "Scammers clone voices, spoof numbers and swap SIMs. Shield scores every suspicious call, voice note and OTP request — and answers in plain language.",
    type: "website",
    siteName: "SecureVoice Shield",
    url: SITE_URL,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "SecureVoice Shield — Is this voice real?",
    description:
      "Scammers clone voices, spoof numbers and swap SIMs. Shield answers in plain language — and never calls you first.",
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#12533f" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1913" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
