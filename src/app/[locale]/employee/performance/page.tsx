"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { Activity, LockKeyhole } from "lucide-react";

export default function EmployeePerformancePage() {
  const ar = useLocale() === "ar";
  return (
    <AppShell title={ar ? "أدائي" : "My performance"} subtitle={ar ? "ملخص نتائج أدائك عبر دورات الأداء." : "A summary of your performance results across cycles."}>
      <section className="panel empty-state" style={{minHeight:280}}>
        <span className="metric-icon blue"><Activity size={21}/></span>
        <strong>{ar ? "نتائج الأداء ستظهر هنا" : "Your performance results will appear here"}</strong>
        <span>{ar ? "ستتمكن من متابعة نتائج الفترات والنتيجة السنوية بعد اعتمادها ونشرها." : "You’ll be able to review period results and your annual rating once they are approved and published."}</span>
        <span className="readonly-pill"><LockKeyhole size={12}/> {ar ? "بانتظار نشر النتائج" : "Awaiting result publication"}</span>
      </section>
    </AppShell>
  );
}