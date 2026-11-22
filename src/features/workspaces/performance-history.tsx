"use client";

import { AppButton, AppInput, AppSelect } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock3, Download, FileClock, Filter, LockKeyhole, Search, ShieldCheck, UserRound, Users } from "lucide-react";

type Role="employee"|"manager"|"department"|"hcd"|"admin";
type RecordItem={id:string;name:string;employeeId:string;role:string;department:string;manager:string;year:string;cycle:string;period:string;result:string;rating:string;status:"Published"|"Finalized"|"Pending";objectives:string;competencies:string;actuals:string;achievement:string;weighted:string;comment:string;managerHistory:string};
const records:RecordItem[]=[
{id:"H-2026-014",name:"Mostafa Gamal",employeeId:"EMP-10482",role:"Senior Frontend Developer",department:"Technology",manager:"Ahmed Hassan",year:"2026",cycle:"Annual Performance Cycle",period:"Q1",result:"82%",rating:"Meets Expectations",status:"Published",objectives:"82%",competencies:"—",actuals:"84%",achievement:"102.4%",weighted:"20.5",comment:"Strong delivery consistency.",managerHistory:"Ahmed Hassan · Current Manager"},
{id:"H-2026-013",name:"Mostafa Gamal",employeeId:"EMP-10482",role:"Senior Frontend Developer",department:"Technology",manager:"Ahmed Hassan",year:"2026",cycle:"Annual Performance Cycle",period:"Q2",result:"86%",rating:"Meets Expectations",status:"Published",objectives:"86%",competencies:"—",actuals:"91%",achievement:"107.1%",weighted:"21.4",comment:"Improved quality and collaboration.",managerHistory:"Ahmed Hassan · Current Manager"},
{id:"H-2026-012",name:"Sara Ahmed",employeeId:"EMP-10561",role:"Senior UI/UX Designer",department:"Product Design",manager:"Ahmed Hassan",year:"2026",cycle:"Annual Performance Cycle",period:"Q1",result:"88%",rating:"Meets Expectations",status:"Published",objectives:"88%",competencies:"—",actuals:"92%",achievement:"104.0%",weighted:"20.8",comment:"Excellent stakeholder alignment.",managerHistory:"Ahmed Hassan · Current Manager"},
{id:"H-2025-041",name:"Mostafa Gamal",employeeId:"EMP-10482",role:"Senior Frontend Developer",department:"Technology",manager:"Mona Ibrahim",year:"2025",cycle:"Annual Performance Cycle",period:"Annual",result:"91%",rating:"Exceeds Expectations",status:"Published",objectives:"90%",competencies:"95%",actuals:"—",achievement:"—",weighted:"—",comment:"",managerHistory:"Mona Ibrahim · Previous Manager"}
];

