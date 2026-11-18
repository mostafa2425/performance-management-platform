"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ArrowUpRight, Users } from "lucide-react";

const members=[
 {id:"EMP-10561",name:"Sara Ahmed",role:"Senior UI/UX Designer",department:"Product Design",progress:92,objectives:5,status:"On track"},
 {id:"EMP-10574",name:"Omar Khaled",role:"Frontend Developer",department:"Engineering",progress:78,objectives:6,status:"On track"},
 {id:"EMP-10589",name:"Mona Ali",role:"Business Analyst",department:"Program Management",progress:61,objectives:5,status:"Needs attention"},
 {id:"EMP-10602",name:"Youssef Hassan",role:"Software Engineer",department:"Engineering",progress:86,objectives:6,status:"On track"},
 {id:"EMP-10618",name:"Nada Hany",role:"QA Engineer",department:"Quality Assurance",progress:48,objectives:4,status:"Needs attention"},
 {id:"EMP-10623",name:"Karim Adel",role:"Product Owner",department:"Product",progress:73,objectives:5,status:"On track"}
];
export default function ManagerTeamPage(){
 const ar=useLocale()==="ar";const [query,setQuery]=useState("");const [filter,setFilter]=useState("all");
 const t=(en:string,a:string)=>ar?a:en;
 const filtered=useMemo(()=>members.filter(m=>(m.name+" "+m.role+" "+m.department+" "+m.id).toLowerCase().includes(query.toLowerCase())&&(filter==="all"||(filter==="risk"?m.progress<65:m.progress>=65)),[query,filter]);
 return <AppShell role="manager" title={t("My team","فريقي")} subtitle={t("A clear view of your direct reports and their current performance progress.","نظرة واضحة على الموظفين التابعين لك ومستوى تقدم أدائهم.")}>
  <div className="team-summary-grid"><div className="team-summary-card"><Users size={18}/><strong>12</strong><span>{t("Direct reports","الموظفون المباشرون")}</span></div><div className="team-summary-card"><span className="summary-dot green"/><strong>10</strong><span>{t("On track","على المسار")}</span></div><div className="team-summary-card"><span className="summary-dot amber"/><strong>2</strong><span>{t("Need attention","تحتاج متابعة")}</span></div></div>
  <section className="panel team-directory"><div className="panel-heading"><div><h3>{t("Team directory","دليل الفريق")}</h3><p>{t("Search and review employee objective progress.","ابحث وراجع تقدم أهداف الموظفين.")}</p></div><span className="readonly-pill">{t("2026 cycle","دورة 2026")}</span></div>
   <div className="team-directory-toolbar"><label className="search-field"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search name, role or ID","ابحث بالاسم أو الوظيفة أو الرقم")}/></label><div className="team-filter"><SlidersHorizontal size={14}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t("All members","كل الموظفين")}</option><option value="risk">{t("Needs attention","تحتاج متابعة")}</option><option value="good">{t("On track","على المسار")}</option></select></div></div>
   <div className="team-table-wrap"><table className="team-table"><thead><tr><th>{t("Employee","الموظف")}</th><th>{t("Department","الإدارة")}</th><th>{t("Objectives","الأهداف")}</th><th>{t("Progress","التقدم")}</th><th>{t("Status","الحالة")}</th></tr></thead><tbody>{filtered.map((m,i)=><tr key={m.id}><td><div className="team-employee-cell"><span className={`team-avatar team-avatar-${i%4}`}>{m.name.split(" ").map(x=>x[0]).join("")}</span><div><strong>{m.name}</strong><small>{m.role} · {m.id}</small></div></div></td><td>{m.department}</td><td>{m.objectives}</td><td><div className="team-progress-cell"><div><b>{m.progress}%</b></div><div className="department-progress-track"><span className={m.progress<65?"amber":"teal"} style={{width:`${m.progress}%`}}/></div></div></td><td><span className={`manager-status ${m.progress<65?"risk":"good"}`}>{t(m.status,m.progress<65?"تحتاج متابعة":"على المسار")}</span></td></tr>)}</tbody></table>{filtered.length===0&&<div className="team-empty">{t("No employees match your search.","لا يوجد موظفون مطابقون للبحث.")}</div>}</div>
   <div className="team-table-footer"><span>{t("Showing demo records","عرض سجلات تجريبية")} · {filtered.length}</span><span>{t("Illustrative data","بيانات توضيحية")}</span></div>
  </section>
 </AppShell>;
}