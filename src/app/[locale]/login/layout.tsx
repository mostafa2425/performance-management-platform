import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "ar" ? "تسجيل الدخول" : "Sign in";
  const brand = "Performance Management Platform";
  const description = locale === "ar"
    ? "سجّل الدخول إلى منصة إدارة الأداء من ماستر وركس."
    : "Sign in to Performance Management Platform by Master Works.";
  return {
    title,
    description,
    openGraph: { title: `${title} | ${brand}`, description, type: "website", siteName: "Performance Management Platform | Master Works", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Performance Management Platform by Master Works" }] },
    twitter: { card: "summary_large_image", images: ["/opengraph-image"], title: `${title} | ${brand}`, description }
  };
}

export default function LoginLayout({ children }: Props) {
  return children;
}
