import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const title = isArabic ? "مساحة عمل المدير" : "Manager workspace";
  const description = isArabic ? "إدارة أهداف الفريق والمراجعات وتقييمات الأداء." : "Manage team objectives, reviews and performance evaluations.";
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
