"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, MessageSquare, ShieldCheck, Users, XCircle } from "lucide-react";

type Employee = { id: string; name: string; department: string; objectives: number; competencies: number; score: number; rating: string; status: "Complete" | "Incomplete" };
const initialEmployees: Employee[] = [
  { id: "EMP-10561", name: "Sara Ahmed", department: "Human Resources", objectives: 91.4, competencies: 94, score: 91.9, rating: "Exceeds", status: "Complete" },
  { id: "EMP-10574", name: "Omar Khaled", department: "Technology", objectives: 88.2, competencies: 85, score: 87.6, rating: "Meets", status: "Complete" },
  { id: "EMP-10589", name: "Mona Ali", department: "Program Management", objectives: 84.1, competencies: 0, score: 0, rating: "Pending", status: "Incomplete" },
  { id: "EMP-10602", name: "Youssef Hassan", department: "Technology", objectives: 86.7, competencies: 90, score: 87.4, rating: "Meets", status: "Complete" },
  { id: "EMP-10618", name: "Nada Hany", department: "Technology", objectives: 0, competencies: 88, score: 0, rating: "Pending", status: "Incomplete" },
  { id: "EMP-10623", name: "Karim Adel", department: "Finance & Operations", objectives: 93.1, competencies: 96, score: 93.7, rating: "Exceeds", status: "Complete" }
];

