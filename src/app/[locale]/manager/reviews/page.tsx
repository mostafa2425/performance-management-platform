"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileCheck2, Search } from "lucide-react";

const items=[
 {name:"Mona Ali",id:"EMP-10589",type:"Objective plan review",detail:"Program Management · 5 objectives",due:"Today",priority:"High"},
 {name:"Nada Hany",id:"EMP-10618",type:"Progress update",detail:"Quality Assurance · Sprint delivery",due:"Tomorrow",priority:"Normal"},
 {name:"Omar Khaled",id:"EMP-10574",type:"Quarterly check-in",detail:"Engineering · Q4 progress",due:"Nov 22",priority:"Normal"},
 {name:"Sara Ahmed",id:"EMP-10561",type:"Objective weight confirmation",detail:"Product Design · Annual objectives",due:"Nov 24",priority:"Low"}
];
export default function ManagerReviewsPage(){
 const ar=useLocale()==="ar";const [query,setQuery]=useState("");const [status,setStatus]=useState("pending");const t=(en:string,a:string)=>ar?a:en;
 const visible=useMemo(()=>items.filter(x=>(x.name+" "+x.type+" "+x.detail).toLowerCase().includes(query.toLowerCase())&&(status==="all"||status==="pending")),[query,status]);
 return <AppShell role="manager" title={t("Review queue","قائمة المراجعات")} subtitle={t("Keep decisions moving with a prioritized view of reviews awaiting your input.","تابع القرارات من خلال قائمة مرتبة للمراجعات التي تنتظر إجراءك.")}>
  <div className="team-summary-grid"><div className="team-summary-card"><Clock3 size={18}/><strong>4</strong><span>{t("Pending reviews","مراجعات معلقة")}</span></div><div className="team-summary-card"><span className="summary-dot amber"/><strong>1</strong><span>{t("Due today","مستحقة اليوم")}</span></div><div className="team-summary-card"><CheckCircle2 size={18}/><strong>8</strong><span>{t("Completed this month","مكتملة هذا الشهر")}</span></div></div>
  <section className="panel team-directory"><div className="panel-heading"><div><h3>{t("Items awaiting your review","عناصر بانتظار مراجعتك")}</h3><p>{t("Prioritized tasks for the active performance cycle.","المهام ذات الأولوية خلال دورة الأداء الحالية.")}</p></div><span className="readonly-pill">{t("Demo queue","قائمة تجريبية")}</span></div>
   <div className="team-directory-toolbar"><label className="search-field"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Search reviews or employees","ابحث في المراجعات أو الموظفين")}/></label><div className="team-filter"><FileCheck2 size={14}/><select value={status} onChange={e=>setStatus(e.target.value)}><option value="pending">{t("Pending only","المعلقة فقط")}</option><option value="all">{t("All statuses","كل الحالات")}</option></select></div></div>
   <div className="manager-queue-list">{visible.map((item,i)=><article className="manager-queue-item" key={item.id+item.type}><span className={`queue-priority ${item.priority.toLowerCase()}`}/><div className="queue-item-main"><strong>{item.type}</strong><small>{item.name} · {item.id}</small><span>{item.detail}</span></div><div className="queue-item-due"><b>{item.due}</b><small>{t("Due date","تاريخ الاستحقاق")}</small></div><span className="manager-status risk">{t("Pending","معلق")}</span></article>)}</div>
   {visible.length===0&&<div className="team-empty">{t("No matching review items.","لا توجد مراجعات مطابقة.")}</div>}
  </section>
 </AppShell>;
}