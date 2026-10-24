import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/shield/theme-provider";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/shield/structured-data";
import { LOCALES, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** The self-referencing canonical for this route — absolute, from SITE_URL (14, section 5). */
const CANONICAL_URL = SITE_URL;

/** The home page is English in the Uganda launch market (14, section 2). */
const OG_LOCALE = "en_UG";

/** The other markets' languages, as og:locale:alternate (14, section 5). */
const OG_LOCALE_ALTERNATE = LOCALES.map((locale) => locale.replace("-", "_")).filter(
  (locale) => locale !== OG_LOCALE,
);

/** 60 characters or fewer, question-led (14, sections 5 and 7.1). */
const TITLE = "SecureVoice Shield — is this call real?";

/** 155 characters or fewer, answer-first (14, section 5). */
const DESCRIPTION =
  "Is this call real? Check it with Shield — cloned voices, spoofed IDs and SIM swaps, answered in plain language. Shield never calls you first.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · SecureVoice Shield",
  },
  description: DESCRIPTION,
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
  applicationName: SITE_NAME,
  alternates: {
    // One honest entry: the self-referencing canonical for the root picker.
    //
    // The eleven-locale hreflang set (14, section 2) is published by the
    // locale routes themselves — src/app/[locale]/page.tsx — because each
    // locale page owns its own canonical and its own reciprocal alternates.
    // The root picker lists the same set for the pages it points at, and
    // scripts/check-hreflang.ts proves the links are reciprocal.
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: CANONICAL_URL,
    locale: OG_LOCALE,
    alternateLocale: OG_LOCALE_ALTERNATE,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  // Next has no typed twitter:url, so the canonical is emitted explicitly.
  other: {
    "twitter:url": CANONICAL_URL,
  },
  robots: { index: true, follow: true },
  // The web app manifest (14, section 10.1).
  manifest: "/manifest.webmanifest",
  // Masked examples must never become tappable numbers (14, section 5).
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
    // Next.js renders one root layout for the whole site, and a root layout
    // cannot read the route segment without making every page dynamic — so
    // the served <html> element carries the default language and each locale
    // page corrects it with a tiny inline script (src/components/shield/
    // html-lang.tsx). The page body is wrapped in an element with the right
    // lang and dir, so the served HTML is never ambiguous (14, section 5).
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
