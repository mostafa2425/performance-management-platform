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
    openGraph: { title: `${title} | Perform.`, description, type: "website", siteName: "Perform." },
    twitter: { card: "summary", title: `${title} | Perform.`, description }
  };
}

export default function WorkspaceLayout({ children }: Props) {
  return children;
}
