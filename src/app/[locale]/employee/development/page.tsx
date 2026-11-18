"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { BookOpen, GraduationCap } from "lucide-react";

export default function EmployeeDevelopmentPage() {
  const ar = useLocale() === "ar";
  return (
    <AppShell title={ar ? "التطوير" : "Development"} subtitle={ar ? "تابع أنشطة التعلم والتطوير المهني." : "Track your learning and professional development activities."}>
      <section className="panel empty-state" style={{minHeight:280}}>
        <span className="metric-icon violet"><GraduationCap size={21}/></span>
        <strong>{ar ? "خطة التطوير الخاصة بك" : "Your development plan"}</strong>
        <span>{ar ? "سيتم عرض الأنشطة التدريبية والأهداف التطويرية هنا." : "Learning activities and development goals will be available here."}</span>
        <span className="readonly-pill"><BookOpen size={12}/> {ar ? "بيانات تجريبية" : "Demo workspace"}</span>
      </section>
    </AppShell>
  );
}