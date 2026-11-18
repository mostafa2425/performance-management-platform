"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useState } from "react";
import {
  CalendarDays, CheckCircle2, Clock3, FileCheck2, LockKeyhole,
  Target, TrendingUp, ChevronRight, Info
} from "lucide-react";

type Period = {
  id: string;
  label: string;
  date: string;
  status: "published" | "in-progress" | "upcoming";
  result?: number;
};

const periods: Period[] = [
  { id: "q1", label: "Q1", date: "Jan 01 – Mar 31, 2026", status: "published", result: 82 },
  { id: "q2", label: "Q2", date: "Apr 01 – Jun 30, 2026", status: "published", result: 86 },
  { id: "q3", label: "Q3", date: "Jul 01 – Sep 30, 2026", status: "published", result: 88 },
  { id: "q4", label: "Q4", date: "Oct 01 – Dec 31, 2026", status: "in-progress" }
];

const objectives = [
  { id: "OBJ-01", title: "Improve delivery predictability", titleAr: "تحسين القدرة على التنبؤ بالتسليم", target: "90% on-time delivery" },
  { id: "OBJ-02", title: "Enhance product quality", titleAr: "تعزيز جودة المنتج", target: "Reduce escaped defects" },
  { id: "OBJ-03", title: "Strengthen team collaboration", titleAr: "تعزيز التعاون داخل الفريق", target: "Complete agreed team practices" }
];

