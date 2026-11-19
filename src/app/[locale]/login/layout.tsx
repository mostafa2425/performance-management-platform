import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "ar" ? "تسجيل الدخول" : "Sign in";
  const description = locale === "ar"
    ? "سجل الدخول إلى منصة إدارة الأداء."
    : "Sign in to your performance management workspace.";
  return {
    title,
    description,
    openGraph: { title: `${title} | Perform.`, description, type: "website", siteName: "Perform.", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perform. Performance Management Platform" }] },
    twitter: { card: "summary_large_image", images: ["/opengraph-image"], title: `${title} | Perform.`, description }
  };
}

export default function LoginLayout({ children }: Props) {
  return children;
}
