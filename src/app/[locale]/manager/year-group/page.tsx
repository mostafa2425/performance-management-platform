"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, FileCheck2, LockKeyhole, Send, ShieldAlert, Users } from "lucide-react";

type Member = { id: string; name: string; role: string; period: boolean; competencies: boolean; annualScore: number | null };
const seed: Member[] = [
  { id: "EMP-10561", name: "Sara Ahmed", role: "Senior UI/UX Designer", period: true, competencies: true, annualScore: 91.4 },
  { id: "EMP-10574", name: "Omar Khaled", role: "Frontend Developer", period: true, competencies: true, annualScore: 88.2 },
  { id: "EMP-10589", name: "Mona Ali", role: "Business Analyst", period: true, competencies: false, annualScore: null },
  { id: "EMP-10602", name: "Youssef Hassan", role: "Software Engineer", period: true, competencies: true, annualScore: 86.7 },
  { id: "EMP-10618", name: "Nada Hany", role: "QA Engineer", period: false, competencies: true, annualScore: null },
  { id: "EMP-10623", name: "Karim Adel", role: "Product Owner", period: true, competencies: true, annualScore: 93.1 }
];

export default function ManagerYearGroupPage() {
  const ar = useLocale() === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [members, setMembers] = useState(seed);
  const [confirmed, setConfirmed] = useState(false);
  const completeCount = useMemo(() => members.filter((member) => member.period && member.competencies).length, [members]);
  const allComplete = completeCount === members.length;
  const pending = members.length - completeCount;

  function toggleMember(id: string, field: "period" | "competencies") {
    setConfirmed(false);
    setMembers((current) => current.map((member) => member.id === id ? { ...member, [field]: !member[field] } : member));
  }

  return (
    <AppShell role="manager" title={t("Manager–Year Group", "مجموعة المدير والسنة")} subtitle={t("Review annual evaluation completeness for your manager-year group before Admin review.", "راجع اكتمال التقييم السنوي لمجموعة المدير والسنة قبل الإرسال إلى الإدارة.")}>
      <div className="year-group-topline">
        <Link href={`/${ar ? "ar" : "en"}/manager/evaluation`}><ArrowLeft size={14} />{t("Back to evaluation workspace", "العودة لمساحة التقييم")}</Link>
        <span className="readonly-pill">2026 · {t("Quarterly cycle", "دورة ربع سنوية")}</span>
      </div>

      <section className="panel year-group-hero">
        <div className="year-group-hero-copy">
          <span className="manager-eyebrow"><Users size={13} />{t("MANAGER GROUP REVIEW", "مراجعة مجموعة المدير")}</span>
          <h2>{t("Annual group readiness", "جاهزية المجموعة السنوية")}</h2>
          <p>{t("All applicable period evaluations and annual competency assessments must be complete before the group can be submitted for Admin review.", "يجب اكتمال تقييمات الفترات المعنية وتقييمات الكفاءات السنوية قبل إرسال المجموعة لمراجعة الإدارة.")}</p>
        </div>
        <div className="year-group-progress">
          <strong>{completeCount}<small>/{members.length}</small></strong>
          <span>{t("Members complete", "أعضاء مكتملون")}</span>
          <div className="department-progress-track"><span style={{ width: (completeCount / members.length * 100) + "%" }} /></div>
        </div>
      </section>

      <section className="year-group-stats">
        <article className="panel"><span>{t("Group members", "أعضاء المجموعة")}</span><strong>{members.length}</strong><small>{t("Illustrative direct reports", "موظفون مباشرون توضيحيون")}</small></article>
        <article className="panel"><span>{t("Evaluation complete", "تقييم مكتمل")}</span><strong>{completeCount}</strong><small>{t("Periods + competencies", "الفترات + الكفاءات")}</small></article>
        <article className="panel"><span>{t("Pending completion", "بانتظار الاستكمال")}</span><strong>{pending}</strong><small>{t("Requires manager action", "يتطلب إجراء المدير")}</small></article>
        <article className="panel"><span>{t("Admin approval", "اعتماد الإدارة")}</span><strong>{t("Pending", "معلق")}</strong><small>{t("After group submission", "بعد إرسال المجموعة")}</small></article>
      </section>

      <section className="panel year-group-members-panel">
        <div className="panel-heading">
          <div><h3>{t("Group member evaluations", "تقييمات أعضاء المجموعة")}</h3><p>{t("Track period evaluation and annual competency completion for each employee.", "تابع اكتمال تقييم الفترة والكفاءات السنوية لكل موظف.")}</p></div>
          <span className="readonly-pill">{members.length} {t("members", "أعضاء")}</span>
        </div>
        <div className="year-group-table-wrap">
          <table className="year-group-table">
            <thead><tr>
              <th>{t("Employee", "الموظف")}</th>
              <th>{t("Period evaluation", "تقييم الفترة")}</th>
              <th>{t("Annual competencies", "الكفاءات السنوية")}</th>
              <th>{t("Provisional annual score", "النتيجة السنوية المبدئية")}</th>
              <th>{t("Readiness", "الجاهزية")}</th>
            </tr></thead>
            <tbody>{members.map((member) => {
              const ready = member.period && member.competencies;
              return <tr key={member.id}>
                <td><div className="year-group-person"><strong>{member.name}</strong><small>{member.role} · {member.id}</small></div></td>
                <td><label className="year-group-toggle"><input type="checkbox" checked={member.period} onChange={() => toggleMember(member.id, "period")} /><span>{member.period ? t("Complete", "مكتمل") : t("Incomplete", "غير مكتمل")}</span></label></td>
                <td><label className="year-group-toggle"><input type="checkbox" checked={member.competencies} onChange={() => toggleMember(member.id, "competencies")} /><span>{member.competencies ? t("Complete", "مكتمل") : t("Incomplete", "غير مكتمل")}</span></label></td>
                <td><strong className="year-group-score">{member.annualScore === null ? "—" : member.annualScore.toFixed(1) + "%"}</strong></td>
                <td><span className={`year-group-status ${ready ? "ready" : "pending"}`}>{ready ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{ready ? t("Ready", "جاهز") : t("Needs completion", "يتطلب استكمالاً")}</span></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="year-group-demo-note"><AlertTriangle size={14} />{t("Checkboxes are demo controls to preview the readiness gate. In production, completion is derived from saved evaluations and workflow status.", "مربعات الاختيار أدوات تجريبية لمعاينة شرط الجاهزية. في النسخة الفعلية يتم تحديد الاكتمال من التقييمات المحفوظة وحالة سير العمل.")}</div>
      </section>

      <section className="panel year-group-governance">
        <div className="panel-heading"><div><h3>{t("Bell Curve compliance", "التحقق من Bell Curve")}</h3><p>{t("A group-level check is required before Admin approval.", "يلزم التحقق على مستوى المجموعة قبل اعتماد الإدارة.")}</p></div><ShieldAlert size={19} /></div>
        <div className="year-group-governance-message">
          <LockKeyhole size={17} />
          <div><strong>{t("Approved distribution policy is not configured", "سياسة التوزيع المعتمدة غير مهيأة")}</strong><p>{t("The BRD defines minimum and maximum rating counts, but the approved thresholds and the final calibration rule must be confirmed. This demo does not calculate compliance or change employee ratings.", "يحدد BRD حدوداً دنيا وعليا لأعداد التقييمات، لكن يجب تأكيد النسب المعتمدة والقاعدة النهائية للمعايرة. هذه النسخة التجريبية لا تحسب التوافق ولا تغير تقييمات الموظفين.")}</p></div>
        </div>
        <div className="year-group-checklist">
          <span><CheckCircle2 size={14} />{t("Member completion can be reviewed", "يمكن مراجعة اكتمال الأعضاء")}</span>
          <span><AlertTriangle size={14} />{t("Bell Curve validation unavailable", "التحقق من Bell Curve غير متاح")}</span>
          <span><AlertTriangle size={14} />{t("Admin approval not yet requested", "لم يتم طلب اعتماد الإدارة بعد")}</span>
        </div>
      </section>

      <div className="year-group-submit">
        <div>{confirmed ? <span className="year-group-confirmed"><CheckCircle2 size={15} />{t("Demo submission preview recorded", "تم تسجيل معاينة الإرسال التجريبية")}</span> : <span className="year-group-blocked"><AlertTriangle size={15} />{allComplete ? t("Completion checks passed; Bell Curve policy still blocks submission.", "اكتملت تقييمات الأعضاء، لكن سياسة Bell Curve ما زالت تمنع الإرسال.") : t(pending + " member(s) still need evaluation completion.", "لا يزال " + pending + " من الأعضاء بحاجة لاستكمال التقييم.")}</span>}</div>
        <button type="button" disabled={!allComplete} onClick={() => setConfirmed(true)}><Send size={15} />{t("Preview group submission", "معاينة إرسال المجموعة")}</button>
      </div>
      <div className="admin-demo-note"><FileCheck2 size={15} />{t("No real submission, score calibration or Admin workflow transition occurs in this frontend demo.", "لا يحدث إرسال فعلي أو معايرة للدرجات أو انتقال لسير عمل الإدارة في هذه النسخة التجريبية.")}</div>
    </AppShell>
  );
}
