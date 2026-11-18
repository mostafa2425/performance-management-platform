"use client";

import { Button, Card, Form, Input, Typography } from "antd";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Auth");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md" bordered={false}>
        <div className="mb-6">
          <Typography.Title level={3}>{t("title")}</Typography.Title>
          <Typography.Text type="secondary">{t("subtitle")}</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={() => undefined}>
          <Form.Item label={t("email")} name="email" rules={[{ required: true }, { type: "email" }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item label={t("password")} name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{t("signIn")}</Button>
        </Form>
        <div className="my-4 text-center text-sm text-slate-500">{t("or")}</div>
        <Button block onClick={() => undefined}>{t("microsoft")}</Button>
        <Typography.Paragraph className="mt-4 text-xs" type="secondary">{t("integrationPending")}</Typography.Paragraph>
      </Card>
    </main>
  );
}