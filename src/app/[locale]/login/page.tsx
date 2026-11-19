"use client";

import { AppCheckbox } from "@/components/ui-antd-primitives";

import { Button, Form, Input, Typography } from "antd";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const ar = locale === "ar";
  const [loading,setLoading] = useState(false);
  useEffect(() => { document.title = ar ? "تسجيل الدخول | Perform." : "Sign in | Perform."; }, [ar]);
  const text = (en:string,arabic:string)=>ar?arabic:en;
  const onFinish = async () => {
    setLoading(true);
    window.setTimeout(()=>router.push(`/${locale}/dashboard`),350);
  };

  return (
    <main className="login-screen" dir={ar?"rtl":"ltr"}>
      <section className="login-brand-panel">
        <div className="login-brand"><div className="brand-mark">P</div><div><strong>Perform<span>.</span></strong><small>People & performance</small></div></div>
        <div className="login-brand-content"><div className="login-eyebrow"><Sparkles size={14}/>{text("MAKE PERFORMANCE MEANINGFUL","اجعل الأداء أكثر تأثيراً")}</div><h1>{text("Great work deserves to be seen.", "الإنجاز الحقيقي يستحق أن يُرى.")}</h1><p>{text("A thoughtful space to align goals, celebrate progress, and grow together.", "مساحة متكاملة لتوحيد الأهداف والاحتفاء بالتقدم والنمو معاً.")}</p><div className="login-quote-card"><div className="quote-mark">“</div><p>{text("Clarity creates focus. Focus creates impact.", "الوضوح يصنع التركيز، والتركيز يصنع التأثير.")}</p><span>— {text("Your performance journey", "رحلتك في الأداء")}</span></div></div>
        <div className="login-brand-footer"><span>© 2026 Perform.</span><span>{text("Built for better work.", "لعمل أفضل.")}</span></div>
      </section>
      <section className="login-form-panel">
        <div className="login-locale"><Link href="/en/login" className={!ar?"selected":""}>EN</Link><Link href="/ar/login" className={ar?"selected":""}>عربي</Link></div>
        <div className="login-form-wrap">
          <div className="login-welcome-icon"><LockKeyhole size={22}/></div>
          <span className="form-overline">{text("WELCOME BACK","مرحباً بعودتك")}</span>
          <Typography.Title level={2}>{text("Sign in to your workspace", "سجّل الدخول إلى حسابك")}</Typography.Title>
          <Typography.Paragraph>{text("Enter your work credentials to continue to your performance dashboard.", "أدخل بيانات العمل للانتقال إلى لوحة متابعة الأداء الخاصة بك.")}</Typography.Paragraph>
          <Form layout="vertical" requiredMark={false} onFinish={onFinish} initialValues={{email:"mostafa.gamal@company.com",password:"performance2026"}}>
            <Form.Item label={text("Work email","البريد الإلكتروني للعمل")} name="email" rules={[{required:true,message:text("Please enter your email","أدخل البريد الإلكتروني")},{type:"email",message:text("Enter a valid email","أدخل بريداً إلكترونياً صحيحاً")}]}>
              <Input size="large" prefix={<Mail size={17} className="input-prefix-icon"/>} placeholder="name@company.com"/>
            </Form.Item>
            <Form.Item label={text("Password","كلمة المرور")} name="password" rules={[{required:true,message:text("Please enter your password","أدخل كلمة المرور")}]}>
              <Input.Password size="large" prefix={<LockKeyhole size={17} className="input-prefix-icon"/>} placeholder="••••••••••" />
            </Form.Item>
            <div className="login-options"><label><AppCheckbox type="checkbox" defaultChecked/> {text("Remember me","تذكرني")}</label><a href="mailto:it.support@example.com">{text("Forgot password?","نسيت كلمة المرور؟")}</a></div>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} className="login-submit">{text("Sign in","تسجيل الدخول")} <ArrowRight size={17}/></Button>
          </Form>
          <div className="login-divider"><span>{text("OR CONTINUE WITH","أو المتابعة باستخدام")}</span></div>
          <Button size="large" block className="microsoft-button" onClick={onFinish}><span className="microsoft-mark"><i/><i/><i/><i/></span>{text("Continue with Microsoft","المتابعة باستخدام Microsoft")}</Button>
          <div className="demo-hint"><ShieldCheck size={16}/><span>{text("Demo mode · Any valid email and password will open the prototype.", "وضع تجريبي · استخدم أي بريد إلكتروني وكلمة مرور لفتح النموذج.")}</span></div>
        </div>
        <div className="login-legal"><span>{text("Need help? Contact your HR team.", "تحتاج مساعدة؟ تواصل مع فريق الموارد البشرية.")}</span><span>{text("Privacy","الخصوصية")} · {text("Terms","الشروط")}</span></div>
      </section>
    </main>
  );
}