export function PerformanceHistory({role}:{role:Role}){
 const ar=useLocale()==="ar";const translate=useTranslations("PerformanceHistory");const t=(en:string,a:string)=>ar?a:en;const [query,setQuery]=useState("");const [year,setYear]=useState("All");const [period,setPeriod]=useState("All");const [selected,setSelected]=useState("H-2026-014");
 const isEmployee=role==="employee";const canSeeDetails=!isEmployee;const source=useMemo(()=>records.filter(r=>(!isEmployee||r.employeeId==="EMP-10482")&&(role!=="department"||r.department==="Technology")&&(role!=="hcd"||true)&&(role!=="admin"||true)&&r.status==="Published"&&(year==="All"||r.year===year)&&(period==="All"||r.period===period)&&(!query||[r.name,r.employeeId,r.department,r.manager,r.id].some(x=>x.toLowerCase().includes(query.toLowerCase())))),[role,isEmployee,year,period,query]);
 const current=source.find(x=>x.id===selected)||source[0];const title={title:translate(`page.${role}.title`),sub:translate(`page.${role}.sub`)};
 const roleTitle=role==="employee"?"Employee":role==="manager"?"Manager":role==="department"?"Department Manager":role==="hcd"?"HCD":"Admin";
 return <AppShell role={role} title={t(title.title,title.ar)} subtitle={t(title.sub,title.subAr)}>
  <div className="history-banner"><div><span><FileClock size={14}/> {translate("text001")}</span><h2>{translate("text002")}</h2><p>{translate("text003")}</p></div><span className="history-role-pill"><ShieldCheck size={13}/>{roleTitle}</span></div>
  <div className="history-metrics"><article className="panel"><span>{translate("text004")}</span><strong>{source.length}</strong><small>{translate("text005")}</small></article><article className="panel"><span>{translate("text006")}</span><strong>{new Set(source.map(r=>r.year)).size}</strong><small>{translate("text007")}</small></article><article className="panel"><span>{translate("text008")}</span><strong>{source[0]?.result||"—"}</strong><small>{source[0]?.period+" · "+(source[0]?.year||"")}</small></article><article className="panel"><span>{translate("text009")}</span><strong>{translate("text010")}</strong><small>{translate("text011")}</small></article></div>
  <div className="history-layout"><section className="panel history-records"><div className="panel-heading"><div><h3>{translate("text012")}</h3><p>{translate("text013")}</p></div><span className="readonly-pill"><LockKeyhole size={12}/>{translate("text010")}</span></div>
   <div className="history-filters"><label><Search size={14}/><AppInput value={query} onChange={e=>setQuery(e.target.value)} placeholder={translate("text014")}/></label><AppSelect value={year} onChange={e=>setYear(e.target.value)}><option value="All">{translate("text015")}</option><option value="2026">2026</option><option value="2025">2025</option></AppSelect><AppSelect value={period} onChange={e=>setPeriod(e.target.value)}><option value="All">{translate("text016")}</option>{["Q1","Q2","Q3","Q4","Annual"].map(p=><option key={p}>{p}</option>)}</AppSelect></div>
   <div className="history-record-list">{source.map(r=><AppButton type="button" key={r.id} className={selected===r.id?"selected":""} onClick={()=>setSelected(r.id)}><span className="history-record-icon"><CalendarDays size={16}/></span><span className="history-record-copy"><strong>{isEmployee?r.period+" · "+r.year:r.name}</strong><small>{isEmployee?r.cycle:r.employeeId+" · "+r.department}</small><small>{r.period} · {r.year} · {r.id}</small></span><span className="history-record-score"><strong>{r.result}</strong><small>{r.status}</small></span></AppButton>)}
   {source.length===0&&<div className="history-empty"><Filter size={20}/><strong>{translate("text017")}</strong><small>{translate("text018")}</small></div>}</div>
  </section>
  <section className="panel history-detail"><div className="panel-heading"><div><h3>{translate("text019")}</h3><p>{translate("text020")}</p></div><span className="history-published"><CheckCircle2 size={12}/>{translate("text021")}</span></div>
   {current?<><div className="history-person"><span className="history-avatar"><UserRound size={19}/></span><div><strong>{isEmployee?translate("text022"):current.name}</strong><small>{current.employeeId} · {current.role}</small><small>{current.department} · {current.manager}</small></div></div>
   <div className="history-result-hero"><span>{translate("text023")}</span><strong>{current.result}</strong><small>{current.period} · {current.year} · {current.rating}</small></div>
   <div className="history-result-grid"><div><span>{translate("text024")}</span><strong>{current.objectives}</strong></div><div><span>{translate("text025")}</span><strong>{current.competencies}</strong></div></div>
   {canSeeDetails?<><div className="history-detail-section"><h4>{translate("text026")}</h4><div className="history-detail-grid"><div><span>{translate("text027")}</span><strong>{current.actuals}</strong></div><div><span>{translate("text028")}</span><strong>{current.achievement}</strong></div><div><span>{translate("text029")}</span><strong>{current.weighted}</strong></div></div><p>{translate("text030")}: {current.comment||translate("text031")}</p></div><div className="history-manager-record"><Users size={14}/><span>{translate("text032")}: {current.managerHistory}</span></div><div className="history-manager-record"><Activity size={14}/><span>{translate("text033")}: {translate("text034")}</span></div></>:<div className="history-employee-privacy"><LockKeyhole size={15}/>{translate("text035")}</div>}
   <div className="history-readonly-note"><LockKeyhole size={13}/>{translate("text036")}</div>
   </>:<div className="history-empty"><Clock3 size={20}/>{translate("text037")}</div>}
  </section></div>
  <div className="admin-demo-note"><FileClock size={14}/><span>{translate("text038")}</span></div>
 </AppShell>;
}