export default function AdminFinalReviewPage() {
  const ar = useLocale() === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [employees] = useState(initialEmployees);
  const [decision, setDecision] = useState<"approve" | "return" | null>(null);
  const [comment, setComment] = useState("");\n  const [affectedEmployees, setAffectedEmployees] = useState<string[]>([]);
  const [recorded, setRecorded] = useState<"approved" | "returned" | null>(null);
  const [history, setHistory] = useState<{ action: string; note: string; time: string }[]>([
    { action: "Submitted by Manager", note: "Annual group submitted for final review.", time: "Nov 18, 2026 · 10:42 AM" },
    { action: "Bell Curve check", note: "Distribution policy requires confirmation before final approval.", time: "Nov 18, 2026 · 10:43 AM" }
  ]);
  const complete = employees.filter((employee) => employee.status === "Complete");
  const incomplete = employees.length - complete.length;
  const canApprove = incomplete === 0;
  const average = complete.length ? complete.reduce((sum, employee) => sum + employee.score, 0) / complete.length : 0;
  const commentRequired = decision === "return";
  const canRecord = !!decision && (!commentRequired || (comment.trim().length > 0 && affectedEmployees.length > 0)) && (decision !== "approve" || canApprove);

  function recordDecision() {
    if (!canRecord || !decision) return;
    const action = decision === "approve" ? "approved" : "returned";
    setRecorded(action);
    setHistory((items) => [{ action: decision === "approve" ? "Admin approved group" : "Admin returned group", note: decision === "return" ? comment.trim() + " · Affected: " + affectedEmployees.join(", ") : comment.trim() || "Approved for final publication workflow.", time: "Just now · Demo action" }, ...items]);
  }

  return (
    <AppShell role="admin" title={t("Admin final review", "المراجعة النهائية للإدارة")} subtitle={t("Review the Manager–Year Group, verify completeness and record a group-level decision.", "راجع مجموعة المدير والسنة وتحقق من اكتمالها وسجّل قراراً على مستوى المجموعة.")}>
      <div className="admin-final-topline"><span className="readonly-pill">2026 · {t("Annual performance cycle", "دورة الأداء السنوية")}</span><span className="readonly-pill">{t("Illustrative group data", "بيانات مجموعة توضيحية")}</span></div>

      <section className="panel admin-final-hero">
        <div><span className="admin-final-eyebrow"><Users size={13}/>{t("MANAGER–YEAR GROUP · TECHNOLOGY & SHARED SERVICES", "مجموعة المدير والسنة · التقنية والخدمات المشتركة")}</span><h2>{t("Annual performance group", "مجموعة الأداء السنوي")}</h2><p>{t("Submitted by: People Manager · Cycle: 2026 · Frequency: Quarterly", "مقدم من: مدير الفريق · الدورة: 2026 · التكرار: ربع سنوي")}</p></div>
        <div className="admin-final-summary-score"><strong>{average.toFixed(1)}%</strong><span>{t("Average of complete demo records", "متوسط السجلات التجريبية المكتملة")}</span></div>
      </section>

      <section className="admin-final-metrics">
        <article className="panel"><span>{t("Group population", "عدد المجموعة")}</span><strong>{employees.length}</strong><small>{t("Employees in this group", "موظف في المجموعة")}</small></article>
        <article className="panel"><span>{t("Complete evaluations", "تقييمات مكتملة")}</span><strong>{complete.length}</strong><small>{t("Period + annual competencies", "الفترات + الكفاءات السنوية")}</small></article>
        <article className="panel"><span>{t("Incomplete evaluations", "تقييمات غير مكتملة")}</span><strong>{incomplete}</strong><small>{t("Must be resolved before approval", "يجب استكمالها قبل الاعتماد")}</small></article>
        <article className="panel"><span>{t("Bell Curve", "التوزيع الطبيعي")}</span><strong>{t("Unverified", "غير متحقق")}</strong><small>{t("Policy thresholds unavailable", "حدود السياسة غير متاحة")}</small></article>
      </section>

      <section className="panel admin-final-table-panel">
        <div className="panel-heading"><div><h3>{t("Employee annual results", "النتائج السنوية للموظفين")}</h3><p>{t("Review objectives, competencies, overall score and rating for each member.", "راجع الأهداف والكفاءات والنتيجة الإجمالية والتقدير لكل عضو.")}</p></div><span className="readonly-pill">{employees.length} {t("records", "سجلات")}</span></div>
        <div className="admin-final-table-wrap"><table className="admin-final-table"><thead><tr><th>{t("Employee", "الموظف")}</th><th>{t("Objectives", "الأهداف")}</th><th>{t("Competencies", "الكفاءات")}</th><th>{t("Overall score", "النتيجة الإجمالية")}</th><th>{t("Rating", "التقدير")}</th><th>{t("Status", "الحالة")}</th></tr></thead><tbody>{employees.map((employee)=><tr key={employee.id}><td><div className="admin-final-person"><strong>{employee.name}</strong><small>{employee.department} · {employee.id}</small></div></td><td>{employee.objectives ? employee.objectives.toFixed(1)+"%" : "—"}</td><td>{employee.competencies ? employee.competencies.toFixed(1)+"%" : "—"}</td><td><strong className="admin-final-score">{employee.score ? employee.score.toFixed(1)+"%" : "—"}</strong></td><td>{employee.rating}</td><td><span className={`admin-final-status ${employee.status.toLowerCase()}`}>{employee.status==="Complete"?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>} {employee.status==="Complete"?t("Complete","مكتمل"):t("Incomplete","غير مكتمل")}</span></td></tr>)}</tbody></table></div>
        <div className="admin-final-note"><AlertTriangle size={14}/>{t("This demo contains incomplete employee records. The BRD requires group completeness before final approval; do not infer missing scores.", "تحتوي هذه النسخة التجريبية على سجلات غير مكتملة. يشترط BRD اكتمال المجموعة قبل الاعتماد النهائي؛ لا يتم افتراض الدرجات المفقودة.")}</div>
      </section>

\n      <section className="panel pw-calc-panel"><h3>Employee evaluation details</h3><p className="pw-muted">Review the visible score components for each member. Underlying KPI actuals, comments, evidence and workflow history are shown only as illustrative drill-down content.</p>{employees.map(employee=><details className="admin-final-employee-detail" key={employee.id}><summary><strong>{employee.name}</strong><span>{employee.id} · {employee.status}</span><b>{employee.score ? employee.score.toFixed(1)+"%" : "—"}</b></summary><div className="pw-plan-summary"><div><span>Annual Objectives Result</span><strong>{employee.objectives ? employee.objectives.toFixed(1)+"%" : "Pending"}</strong></div><div><span>Annual Competency Result</span><strong>{employee.competencies ? employee.competencies.toFixed(1)+"%" : "Pending"}</strong></div><div><span>Overall Annual Performance</span><strong>{employee.score ? employee.score.toFixed(1)+"%" : "Pending"}</strong></div><div><span>Calculated rating</span><strong>{employee.rating}</strong></div></div><small className="pw-muted">Objectives, KPI Actuals, competency ratings, evidence and workflow history are sample-only and require complete record payloads for production.</small></details>)}</section>\n      <section className="admin-final-lower-grid">
        <div className="panel admin-final-decision">
          <div className="panel-heading"><div><h3>{t("Group-level decision", "القرار على مستوى المجموعة")}</h3><p>{t("Approve the group or return it to the manager with a mandatory reason.", "اعتمد المجموعة أو أعدها إلى المدير مع توضيح سبب الإرجاع.")}</p></div><ShieldCheck size={18}/></div>
          <div className="admin-final-policy-warning"><AlertTriangle size={15}/><span>{t("Approval is blocked: incomplete employee evaluations and unverified Bell Curve policy.", "الاعتماد متوقف: توجد تقييمات غير مكتملة وسياسة Bell Curve غير متحقق منها.")}</span></div>
          <div className="admin-final-choice">
            <label className={decision==="approve"?"selected":""}><input type="radio" name="admin-decision" checked={decision==="approve"} onChange={()=>{setDecision("approve");setAffectedEmployees([]);setRecorded(null);}}/><span><CheckCircle2 size={16}/><strong>{t("Approve group", "اعتماد المجموعة")}</strong><small>{t("Proceed to final publication workflow", "الانتقال إلى مسار النشر النهائي")}</small></span></label>
            <label className={decision==="return"?"selected":""}><input type="radio" name="admin-decision" checked={decision==="return"} onChange={()=>{setDecision("return");setRecorded(null);}}/><span><XCircle size={16}/><strong>{t("Return to manager", "إرجاع إلى المدير")}</strong><small>{t("Send the entire group back for updates", "إعادة المجموعة بالكامل للتعديل")}</small></span></label>
          </div>
          \n          {decision === "return" && <div className="admin-final-affected"><strong>{t("Affected employees (required)", "الموظفون المتأثرون (مطلوب)")}</strong><p>{t("Select the employees whose permitted final-period evaluation inputs need revision.", "حدد الموظفين الذين تحتاج مدخلات تقييم الفترة النهائية المسموح بها لديهم إلى تعديل.")}</p>{employees.map(employee=><label key={employee.id}><input type="checkbox" checked={affectedEmployees.includes(employee.id)} onChange={event=>setAffectedEmployees(current=>event.target.checked?[...current,employee.id]:current.filter(id=>id!==employee.id))}/><span>{employee.name} · {employee.id}</span></label>)}</div>}\n          <label className="admin-final-comment-label">{t("Admin comments", "تعليقات الإدارة")} {commentRequired && <em>{t("Required for return", "مطلوبة عند الإرجاع")}</em>}<textarea value={comment} onChange={(event)=>{setComment(event.target.value);setRecorded(null);}} placeholder={t("Enter decision notes or required corrections…", "اكتب ملاحظات القرار أو التعديلات المطلوبة…")}/></label>
          <button className="admin-final-action" type="button" disabled={!canRecord} onClick={recordDecision}>{decision==="approve"?<CheckCircle2 size={15}/>:<MessageSquare size={15}/>} {decision==="approve"?t("Record approval preview","تسجيل معاينة الاعتماد"):t("Record return preview","تسجيل معاينة الإرجاع")}</button>
          {recorded && <div className="admin-final-recorded"><CheckCircle2 size={14}/>{recorded==="approved"?t("Demo approval decision recorded.","تم تسجيل قرار الاعتماد التجريبي."):t("Demo group return recorded.","تم تسجيل إرجاع المجموعة التجريبي.")}</div>}
        </div>

        <div className="panel admin-final-history">
          <div className="panel-heading"><div><h3>{t("Workflow history", "سجل سير العمل")}</h3><p>{t("Group-level audit trail", "سجل تدقيق المجموعة")}</p></div><Clock3 size={18}/></div>
          <div className="admin-final-timeline">{history.map((item,index)=><div className="admin-final-timeline-item" key={index}><i/><div><strong>{item.action}</strong><p>{item.note}</p><small>{item.time}</small></div></div>)}</div>
        </div>
      </section>
      <div className="admin-demo-note"><FileCheck2 size={15}/><span>{t("Frontend prototype only. Decisions update this local screen state; no backend workflow, notification, publication or audit record is created.", "نموذج Frontend فقط. القرارات تحدث حالة الشاشة محلياً ولا تنشئ سير عمل أو إشعاراً أو نشراً أو سجل تدقيق في Backend.")}</span></div>
    </AppShell>
  );
}
