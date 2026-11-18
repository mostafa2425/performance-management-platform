"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, LockKeyhole, Target, UserRound } from "lucide-react";

const people: Record<string, {name:string;role:string;department:string;progress:number;status:string;objectives:number}> = {
  "EMP-10561": {name:"Sara Ahmed",role:"Senior UI/UX Designer",department:"Product Design",progress:92,status:"On track",objectives:5},
  "EMP-10574": {name:"Omar Khaled",role:"Frontend Developer",department:"Engineering",progress:78,status:"On track",objectives:6},
  "EMP-10589": {name:"Mona Ali",role:"Business Analyst",department:"Program Management",progress:61,status:"Needs attention",objectives:5},
  "EMP-10602": {name:"Youssef Hassan",role:"Software Engineer",department:"Engineering",progress:86,status:"On track",objectives:6},
  "EMP-10618": {name:"Nada Hany",role:"QA Engineer",department:"Quality Assurance",progress:48,status:"Needs attention",objectives:4},
  "EMP-10623": {name:"Karim Adel",role:"Product Owner",department:"Product",progress:73,status:"On track",objectives:5}
};
const periodData = [
  {id:"Q1",label:"Quarter 1",state:"Approved",result:"82%",note:"Non-final period · approved result",actuals:[["Sprint delivery","80%","84%"],["Ticket update hygiene","90%","92%"],["Documentation","85%","88%"]]},
  {id:"Q2",label:"Quarter 2",state:"Approved",result:"86%",note:"Non-final period · approved result",actuals:[["Sprint delivery","80%","88%"],["Ticket update hygiene","90%","94%"],["Documentation","85%","91%"]]},
  {id:"Q3",label:"Quarter 3",state:"Approved",result:"88%",note:"Non-final period · approved result",actuals:[["Sprint delivery","80%","90%"],["Ticket update hygiene","90%","95%"],["Documentation","85%","92%"]]},
  {id:"Q4",label:"Quarter 4",state:"In progress",result:"—",note:"Final period · evaluation not yet finalized",actuals:[]}
];
export default function ManagerEmployeeDetailPage() {
  const ar=useLocale()==="ar";
  const params=useParams<{employeeId:string}>();
  const employeeId=decodeURIComponent(params.employeeId);
  const person=people[employeeId];
  const [period,setPeriod]=useState("Q1");
  const t=(en:string,arabic:string)=>ar?arabic:en;
  if(!person) return <AppShell role="manager" title={t("Employee not found","الموظف غير موجود")}><section className="panel" style={{padding:24}}><p>{t("This employee is not part of the illustrative manager dataset.","هذا الموظف غير موجود ضمن بيانات المدير التوضيحية.")}</p><Link href={`/${ar?"ar":"en"}/manager/team`}>{t("Back to team","العودة للفريق")}</Link></section></AppShell>;
  const selected=periodData.find(x=>x.id===period)!;
  return <AppShell role="manager" title={t("Employee performance details","تفاصيل أداء الموظف")} subtitle={t("Review this employee within the selected performance cycle and period.","راجع أداء الموظف ضمن دورة الأداء والفترة المحددتين.")}>
    <div className="employee-detail-back"><Link href={`/${ar?"ar":"en"}/manager/team`}><ArrowLeft size={15}/>{t("Back to my team","العودة إلى فريقي")}</Link><span className="readonly-pill">{t("Illustrative record","سجل توضيحي")}</span></div>
    <section className="panel employee-detail-hero"><div className="employee-detail-identity"><span className="employee-detail-avatar">{person.name.split(" ").map(x=>x[0]).join("")}</span><div><h2>{person.name}</h2><p>{person.role} · {person.department}</p><small>{employeeId} · {t("2026 Performance Cycle","دورة الأداء 2026")}</small></div></div><span className={`manager-status ${person.progress<65?"risk":"good"}`}>{t(person.status,person.progress<65?"تحتاج متابعة":"على المسار")}</span><div className="employee-detail-stats"><div><strong>{person.progress}%</strong><span>{t("Objective progress","تقدم الأهداف")}</span></div><div><strong>{person.objectives}</strong><span>{t("Approved objectives","الأهداف المعتمدة")}</span></div><div><strong>{t("Quarterly","ربع سنوي")}</strong><span>{t("Cycle frequency","تكرار الدورة")}</span></div></div></section>
    <section className="panel employee-period-panel"><div className="panel-heading"><div><h3>{t("Performance period evaluation","تقييم فترة الأداء")}</h3><p>{t("Each period is reviewed independently. Non-final period results are finalized after Admin approval.","يتم تقييم كل فترة بشكل مستقل. تُعتمد نتائج الفترات غير النهائية بعد موافقة Admin.")}</p></div><span className="readonly-pill">{t("2026 cycle","دورة 2026")}</span></div>
      <div className="period-tabs" role="tablist" aria-label={t("Performance periods","فترات الأداء")}>{periodData.map(p=><button type="button" key={p.id} role="tab" aria-selected={period===p.id} className={period===p.id?"active":""} onClick={()=>setPeriod(p.id)}>{p.id}</button>)}</div>
      <div className="period-result-header"><div><strong>{t(selected.label,selected.id==="Q1"?"الربع الأول":selected.id==="Q2"?"الربع الثاني":selected.id==="Q3"?"الربع الثالث":"الربع الرابع")}</strong><small>{t(selected.note,selected.id==="Q4"?"الفترة النهائية · لم يتم اعتماد التقييم بعد":"فترة غير نهائية · نتيجة معتمدة")}</small></div><div><strong>{selected.result}</strong><span>{t("Period result","نتيجة الفترة")}</span></div></div>
      {selected.actuals.length>0?<div className="employee-kpi-table"><div className="employee-kpi-head"><span>{t("KPI","مؤشر الأداء")}</span><span>{t("Target","المستهدف")}</span><span>{t("Actual","الفعلي")}</span></div>{selected.actuals.map(row=><div className="employee-kpi-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><span>{row[2]}</span></div>)}</div>:<div className="period-empty"><Clock3 size={18}/><div><strong>{t("Evaluation not available yet","التقييم غير متاح حتى الآن")}</strong><p>{t("The final period remains provisional until the Manager–Year Group is submitted and approved by Admin.","تظل نتيجة الفترة النهائية مبدئية حتى إرسال مجموعة المدير والسنة واعتمادها من Admin.")}</p></div></div>}
      <div className="employee-period-foot"><LockKeyhole size={14}/>{t("Approved objectives, KPIs, targets and weights are read-only during evaluation.","الأهداف والمؤشرات والمستهدفات والأوزان المعتمدة للعرض فقط أثناء التقييم.")}</div>
    </section>
    <section className="panel employee-annual-panel"><div className="panel-heading"><div><h3>{t("Annual evaluation","التقييم السنوي")}</h3><p>{t("Annual objectives, competencies and overall result are consolidated separately from individual period results.","يتم تجميع نتائج الأهداف والكفاءات والنتيجة الإجمالية سنوياً بشكل منفصل عن نتائج الفترات الفردية.")}</p></div><span className="readonly-pill">{t("Annual view","العرض السنوي")}</span></div>
      <div className="annual-evaluation-grid"><article><Target size={17}/><strong>{t("Annual objectives result","نتيجة الأهداف السنوية")}</strong><b>—</b><small>{t("Calculated from the cycle's period results","تُحسب من نتائج فترات الدورة")}</small></article><article><UserRound size={17}/><strong>{t("Annual competency result","نتيجة الكفاءات السنوية")}</strong><b>—</b><small>{t("Manager-led annual competency ratings","تقييم سنوي للكفاءات بواسطة المدير")}</small></article><article><FileText size={17}/><strong>{t("Overall annual performance","الأداء السنوي الإجمالي")}</strong><b>Pending</b><small>{t("Finalized after Manager–Year Group approval","يُعتمد بعد موافقة مجموعة المدير والسنة")}</small></article></div>
      <div className="period-empty annual-note"><CalendarDays size={18}/><div><strong>{t("Annual result is not yet final","النتيجة السنوية لم تعتمد بعد")}</strong><p>{t("The annual result combines the applicable period objectives result and annual competency result using the configured component weights. The final result remains provisional until Admin approves the complete Manager–Year Group.","تجمع النتيجة السنوية نتيجة أهداف الفترات ونتيجة الكفاءات السنوية وفق الأوزان المحددة. وتظل النتيجة مبدئية حتى اعتماد مجموعة المدير والسنة بالكامل من Admin.")}</p></div></div>
    </section>
    <div className="admin-demo-note"><CheckCircle2 size={15}/><span>{t("This detail view is illustrative. Period values, evaluation status, KPI Actuals, annual calculations and access scope must be loaded from backend services and restricted to authorized direct reports.","هذه الشاشة توضيحية. يجب تحميل قيم الفترات وحالة التقييم والقيم الفعلية وحسابات السنة ونطاق الوصول من Backend وقصرها على الموظفين المباشرين المصرح بهم.")}</span></div>
  </AppShell>;
}