export default function EmployeePerformancePage() {
  const ar = useLocale() === "ar";
  const [selected, setSelected] = useState("q3");
  const t = (en: string, a: string) => ar ? a : en;
  const period = periods.find((item) => item.id === selected) ?? periods[2];
  const published = period.status === "published";

  return (
    <AppShell title={t("My performance", "أدائي")} subtitle={t("Review finalized period results and your annual outcome when it is published.", "راجع نتائج الفترات المعتمدة ونتيجتك السنوية عند نشرها.")}>
      <div className="employee-results-notice">
        <Info size={17}/>
        <span>{t("Employee results show finalized and published outcomes only. Individual KPI actuals, achievement percentages, manager comments and evidence are not displayed.", "تعرض نتائج الموظف المعتمدة والمنشورة فقط. لا تظهر القيم الفعلية لمؤشرات الأداء أو نسب الإنجاز أو تعليقات المدير أو الأدلة الداعمة.")}</span>
      </div>

      <section className="employee-results-summary">
        <div className="employee-results-summary-copy">
          <span className="employee-results-eyebrow"><CalendarDays size={14}/> {t("PERFORMANCE YEAR 2026", "سنة الأداء 2026")}</span>
          <h2>{t("Your performance journey", "رحلة أدائك")}</h2>
          <p>{t("2026 Annual Performance Cycle · Quarterly frequency (demo data)", "دورة الأداء السنوية 2026 · دورية ربع سنوية (بيانات تجريبية)")}</p>
        </div>
        <div className="employee-results-cycle-state"><span className="cycle-live-dot"/>{t("Cycle in progress", "الدورة جارية")}</div>
      </section>

      <section className="employee-period-section">
        <div className="employee-section-heading">
          <div><h3>{t("Performance period results", "نتائج فترات الأداء")}</h3><p>{t("Select a period to view its finalized result.", "اختر فترة لعرض نتيجتها النهائية.")}</p></div>
          <span className="readonly-pill"><LockKeyhole size={12}/>{t("Read only", "للعرض فقط")}</span>
        </div>
        <div className="employee-period-tabs" role="tablist" aria-label={t("Performance periods", "فترات الأداء")}>
          {periods.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={selected === item.id} className={selected === item.id ? "selected" : ""} onClick={() => setSelected(item.id)}>
              <span>{item.label}</span><small>{item.status === "published" ? t("Published", "منشورة") : item.status === "in-progress" ? t("In progress", "جارية") : t("Upcoming", "قادمة")}</small>
            </button>
          ))}
        </div>

        {published ? (
          <div className="employee-period-result">
            <div className="employee-period-result-top">
              <div><span className="employee-result-label">{t("FINALIZED PERIOD RESULT", "نتيجة الفترة المعتمدة")}</span><h4>{period.label} · {period.date}</h4></div>
              <span className="employee-published-badge"><CheckCircle2 size={13}/>{t("Published", "منشورة")}</span>
            </div>
            <div className="employee-result-score-row">
              <div className="employee-result-score"><strong>{period.result}%</strong><span>{t("Period result", "نتيجة الفترة")}</span></div>
              <div className="employee-result-progress"><div><span>{t("Finalized result", "النتيجة النهائية")}</span><b>{period.result}%</b></div><div className="employee-result-track"><span style={{width: `${period.result}%`}}/></div><small>{t("Approved and available to you", "معتمدة ومتاحة للاطلاع")}</small></div>
            </div>
            <div className="employee-approved-objectives">
              <div className="employee-section-heading"><div><h3>{t("Your approved objectives", "أهدافك المعتمدة")}</h3><p>{t("Objectives and targets are shown as read-only.", "تُعرض الأهداف والمستهدفات للقراءة فقط.")}</p></div></div>
              {objectives.map((item) => <div className="employee-approved-objective" key={item.id}><span className="employee-objective-icon"><Target size={16}/></span><div><strong>{ar ? item.titleAr : item.title}</strong><small>{item.id} · {item.target}</small></div><LockKeyhole size={13}/></div>)}
            </div>
          </div>
        ) : (
          <div className="employee-period-locked">
            <span className="employee-period-lock-icon"><Clock3 size={21}/></span>
            <strong>{t("This period result is not available yet", "نتيجة هذه الفترة غير متاحة بعد")}</strong>
            <p>{t("Your manager evaluation and the applicable approval and publication steps must be completed before the result appears here.", "يجب استكمال تقييم المدير وخطوات الاعتماد والنشر المطلوبة قبل ظهور النتيجة هنا.")}</p>
            <span className="employee-upcoming-date">{period.date}</span>
          </div>
        )}
      </section>

      <section className="employee-annual-result">
        <div className="employee-section-heading"><div><h3>{t("Annual performance result", "نتيجة الأداء السنوية")}</h3><p>{t("Published after final group approval.", "تُنشر بعد الاعتماد النهائي للمجموعة.")}</p></div><span className="readonly-pill"><LockKeyhole size={12}/>{t("Publication required", "تتطلب النشر")}</span></div>
        <div className="employee-annual-pending">
          <span className="employee-annual-icon"><FileCheck2 size={20}/></span>
          <div><strong>{t("Your annual result is not published yet", "لم يتم نشر نتيجتك السنوية بعد")}</strong><p>{t("The Annual Objectives Result, Annual Competency Result, Overall Annual Performance and Final Annual Rating will appear here after approval and publication.", "ستظهر هنا نتيجة الأهداف السنوية ونتيجة الكفاءات السنوية وإجمالي الأداء السنوي والتقييم السنوي النهائي بعد الاعتماد والنشر.")}</p></div>
          <span className="employee-pending-status">{t("Pending", "قيد الانتظار")}</span>
        </div>
        <div className="employee-annual-components">
          <div><span>{t("Annual objectives", "الأهداف السنوية")}</span><strong>—</strong></div>
          <div><span>{t("Annual competencies", "الكفاءات السنوية")}</span><strong>—</strong></div>
          <div><span>{t("Overall annual performance", "إجمالي الأداء السنوي")}</span><strong>—</strong></div>
          <div><span>{t("Final annual rating", "التقييم السنوي النهائي")}</span><strong>—</strong></div>
        </div>
      </section>
      <div className="employee-results-footnote"><TrendingUp size={14}/>{t("All displayed scores are illustrative demo values and will be replaced by approved backend results.", "جميع الدرجات المعروضة بيانات تجريبية توضيحية وسيتم استبدالها بالنتائج المعتمدة من الـBackend.")}</div>
    </AppShell>
  );
}
