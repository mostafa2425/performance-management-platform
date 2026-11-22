"use client";

import { AppCheckbox } from "@/components/ui-antd-primitives";

import { Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === "ar";
  const translate = useTranslations("Login");
  const [loading,setLoading] = useState(false);
  useEffect(() => { document.title = translate("pageTitle"); }, [translate]);
  const onFinish = async () => {
    setLoading(true);
    window.setTimeout(()=>router.push(`/${locale}/dashboard`),350);
  };

  return (
    <main className="login-screen" dir={ar?"rtl":"ltr"}>
      <section className="login-brand-panel">
        <div className="login-brand"><div className="brand-mark">P</div><div><strong>Perform<span>.</span></strong><small>People & performance</small></div></div>
        <div className="login-brand-content"><div className="login-eyebrow"><Sparkles size={14}/>{translate("text001")}</div><h1>{translate("text002")}</h1><p>{translate("text003")}</p><div className="login-quote-card"><div className="quote-mark">“</div><p>{translate("text004")}</p><span>— {translate("text005")}</span></div></div>
        <div className="login-brand-footer"><span>© 2026 Perform.</span><span>{translate("text006")}</span></div>
      </section>
      <section className="login-form-panel">
        <div className="login-locale"><Link href="/en/login" className={!ar?"selected":""}>EN</Link><Link href="/ar/login" className={ar?"selected":""}>عربي</Link></div>
        <div className="login-form-wrap">
          <div className="login-welcome-icon"><LockKeyhole size={22}/></div>
          <span className="form-overline">{translate("text007")}</span>
          <Typography.Title level={2}>{translate("text008")}</Typography.Title>
          <Typography.Paragraph>{translate("text009")}</Typography.Paragraph>
          <Form layout="vertical" requiredMark={false} onFinish={onFinish} initialValues={{email:"mostafa.gamal@company.com",password:"performance2026"}}>
            <Form.Item label={translate("text010")} name="email" rules={[{required:true,message:translate("text011")},{type:"email",message:translate("text012")}]}>
              <Input size="large" prefix={<Mail size={17} className="input-prefix-icon"/>} placeholder="name@company.com"/>
            </Form.Item>
            <Form.Item label={translate("text013")} name="password" rules={[{required:true,message:translate("text014")}]}>
              <Input.Password size="large" prefix={<LockKeyhole size={17} className="input-prefix-icon"/>} placeholder="••••••••••" />
            </Form.Item>
            <div className="login-options"><label><AppCheckbox type="checkbox" defaultChecked/> {translate("text015")}</label><a href="mailto:it.support@example.com">{translate("text016")}</a></div>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="login-submit">{translate("text017")} <ArrowRight size={17}/></Button>
          </Form>
          <div className="login-divider"><span>{translate("text018")}</span></div>
          <Button size="large" block className="microsoft-button" onClick={onFinish}><span className="microsoft-mark"><i/><i/><i/><i/></span>{translate("text019")}</Button>
          <div className="demo-hint"><ShieldCheck size={16}/><span>{translate("text020")}</span></div>
        </div>
        <div className="login-legal"><span>{translate("text021")}</span><span>{translate("text022")} · {translate("text023")}</span></div>
      </section>
    </main>
  );
}