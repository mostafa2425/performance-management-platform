"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, FileCheck2, Search, UserRound } from "lucide-react";

type ReviewItem = {
  id: string; employee: string; employeeId: string; source: "Admin" | "Employee";
  status: string; detail: string; attention: boolean; updated: string;
};

// Illustrative workflow records only. Replace with authorized manager-scoped API data.
const items: ReviewItem[] = [
  { id: "PLAN-26018", employee: "Mona Ali", employeeId: "EMP-10589", source: "Admin", status: "Returned for modification", detail: "Admin comments are available against the relevant objectives / KPIs.", attention: false, updated: "Today" },
  { id: "PLAN-26024", employee: "Nada Hany", employeeId: "EMP-10618", source: "Employee", status: "Returned for modification", detail: "Employee requested changes and provided a mandatory comment.", attention: true, updated: "Yesterday" },
  { id: "PLAN-26031", employee: "Omar Khaled", employeeId: "EMP-10574", source: "Admin", status: "Returned for modification", detail: "Plan was reopened by Admin before the evaluation stage.", attention: false, updated: "Nov 15" }
];

export default function ManagerReviewsPage() {
  const ar = useLocale() === "ar";
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const visible = useMemo(() => items.filter((item) =>
    (item.employee + " " + item.employeeId + " " + item.id).toLowerCase().includes(query.toLowerCase()) &&
    (source === "all" || item.source.toLowerCase() === source)
  ), [query, source]);
  const employeeReturns = items.filter((item) => item.source === "Employee").length;
  const adminReturns = items.filter((item) => item.source === "Admin").length;
  const attentionCount = items.filter((item) => item.attention).length;

  return (
    <AppShell role="manager" title={t("Review queue", "قائمة المراجعات")} subtitle={t("Review performance plans returned to you and complete the required updates.", "راجع خطط الأداء المعادة إليك واستكمل التعديلات المطلوبة.")}>
      <div className="team-summary-grid">
        <div className="team-summary-card"><Clock3 size={18}/><strong>{items.length}</strong><span>{t("Returned plans", "خطط معادة")}</span></div>
        <div className="team-summary-card"><FileCheck2 size={18}/><strong>{adminReturns}</strong><span>{t("Returned by Admin", "معادة من المسؤول")}</span></div>
        <div className="team-summary-card"><UserRound size={18}/><strong>{employeeReturns}</strong><span>{t("Employee requests", "طلبات الموظفين")}</span></div>
      </div>
      <section className="panel team-directory">
        <div className="panel-heading"><div><h3>{t("Plans requiring your action", "خطط تتطلب إجراءك")}</h3><p>{t("Returned plans remain editable for the authorized action owner. Resubmission follows the return source.", "تظل الخطط المعادة قابلة للتعديل بواسطة المسؤول عن الإجراء. وتختلف إعادة الإرسال حسب مصدر الإرجاع.")}</p></div><span className="readonly-pill">{t("Illustrative queue", "قائمة توضيحية")}</span></div>
        <div className="team-directory-toolbar">
          <label className="search-field"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search employee or plan ID", "ابحث عن الموظف أو رقم الخطة")}/></label>
          <div className="team-filter"><FileCheck2 size={14}/><select value={source} onChange={(e) => setSource(e.target.value)}><option value="all">{t("All return sources", "كل مصادر الإرجاع")}</option><option value="admin">{t("Returned by Admin", "معادة من المسؤول")}</option><option value="employee">{t("Employee request", "طلب موظف")}</option></select></div>
        </div>
        <div className="manager-queue-list">
          {visible.map((item) => <article className="manager-queue-item" key={item.id}>
            <span className={`queue-priority ${item.attention ? "high" : "normal"}`}/>
            <div className="queue-item-main"><strong>{item.employee}</strong><small>{item.employeeId} · {item.id}</small><span>{item.detail}</span><span className="manager-status risk">{item.status}</span></div>
            <div className="queue-item-due"><b>{item.source}</b><small>{t("Return source", "مصدر الإرجاع")}</small></div>
            {item.attention && <span className="manager-status risk"><AlertTriangle size={12}/>{t("Admin attention", "يتطلب انتباه المسؤول")}</span>}
          </article>)}
        </div>
        {visible.length === 0 && <div className="team-empty">{t("No matching returned plans.", "لا توجد خطط معادة مطابقة.")}</div>}
        <div className="team-table-footer"><span>{t("Showing demo records", "عرض سجلات تجريبية")} · {visible.length}</span><span>{t("Requires Admin Attention is a flag, not a workflow status.", "يتطلب انتباه المسؤول هو مؤشر وليس حالة لسير العمل.")}</span></div>
      </section>
      <div className="admin-demo-note"><AlertTriangle size={15}/><span>{t("Manager queue shows only plans returned for modification. Initial Admin approval belongs to the Admin role; employee plan approval belongs to the Employee role. Actions and records here are not connected to the backend.", "تعرض قائمة المدير الخطط المعادة للتعديل فقط. الاعتماد الأولي من اختصاص Admin، واعتماد خطة الموظف من اختصاص Employee. الإجراءات والسجلات هنا غير مرتبطة بالـBackend.")}</span></div>
    </AppShell>
  );
}
