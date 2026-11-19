import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const title = isArabic ? "مساحة تطوير رأس المال البشري" : "HCD workspace";
  const description = isArabic ? "متابعة الأداء المؤسسي ومعايرة النتائج." : "Monitor organization-wide performance and calibration.";
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
