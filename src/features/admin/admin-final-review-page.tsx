"use client";

import { AppButton, AppInput, AppTextArea, AppCheckbox, AppTable, AppDetails } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale, useTranslations } from "next-intl";
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
  const translate = useTranslations("AdminFinalReview");
  const [employees] = useState(initialEmployees);
  const [decision, setDecision] = useState<"approve" | "return" | null>(null);
  const [comment, setComment] = useState("");
  const [affectedEmployees, setAffectedEmployees] = useState<string[]>([]);
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
    <AppShell role="admin" title={translate("text001")} subtitle={translate("text002")}>
      <div className="admin-final-topline"><span className="readonly-pill">2026 · {translate("text003")}</span><span className="readonly-pill">{translate("text004")}</span></div>

      <section className="panel admin-final-hero">
        <div><span className="admin-final-eyebrow"><Users size={13}/>{translate("text005")}</span><h2>{translate("text006")}</h2><p>{translate("text007")}</p></div>
        <div className="admin-final-summary-score"><strong>{average.toFixed(1)}%</strong><span>{translate("text008")}</span></div>
      </section>

      <section className="admin-final-metrics">
        <article className="panel"><span>{translate("text009")}</span><strong>{employees.length}</strong><small>{translate("text010")}</small></article>
        <article className="panel"><span>{translate("text011")}</span><strong>{complete.length}</strong><small>{translate("text012")}</small></article>
        <article className="panel"><span>{translate("text013")}</span><strong>{incomplete}</strong><small>{translate("text014")}</small></article>
        <article className="panel"><span>{translate("text015")}</span><strong>{translate("text016")}</strong><small>{translate("text017")}</small></article>
      </section>

      <section className="panel admin-final-table-panel">
        <div className="panel-heading"><div><h3>{translate("text018")}</h3><p>{translate("text019")}</p></div><span className="readonly-pill">{employees.length} {translate("text020")}</span></div>
        <div className="admin-final-table-wrap"><AppTable className="admin-final-table"><thead><tr><th>{translate("text021")}</th><th>{translate("text022")}</th><th>{translate("text023")}</th><th>{translate("text024")}</th><th>{translate("text025")}</th><th>{translate("text026")}</th></tr></thead><tbody>{employees.map((employee)=><tr key={employee.id}><td><div className="admin-final-person"><strong>{employee.name}</strong><small>{employee.department} · {employee.id}</small></div></td><td>{employee.objectives ? employee.objectives.toFixed(1)+"%" : "—"}</td><td>{employee.competencies ? employee.competencies.toFixed(1)+"%" : "—"}</td><td><strong className="admin-final-score">{employee.score ? employee.score.toFixed(1)+"%" : "—"}</strong></td><td>{employee.rating}</td><td><span className={`admin-final-status ${employee.status.toLowerCase()}`}>{employee.status==="Complete"?<CheckCircle2 size={13}/>:<AlertTriangle size={13}/>} {employee.status==="Complete"?translate("text027"):translate("text028")}</span></td></tr>)}</tbody></AppTable></div>
        <div className="admin-final-note"><AlertTriangle size={14}/>{translate("text029")}</div>
      </section>


      <section className="panel pw-calc-panel"><h3>{translate("text030")}</h3><p className="pw-muted">{translate("text031")}</p>{employees.map(employee=><AppDetails className="admin-final-employee-detail" key={employee.id}><summary><strong>{employee.name}</strong><span>{employee.id} · {employee.status}</span><b>{employee.score ? employee.score.toFixed(1)+"%" : "—"}</b></summary><div className="pw-plan-summary"><div><span>{translate("text032")}</span><strong>{employee.objectives ? employee.objectives.toFixed(1)+"%" : "Pending"}</strong></div><div><span>{translate("text033")}</span><strong>{employee.competencies ? employee.competencies.toFixed(1)+"%" : "Pending"}</strong></div><div><span>{translate("text034")}</span><strong>{employee.score ? employee.score.toFixed(1)+"%" : "Pending"}</strong></div><div><span>{translate("text035")}</span><strong>{employee.rating}</strong></div></div><small className="pw-muted">Objectives, KPI Actuals, competency ratings, evidence and workflow history are sample-only and require complete record payloads for production.</small></AppDetails>)}</section>
      <section className="admin-final-lower-grid">
        <div className="panel admin-final-decision">
          <div className="panel-heading"><div><h3>{translate("text036")}</h3><p>{translate("text037")}</p></div><ShieldCheck size={18}/></div>
          <div className="admin-final-policy-warning"><AlertTriangle size={15}/><span>{translate("text038")}</span></div>
          <div className="admin-final-choice">
            <label className={decision==="approve"?"selected":""}><AppInput type="radio" name="admin-decision" checked={decision==="approve"} onChange={()=>{setDecision("approve");setAffectedEmployees([]);setRecorded(null);}}/><span><CheckCircle2 size={16}/><strong>{translate("text039")}</strong><small>{translate("text040")}</small></span></label>
            <label className={decision==="return"?"selected":""}><AppInput type="radio" name="admin-decision" checked={decision==="return"} onChange={()=>{setDecision("return");setRecorded(null);}}/><span><XCircle size={16}/><strong>{translate("text041")}</strong><small>{translate("text042")}</small></span></label>
          </div>
          
          {decision === "return" && <div className="admin-final-affected"><strong>{translate("text043")}</strong><p>{translate("text044")}</p>{employees.map(employee=><label key={employee.id}><AppCheckbox type="checkbox" checked={affectedEmployees.includes(employee.id)} onChange={event=>setAffectedEmployees(current=>event.target.checked?[...current,employee.id]:current.filter(id=>id!==employee.id))}/><span>{employee.name} · {employee.id}</span></label>)}</div>}
          <label className="admin-final-comment-label">{translate("text045")} {commentRequired && <em>{translate("text046")}</em>}<AppTextArea value={comment} onChange={(event)=>{setComment(event.target.value);setRecorded(null);}} placeholder={translate("text047")}/></label>
          <AppButton className="admin-final-action" type="button" disabled={!canRecord} onClick={recordDecision}>{decision==="approve"?<CheckCircle2 size={15}/>:<MessageSquare size={15}/>} {decision==="approve"?translate("text048"):translate("text049")}</AppButton>
          {recorded && <div className="admin-final-recorded"><CheckCircle2 size={14}/>{recorded==="approved"?translate("text050"):translate("text051")}</div>}
        </div>

        <div className="panel admin-final-history">
          <div className="panel-heading"><div><h3>{translate("text052")}</h3><p>{translate("text053")}</p></div><Clock3 size={18}/></div>
          <div className="admin-final-timeline">{history.map((item,index)=><div className="admin-final-timeline-item" key={index}><i/><div><strong>{item.action}</strong><p>{item.note}</p><small>{item.time}</small></div></div>)}</div>
        </div>
      </section>
      <div className="admin-demo-note"><FileCheck2 size={15}/><span>{translate("text054")}</span></div>
    </AppShell>
  );
}
