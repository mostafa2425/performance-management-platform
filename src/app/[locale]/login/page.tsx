"use client";

import { Alert, Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { useAuthSession } from "@/lib/auth/session";
import { homePathForUser } from "@/lib/auth/home-path";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@pmp-demo.test", password: "password" },
  { label: "Manager", email: "faisal.placeholder@pmp-demo.test", password: "password" },
  { label: "Employee", email: "yousef.demo@pmp-demo.test", password: "password" },
] as const;

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === "ar";
  const translate = useTranslations("Login");
  const { login, isReady, isAuthenticated, user, activeRole } = useAuthSession();
  const [form] = Form.useForm<{ email: string; password: string }>();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    document.title = translate("pageTitle");
  }, [translate]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(homePathForUser(user, locale, activeRole));
    }
  }, [isReady, isAuthenticated, user, activeRole, locale, router]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setFormError(null);
    try {
      const nextUser = await login(values);
      router.replace(homePathForUser(nextUser, locale));
    } catch (error) {
      const apiError = error as ApiRequestError;
      const fieldMessage = apiError.fields?.email?.[0] || apiError.message;
      setFormError(fieldMessage || (ar ? "تعذر تسجيل الدخول" : "Unable to sign in"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen" dir={ar ? "rtl" : "ltr"}>
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" width="27" height="27" fill="none">
              <path d="M7 29V19h6v10M17 29V12h6v17M27 29V6h6v23" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m7 14 8-5 7 1 10-6" stroke="#b9fff0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m27 4 5-1-1 5" stroke="#b9fff0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="login-brand-copy">
            <strong>Performance</strong>
            <small>Management Platform</small>
            <small className="login-brand-byline">BY MASTER WORKS</small>
          </div>
        </div>
        <div className="login-brand-content">
          <div className="login-eyebrow">{translate("text001")}</div>
          <h1>{translate("text002")}</h1>
          <p>{translate("text003")}</p>
        </div>
        <div className="login-brand-footer">
          <span>{ar ? "© 2026 ماستر وركس. جميع الحقوق محفوظة." : "© 2026 Master Works. All rights reserved."}</span>
          <span>{translate("text006")}</span>
        </div>
      </section>
      <section className="login-form-panel">
        <div className="login-locale">
          <Link href="/en/login" className={!ar ? "selected" : ""}>
            EN
          </Link>
          <Link href="/ar/login" className={ar ? "selected" : ""}>
            عربي
          </Link>
        </div>
        <div className="login-form-wrap">
          <div className="login-welcome-icon">
            <LockKeyhole size={22} />
          </div>
          <span className="form-overline">{translate("text007")}</span>
          <Typography.Title level={2}>{translate("text008")}</Typography.Title>
          <Typography.Paragraph>{translate("text009")}</Typography.Paragraph>
          {formError && <Alert type="error" showIcon title={formError} style={{ marginBottom: 16 }} />}
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={onFinish}
            initialValues={{ email: DEMO_ACCOUNTS[0].email, password: DEMO_ACCOUNTS[0].password }}
          >
            <Form.Item
              label={translate("text010")}
              name="email"
              rules={[
                { required: true, message: translate("text011") },
                { type: "email", message: translate("text012") },
              ]}
            >
              <Input
                size="large"
                prefix={<Mail size={17} className="input-prefix-icon" />}
                placeholder="name@company.com"
                autoComplete="username"
              />
            </Form.Item>
            <Form.Item
              label={translate("text013")}
              name="password"
              rules={[{ required: true, message: translate("text014") }]}
            >
              <Input.Password
                size="large"
                prefix={<LockKeyhole size={17} className="input-prefix-icon" />}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="login-submit">
              {translate("text017")} <ArrowRight size={17} />
            </Button>
          </Form>
          <div className="demo-hint" style={{ marginTop: 18, flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={16} />
              <span>{translate("text020")}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  size="small"
                  onClick={() => {
                    setFormError(null);
                    form.setFieldsValue({ email: account.email, password: account.password });
                  }}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="login-legal">
          <span>{translate("text021")}</span>
          <span>
            {translate("text022")} · {translate("text023")}
          </span>
        </div>
      </section>
    </main>
  );
}
