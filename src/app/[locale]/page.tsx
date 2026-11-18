import { Button, Card, Typography } from "antd";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("Home");
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <Card className="w-full" bordered={false}>
        <div className="flex flex-col gap-4">
          <Typography.Title level={2}>{t("title")}</Typography.Title>
          <Typography.Paragraph type="secondary">{t("description")}</Typography.Paragraph>
          <div><Button type="primary" href="/en/login">{t("signIn")}</Button></div>
        </div>
      </Card>
    </main>
  );
}