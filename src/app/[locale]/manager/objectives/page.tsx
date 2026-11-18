"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Search, Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const data=[
 {id:"OBJ-01",title:"Improve customer onboarding experience",owner:"Sara Ahmed",category:"Customer Experience",weight:25,progress:92,status:"On track",kpis:3},
 {id:"OBJ-02",title:"Deliver platform modernization roadmap",owner:"Omar Khaled",category:"Engineering",weight:30,progress:78,status:"On track",kpis:4},
 {id:"OBJ-03",title:"Optimize operational reporting cycle",owner:"Mona Ali",category:"Operational Excellence",weight:20,progress:61,status:"At risk",kpis:3},
 {id:"OBJ-04",title:"Improve release quality and stability",owner:"Youssef Hassan",category:"Quality",weight:15,progress:86,status:"On track",kpis:2},
 {id:"OBJ-05",title:"Strengthen test automation coverage",owner:"Nada Hany",category:"Quality",weight:10,progress:48,status:"At risk",kpis:3}
];
export default function ManagerObjectivesPage(){
 const ar=useLocale()==="ar";const [query,setQuery]=useState("");const [filter,setFilter]=useState("all");const t=(e:string,a:string)=>ar?a:e;
 const rows=useMemo(()=>data.filter(x=>(x.title+" "+x.owner+" "+x.category).toLowerCase().includes(query.toLowerCase())&&(filter==="all"||(filter==="risk"?x.progress<65:x.progress>=65))),[query,filter]);
 return <AppShell role="manager" title={t("Team objectives","أهداف الفريق")} subtitle={t("Monitor objective alignment, ownership and progress across your team.","تابع توافق الأهداف والمسؤوليات ومستوى التقدم لدى فريقك.")}>
  <div className="team-summary-grid"><div className="team-summary-card"><Target size={18}/><strong>26</strong><span>{t("Active objectives","الأهداف النشطة")}</span></div><div className="team-summary-card"><TrendingUp size={18}/><strong>81%</strong><span>{t("Average progress","متوسط التقدم")}</span></div><div className="team-summary-card"><AlertCircle size={18}/><strong>3</strong><span>{t("Need attention","تحتاج متابعة")}</span></div></div>
  <section className="panel team-directory"><div className="panel-heading"><div><h3>{t("Objective portfolio","محفظة الأهداف")}</h3><p>{t("Illustrative objectives for the 2026 performance cycle.","أهداف توضيحية لدورة الأداء 2026.")}</p></div><span className="readonly-pill">{t("2026 cycle","دورة 2026")}</span></div>
   <div className="team-directory-toolbar"><label className="search-field"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search objectives or owners","ابحث عن الأهداف أو المسؤولين")}/></label><div className="team-filter"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t("All objectives","كل الأهداف")}</option><option value="risk">{t("At risk","تحتاج متابعة")}</option><option value="good">{t("On track","على المسار")}</option></select></div></div>
   <div className="manager-objective-list">{rows.map(x=><article className="manager-objective-row" key={x.id}><span className="objective-icon"><Target size={17}/></span><div className="objective-main"><div className="objective-title-line"><strong>{x.title}</strong><span>{x.id}</span></div><small>{x.owner} · {x.category}</small><div className="objective-progress"><div className="department-progress-track"><span className={x.progress<65?"amber":"teal"} style={{width:x.progress+"%"}}/></div><b>{x.progress}%</b></div></div><div className="objective-side"><strong>{x.weight}%</strong><small>{t("Weight","الوزن")}</small><span className={`manager-status ${x.progress<65?"risk":"good"}`}>{t(x.status,x.progress<65?"تحتاج متابعة":"على المسار")}</span></div></article>)}</div>
   {rows.length===0&&<div className="team-empty">{t("No matching objectives.","لا توجد أهداف مطابقة.")}</div>}
   <div className="team-table-footer"><span>{t("Showing","عرض")} {rows.length} {t("of 26 objectives","من 26 هدفاً")}</span><span>{t("Mock data · Read only","بيانات تجريبية · للعرض فقط")}</span></div>
  </section>
  <div className="admin-demo-note"><CheckCircle2 size={15}/><span>{t("Objective weights and progress are illustrative. Editing, approval and KPI actual submission will be enabled after backend integration.","الأوزان ونسب التقدم توضيحية. سيتم تفعيل التعديل والاعتماد وإدخال النتائج الفعلية بعد ربط Backend.")}</span></div>
 </AppShell>;
}