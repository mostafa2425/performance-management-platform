"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { Activity, ArrowUpRight, BarChart3, Building2, CheckCircle2, ClipboardList, Users } from "lucide-react";

type Role="department"|"hcd";
const content={
 department:{title:"Department overview",titleAr:"نظرة عامة على الإدارة",subtitle:"Monitor performance across teams within your department.",subtitleAr:"تابع الأداء عبر الفرق التابعة لإدارتك.",stats:[["8","Teams","الفرق"],["124","Employees","الموظفون"],["81%","Objective progress","تقدم الأهداف"],["14","Follow-ups","متابعات"]],sections:[["Team alignment","مواءمة الفرق","Review how team objectives align with department priorities."],["Performance health","مؤشرات الأداء","Identify teams that may need support or additional attention."],["Department reporting","تقارير الإدارة","Compare progress and participation across your department."]]},
 hcd:{title:"HCD workspace",titleAr:"مساحة تطوير رأس المال البشري",subtitle:"Govern the performance framework, cycle configuration and organization-wide outcomes.",subtitleAr:"أدر إطار الأداء وإعداد الدورات والنتائج على مستوى المؤسسة.",stats:[["3","Active cycles","الدورات النشطة"],["92%","Template coverage","تغطية القوالب"],["52","Pending reviews","مراجعات معلقة"],["4","Governance tasks","مهام الحوكمة"]],sections:[["Cycle governance","حوكمة الدورات","Configure cycle rules, milestones and organization-wide deadlines."],["Competency framework","إطار الكفاءات","Maintain competency templates and job-family alignment."],["Calibration & insights","المعايرة والمؤشرات","Review calibration readiness and final performance distribution."]]}
};
export function RoleOverview({role}:{role:Role}){
 const ar=useLocale()==="ar";const d=content[role];const t=(en:string,a:string)=>ar?a:en;
 const icons=[Users,Activity,ClipboardList,BarChart3];
 return <AppShell role={role} title={t(d.title,d.titleAr)} subtitle={t(d.subtitle,d.subtitleAr)}>
  <section className="role-overview-banner"><span>{role==="hcd"?"HUMAN CAPITAL DEVELOPMENT":"DEPARTMENT LEADERSHIP"}</span><h2>{t(role==="hcd"?"Shape a consistent performance culture.":"Turn department goals into team impact.", "حوّل أهداف المؤسسة إلى نتائج ملموسة.")}</h2><p>{t("This workspace uses illustrative data while backend services are being prepared.","تعرض هذه المساحة بيانات توضيحية لحين تجهيز خدمات Backend.")}</p></section>
  <section className="admin-metric-grid">{d.stats.map((s,i)=>{const Icon=icons[i];return <article className="admin-metric" key={s[1]}><div className="admin-metric-head"><span className={`admin-metric-icon ${["blue","teal","violet","amber"][i]}`}><Icon size={18}/></span></div><strong>{s[0]}</strong><span>{t(s[1],s[2])}</span><small>{t("Illustrative snapshot","بيانات توضيحية")}</small></article>})}</section>
  <section className="panel role-overview-panel"><div className="panel-heading"><div><h3>{t("Workspace priorities","أولويات مساحة العمل")}</h3><p>{t("Key areas available for this role","المجالات الرئيسية المتاحة لهذا الدور")}</p></div></div>{d.sections.map((s,i)=><div className="role-overview-row" key={s[0]}><span className="admin-record-icon">{i===0?<Building2 size={17}/>:i===1?<CheckCircle2 size={17}/>:<ArrowUpRight size={17}/>}</span><div><strong>{t(s[0],s[1])}</strong><small>{t(s[2],["راجع مدى توافق أهداف الفرق مع أولويات الإدارة.","حدد الفرق التي تحتاج إلى دعم أو متابعة إضافية.","قارن التقدم ومستوى المشاركة عبر الإدارة."][i])}</small></div></div>)}</section>
 </AppShell>
}