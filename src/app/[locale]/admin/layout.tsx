import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const title = isArabic ? "مساحة الإدارة" : "Administration workspace";
  const description = isArabic ? "إعداد دورات الأداء ومراجعة الخطط ونشر النتائج." : "Configure performance cycles, review plans and publish results.";
  return {
    title,
    description,
    openGraph: { title: `${title} | Perform.`, description, type: "website", siteName: "Perform.", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Perform. Performance Management Platform" }] },
    twitter: { card: "summary_large_image", images: ["/opengraph-image"], title: `${title} | Perform.`, description }
  };
}

export default function WorkspaceLayout({ children }: Props) {
  return children;
}
