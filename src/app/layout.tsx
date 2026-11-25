import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://performance-management-platform-beta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Performance Management Platform | Master Works",
    template: "%s | Performance Management Platform"
  },
  description: "An enterprise performance management platform by Master Works, aligning people, objectives, reviews and organizational outcomes.",
  applicationName: "Performance Management Platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon.svg", type: "image/svg+xml" }]
  },
  openGraph: {
    type: "website",
    siteName: "Performance Management Platform",
    title: "Performance Management Platform | Master Works",
    description: "Align people, objectives and organizational outcomes with a unified performance management experience by Master Works.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Performance Management Platform by Master Works" }]
  },
  twitter: {
    card: "summary",
    title: "Perform. | Performance Management Platform",
    description: "A unified workspace for performance cycles, objectives, reviews and employee development",
    images: ["/opengraph-image"]
  },
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  themeColor: "#163366",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body>{children}</body>
    </html>
  );
}
