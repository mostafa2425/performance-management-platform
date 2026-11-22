"use client";

import { AppButton, AppInput, AppSelect, AppCheckbox, AppTable, AppDetails } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, Check, Eye, Plus, Search, ShieldCheck, Users } from "lucide-react";

type Frequency = "Quarterly" | "Semi-Annual" | "Annual";
type Status = "Draft" | "Active" | "Closed";
type Stage = { key: string; en: string; ar: string; deadline: string };
type Cycle = { id: string; nameEn: string; nameAr: string; year: number; frequency: Frequency; start: string; end: string; status: Status; employees: number; managers: number; departments: number; jobTitles: number };
type Person = { id: string; name: string; title: string; department: string; manager: string; serviceMonths: number; activeCycle?: string };
const people: Person[] = [
 {id:"EMP-10561",name:"Sara Ahmed",title:"HR Specialist",department:"Human Resources",manager:"Hany Adel",serviceMonths:38},
 {id:"EMP-10574",name:"Omar Khaled",title:"Frontend Developer",department:"Technology",manager:"Mostafa Gamal",serviceMonths:29},
 {id:"EMP-10589",name:"Mona Ali",title:"Project Manager",department:"Program Management",manager:"Hany Adel",serviceMonths:4},
 {id:"EMP-10602",name:"Youssef Hassan",title:"Software Engineer",department:"Technology",manager:"Mostafa Gamal",serviceMonths:16},
 {id:"EMP-10618",name:"Nada Hany",title:"QA Engineer",department:"Technology",manager:"Mostafa Gamal",serviceMonths:7},
 {id:"EMP-10623",name:"Karim Adel",title:"Financial Analyst",department:"Finance & Operations",manager:"Hany Adel",serviceMonths:44},
 {id:"EMP-10635",name:"Laila Samir",title:"HR Specialist",department:"Human Resources",manager:"Hany Adel",serviceMonths:11,activeCycle:"2026 Annual Performance Cycle"}
];
const initialStages = (): Stage[] => [
 {key:"goal",en:"Objective Setting & Approval",ar:"إعداد الأهداف واعتمادها",deadline:"2026-02-15"},
 {key:"employee",en:"Employee Review",ar:"مراجعة الموظف",deadline:"2026-03-01"},
 {key:"active",en:"Active Performance",ar:"فترة الأداء الفعلي",deadline:"2026-11-30"},
 {key:"manager",en:"Manager Evaluation",ar:"تقييم المدير",deadline:"2026-12-15"},
 {key:"admin",en:"Admin Final Review",ar:"المراجعة النهائية للإدارة",deadline:"2026-12-30"}
];
const seedCycles: Cycle[] = [
 {id:"CYC-2026-01",nameEn:"2026 Annual Performance Cycle",nameAr:"دورة الأداء السنوية 2026",year:2026,frequency:"Quarterly",start:"2026-01-01",end:"2026-12-31",status:"Active",employees:470,managers:42,departments:8,jobTitles:36},
 {id:"CYC-2025-01",nameEn:"2025 Annual Performance Cycle",nameAr:"دورة الأداء السنوية 2025",year:2025,frequency:"Annual",start:"2025-01-01",end:"2025-12-31",status:"Closed",employees:438,managers:39,departments:8,jobTitles:34},
 {id:"CYC-2026-02",nameEn:"2026 Mid-Year Check-in",nameAr:"مراجعة منتصف العام 2026",year:2026,frequency:"Semi-Annual",start:"2026-07-01",end:"2027-06-30",status:"Draft",employees:0,managers:0,departments:0,jobTitles:0}
];
const addYear = (date: string) => { const d = new Date(date+"T12:00:00"); d.setFullYear(d.getFullYear()+1); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); };
const addDays = (date: string, days: number) => { const d = new Date(date+"T12:00:00"); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
const dayDifference = (from: string, to: string) => Math.round((new Date(to+"T12:00:00").getTime()-new Date(from+"T12:00:00").getTime())/86400000);
const periodsFor = (start: string, frequency: Frequency) => {
 const count = frequency==="Quarterly"?4:frequency==="Semi-Annual"?2:1;
 const months = frequency==="Quarterly"?3:frequency==="Semi-Annual"?6:12;
 return Array.from({length:count},(_,i)=>{const d=new Date(start+"T12:00:00");d.setMonth(d.getMonth()+i*months);const s=d.toISOString().slice(0,10);const e=new Date(d);e.setMonth(e.getMonth()+months);e.setDate(e.getDate()-1);return {name:frequency==="Quarterly"?"Q"+(i+1):frequency==="Semi-Annual"?"H"+(i+1):"Annual",start:s,end:e.toISOString().slice(0,10)};});
};

export default function PerformanceCycleWorkspace({ mode, cycleId }: { mode: "list"|"create"|"detail"|"edit"; cycleId?: string }) {
 const ar=useLocale()==="ar"; const t=(en:string,arabic:string)=>ar?arabic:en; const translate=useTranslations("PerformanceCycles");
 const [cycles,setCycles]=useState(seedCycles);
 const [search,setSearch]=useState(""); const [status,setStatus]=useState("All"); const [frequencyFilter,setFrequencyFilter]=useState("All"); const [yearFilter,setYearFilter]=useState("All");
 const [nameEn,setNameEn]=useState(""); const [nameAr,setNameAr]=useState(""); const [frequency,setFrequency]=useState<Frequency>("Quarterly"); const [start,setStart]=useState("2026-01-01");
 const [departments,setDepartments]=useState<string[]>([]); const [titles,setTitles]=useState<string[]>([]); const [individuals,setIndividuals]=useState<string[]>([]); const [excluded,setExcluded]=useState<string[]>([]); const [exceptions,setExceptions]=useState<string[]>([]);
 const [stages,setStages]=useState<Stage[]>(initialStages()); const [saved,setSaved]=useState(false); const [error,setError]=useState("");
 const [manualIncluded,setManualIncluded]=useState<string[]>([]);
 const [editDates,setEditDates]=useState<string[]>([]); const [editSaved,setEditSaved]=useState(false); const [editError,setEditError]=useState(""); const [audit,setAudit]=useState<{stage:string;oldValue:string;newValue:string;user:string;at:string}[]>([]);
 const end=useMemo(()=>start?addYear(start):"",[start]); const periods=useMemo(()=>start?periodsFor(start,frequency):[],[start,frequency]);
 const included=useMemo(()=>{const ids=new Set<string>();people.forEach(p=>{if(departments.includes(p.department)||titles.includes(p.title)||individuals.includes(p.id))ids.add(p.id);});excluded.forEach(id=>ids.delete(id));exceptions.forEach(id=>ids.add(id));return people.filter(p=>ids.has(p.id)&&(!p.activeCycle)&&(p.serviceMonths>=6||exceptions.includes(p.id)));},[departments,titles,individuals,excluded,exceptions]);
 const managerCount=new Set(included.map(p=>p.manager)).size;
 const list=cycles.filter(c=>(c.nameEn+" "+c.nameAr).toLowerCase().includes(search.toLowerCase())&&(status==="All"||c.status===status)&&(frequencyFilter==="All"||c.frequency===frequencyFilter)&&(yearFilter==="All"||String(c.year)===yearFilter));
 const detail=cycles.find(c=>c.id===cycleId)??cycles[0];
 const detailPeriods=periodsFor(detail.start,detail.frequency);
 const today=new Date().toISOString().slice(0,10);
 const activePeriodIndex=Math.max(0,detailPeriods.findIndex(p=>today>=p.start&&today<=p.end));
 const editPeriod=detailPeriods[detail.status==="Active"?activePeriodIndex:0]??detailPeriods[0];
 const stageLabels=[{en:"Objective Setting & Approval",ar:"إعداد الأهداف واعتمادها"},{en:"Employee Review",ar:"مراجعة الموظف"},{en:"Active Performance",ar:"فترة الأداء الفعلي"},{en:"Manager Evaluation",ar:"تقييم المدير"},{en:"Admin Final Review",ar:"المراجعة النهائية للإدارة"}];
 const defaultEditDates=editPeriod?[10,20,50,75,90].map(day=>addDays(editPeriod.start,day-1)):[];
 const lockedStages=detail.status==="Active"?defaultEditDates.map(d=>d<today):[false,false,false,false,false];
 const toggle=(items:string[],set:(v:string[])=>void,value:string)=>set(items.includes(value)?items.filter(x=>x!==value):[...items,value]);
 const validate=()=>{
  if(!nameEn.trim()||!nameAr.trim()||!start){setError(translate("text001"));return false;}
  if(!included.length){setError(translate("text002"));return false;}
  if(stages.some(s=>!s.deadline)){setError(translate("text003"));return false;}
  const first=periods[0];const dates=stages.map(s=>s.deadline);
  if(dates.some(d=>d<first.start||d>first.end)){setError(translate("text004"));return false;}
  if(dates.some((d,i)=>i>0&&d<dates[i-1])){setError(translate("text005"));return false;}
  setError("");return true;
 };
 const create=(activate:boolean)=>{
  if(!validate())return;
  const id="CYC-"+new Date().getFullYear()+"-"+String(cycles.length+1).padStart(2,"0");
  setCycles(v=>[{id,nameEn,nameAr,year:Number(start.slice(0,4)),frequency,start,end,status:activate?"Active":"Draft",employees:included.length,managers:managerCount,departments:new Set(included.map(p=>p.department)).size,jobTitles:new Set(included.map(p=>p.title)).size},...v]);
  setSaved(true);
 };
 if(mode==="create") return <AppShell role="admin" title={translate("text006")} subtitle={translate("text007")}>
  <div className="cycle-workspace-top"><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><ArrowLeft size={15}/>{translate("text008")}</Link><span className="cycle-demo-label">{translate("text009")}</span></div>
  {saved?<section className="panel cycle-success"><Check size={22}/><h2>{translate("text010")}</h2><p>{translate("text011")}</p><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}>{translate("text012")}</Link></section>:<>
  <div className="cycle-form-grid">
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span>01</span><div><h3>{translate("text013")}</h3><p>{translate("text014")}</p></div></div>
    <div className="cycle-fields two"><label>{translate("text015")}<AppInput value={nameEn} onChange={e=>setNameEn(e.target.value)} placeholder="2027 Annual Performance Cycle"/></label><label>{translate("text016")}<AppInput value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="دورة الأداء السنوية 2027"/></label></div>
    <div className="cycle-fields three"><label>{translate("text017")}<AppInput readOnly value={start.slice(0,4)}/></label><label>{translate("text018")}<AppSelect value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)}><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></AppSelect></label><label>{translate("text019")}<AppInput type="date" value={start} onChange={e=>{const next=e.target.value;const shift=dayDifference(start,next);setStart(next);setStages(v=>v.map(s=>({...s,deadline:addDays(s.deadline,shift)})));}}/></label></div>
    <div className="cycle-readonly-end"><CalendarDays size={17}/><div><small>{translate("text020")}</small><strong>{end}</strong></div><span>{translate("text021")}</span></div>
   </section>
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span>02</span><div><h3>{translate("text022")}</h3><p>{translate("text023")}</p></div></div>
    <div className="cycle-scope-block"><strong>{translate("text024")}</strong><div className="cycle-check-grid">{["Technology","Human Resources","Finance & Operations","Program Management"].map(x=><label key={x}><AppCheckbox type="checkbox" checked={departments.includes(x)} onChange={()=>toggle(departments,setDepartments,x)}/>{x}</label>)}</div></div>
    <div className="cycle-scope-block"><strong>{translate("text025")}</strong><div className="cycle-check-grid">{["Frontend Developer","Software Engineer","QA Engineer","HR Specialist","Project Manager","Financial Analyst"].map(x=><label key={x}><AppCheckbox type="checkbox" checked={titles.includes(x)} onChange={()=>toggle(titles,setTitles,x)}/>{x}</label>)}</div></div>
    <div className="cycle-scope-block"><strong>{translate("text026")}</strong><div className="cycle-people-list">{people.map(p=>{const active=!!p.activeCycle;const short=p.serviceMonths<6;return <label key={p.id} className={active?"disabled":""}><AppCheckbox type="checkbox" disabled={active} checked={individuals.includes(p.id)||exceptions.includes(p.id)} onChange={()=>toggle(individuals,setIndividuals,p.id)}/><span><b>{p.name}</b><small>{p.id} · {p.title} · {p.department}</small></span>{active?<em>{translate("text027")}</em>:short?<em>{translate("text028")}</em>:null}</label>})}</div></div>
    <div className="cycle-scope-summary"><strong>{included.length}</strong><span>{translate("text029")}</span><strong>{managerCount}</strong><span>{translate("text030")}</span></div>
    <div className="cycle-scope-preview"><strong>{translate("text031")}</strong>{included.length?included.map(p=><div key={p.id}><span><b>{p.name}</b><small>{p.id} · {p.department} · {p.manager}</small></span><AppButton type="button" onClick={()=>toggle(excluded,setExcluded,p.id)}>{excluded.includes(p.id)?translate("text032"):translate("text033")}</AppButton></div>):<small>{translate("text034")}</small>}</div>
   </section>
   <section className="panel cycle-form-panel cycle-span-two"><div className="cycle-section-head"><span>03</span><div><h3>{translate("text035")}</h3><p>{translate("text036")}</p></div></div>
    {people.filter(p=>p.serviceMonths<6).map(p=><label className="cycle-exception" key={p.id}><span><b>{p.name}</b><small>{p.id} · {p.serviceMonths} {translate("text037")}</small></span><span>{translate("text038")}</span><AppCheckbox type="checkbox" checked={exceptions.includes(p.id)} onChange={()=>toggle(exceptions,setExceptions,p.id)}/></label>)}
    <p className="cycle-inline-warning"><AlertTriangle size={14}/>{translate("text039")}</p>
   </section>
   <section className="panel cycle-form-panel cycle-span-two"><div className="cycle-section-head"><span>04</span><div><h3>{translate("text040")}</h3><p>{translate("text041")}</p></div></div>
    <div className="cycle-stage-grid">{stages.map((s,i)=><label key={s.key}><span className="cycle-stage-number">{i+1}</span><b>{t(s.en,s.ar)}</b><AppInput type="date" value={s.deadline} min={periods[0]?.start} max={periods[0]?.end} onChange={e=>setStages(v=>v.map(x=>x.key===s.key?{...x,deadline:e.target.value}:x))}/></label>)}</div>
    <div className="cycle-period-preview"><h4>{translate("text042")}</h4>{periods.map((p,i)=><article key={p.name}><strong>{p.name}</strong><span>{p.start} — {p.end}</span><small>{i===0?stages.map(s=>s.deadline).join(" · "):stages.map(s=>addDays(s.deadline,dayDifference(periods[0].start,p.start))).join(" · ")}</small></article>)}</div>
   </section>
  </div>
  {error&&<p className="cycle-error"><AlertTriangle size={15}/>{error}</p>}
  <div className="cycle-form-actions"><span>{translate("text043")}</span><AppButton className="cycle-secondary" onClick={()=>create(false)}>{translate("text044")}</AppButton><AppButton className="cycle-primary" onClick={()=>create(true)}><ShieldCheck size={15}/>{translate("text045")}</AppButton></div>
  </>}
 </AppShell>;
 if(mode==="edit") return <AppShell role="admin" title={translate("text046")} subtitle={ar?detail.nameAr:detail.nameEn}>
  <div className="cycle-workspace-top"><Link href={`/${ar?"ar":"en"}/admin/performance-cycles/${detail.id}`}><ArrowLeft size={15}/>{translate("text047")}</Link><span className={`cycle-status ${detail.status.toLowerCase()}`}>{detail.status}</span></div>
  {detail.status==="Closed"?<section className="panel cycle-form-panel"><p className="cycle-inline-warning"><AlertTriangle size={14}/>{translate("text048")}</p></section>:<>
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><CalendarDays size={17}/></span><div><h3>{translate("text049")}</h3><p>{translate("text050")}: <b>{editPeriod?.name}</b> · {editPeriod?.start} — {editPeriod?.end}</p></div></div>
    <div className="cycle-edit-deadlines">{stageLabels.map((s,i)=>{const locked=lockedStages[i];const value=editDates[i]??defaultEditDates[i];return <label key={i} className={locked?"locked":""}><span className="cycle-stage-number">{i+1}</span><span><b>{t(s.en,s.ar)}</b><small>{locked?translate("text051"):detail.status==="Draft"?translate("text052"):translate("text053")}</small></span><AppInput type="date" value={value??""} min={editPeriod?.start} max={editPeriod?.end} disabled={locked} onChange={e=>setEditDates(v=>{const next=[...v];next[i]=e.target.value;return next;})}/></label>})}</div>
    <p className="cycle-inline-warning"><AlertTriangle size={14}/>{translate("text054")}</p>
    {editError&&<p className="cycle-error"><AlertTriangle size={15}/>{editError}</p>}
    <div className="cycle-form-actions"><span>{translate("text055")}</span><AppButton className="cycle-secondary" onClick={()=>{setEditDates([]);setEditError("");setEditSaved(false);}}>{translate("text056")}</AppButton><AppButton className="cycle-primary" onClick={()=>{const values=stageLabels.map((_,i)=>editDates[i]??defaultEditDates[i]);if(values.some((d,i)=>!d||d<detail.start||d>detail.end||d<editPeriod.start||d>editPeriod.end)){setEditError(translate("text057"));return;}if(values.some((d,i)=>i>0&&d<values[i-1])){setEditError(translate("text058"));return;}const changes=stageLabels.flatMap((s,i)=>!lockedStages[i]&&values[i]!==defaultEditDates[i]?[{stage:s.en,oldValue:defaultEditDates[i],newValue:values[i],user:"Admin",at:new Date().toISOString()}]:[]);setAudit(v=>[...v,...changes]);setEditSaved(true);setEditError("");}}>{translate("text059")}</AppButton></div>
    {editSaved&&<p className="cycle-save-confirm"><Check size={15}/>{translate("text060")}</p>}
   </section>
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><ShieldCheck size={17}/></span><div><h3>{translate("text061")}</h3><p>{translate("text062")}</p></div></div>{audit.length?<div className="cycle-audit-list">{audit.map((a,i)=><div key={i}><b>{t(a.stage,a.stage)}</b><span>{a.oldValue} → {a.newValue}</span><small>{a.user} · {new Date(a.at).toLocaleString()}</small></div>)}</div>:<p className="cycle-empty">{translate("text063")}</p>}</section>
  </>}
 </AppShell>;
 if(mode==="detail") return <AppShell role="admin" title={ar?detail.nameAr:detail.nameEn} subtitle={translate("text064")}>
  <div className="cycle-workspace-top"><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><ArrowLeft size={15}/>{translate("text008")}</Link><span className={`cycle-status ${detail.status.toLowerCase()}`}>{detail.status}</span></div>
  {detail.status!=="Closed"&&<div className="cycle-edit-link-row"><Link className="cycle-primary" href={`/${ar?"ar":"en"}/admin/performance-cycles/${detail.id}/edit`}>{translate("text065")}</Link></div>}
  <section className="cycle-detail-stats"><article><small>{translate("text017")}</small><strong>{detail.year}</strong></article><article><small>{translate("text066")}</small><strong>{detail.frequency}</strong></article><article><small>{translate("text067")}</small><strong>{detail.employees}</strong></article><article><small>{translate("text068")}</small><strong>{detail.managers}</strong></article></section>
  <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><CalendarDays size={17}/></span><div><h3>{translate("text013")}</h3><p>{detail.start} — {detail.end}</p></div></div><div className="cycle-period-preview">{detailPeriods.map(p=><article key={p.name}><strong>{p.name}</strong><span>{p.start} — {p.end}</span><small>{translate("text069")}</small></article>)}</div></section>
  <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><Users size={17}/></span><div><h3>{translate("text070")}</h3><p>{translate("text071")}</p></div></div>
   <div className="cycle-roster-summary"><span><b>{Math.max(0,5+manualIncluded.length)}</b>{translate("text072")}</span><span><b>{people.filter(p=>p.activeCycle||(p.serviceMonths<6&&!manualIncluded.includes(p.id))).length}</b>{translate("text073")}</span><span><b>{detailPeriods.length}</b>{translate("text074")}</span></div>
   <div className="cycle-manager-groups">{["Mostafa Gamal","Hany Adel"].map(manager=>{const roster=people.filter(p=>p.manager===manager&&((p.serviceMonths>=6&&!p.activeCycle)||manualIncluded.includes(p.id)));return <AppDetails className="cycle-manager-group" key={manager} open><summary><span><b>{manager}</b><small>{translate("text075")}</small></span><strong>{roster.length} {translate("text076")}</strong></summary><div className="cycle-roster-table-wrap"><AppTable className="cycle-roster-table"><thead><tr><th>{translate("text077")}</th><th>{translate("text078")}</th>{detailPeriods.map(p=><th key={p.name}>{p.name}</th>)}</tr></thead><tbody>{roster.map((p,idx)=><tr key={p.id}><td><b>{p.name}</b><small>{p.id}</small></td><td>{p.department}<small>{p.title}</small></td>{detailPeriods.map((period,i)=>{const completed=detail.status==="Closed"||i<Math.max(1,detailPeriods.length-1);const state=detail.status==="Closed"?"Completed":i===detailPeriods.length-1?"In progress":idx%3===0?"Approved":idx%3===1?"Under review":"Completed";return <td key={period.name}><span className={`cycle-period-state ${state.toLowerCase().replaceAll(" ","-")}`}>{t(state,state==="Completed"?"مكتملة":state==="Approved"?"معتمدة":state==="Under review"?"قيد المراجعة":"قيد التنفيذ")}</span>{completed&&<small>{translate("text021")}</small>}</td>})}</tr>)}</tbody></AppTable></div></AppDetails>})}</div>
   <div className="cycle-excluded-list"><div className="cycle-excluded-heading"><b>{translate("text079")}</b><small>{translate("text080")}</small></div>{people.filter(p=>p.activeCycle||(p.serviceMonths<6&&!manualIncluded.includes(p.id))).map(p=><div className="cycle-excluded-person" key={p.id}><span><b>{p.name}</b><small>{p.id} · {p.manager}</small></span><span className="cycle-exclusion-reason">{p.activeCycle?translate("text081"):p.serviceMonths<6?translate("text082"):translate("text083")}</span>{p.serviceMonths<6&&!p.activeCycle&&!manualIncluded.includes(p.id)?<AppButton type="button" onClick={()=>setManualIncluded(v=>[...v,p.id])}>{translate("text084")}</AppButton>:manualIncluded.includes(p.id)?<span className="cycle-manual-added">{translate("text085")}</span>:null}</div>)}</div>
   <p className="cycle-inline-warning"><AlertTriangle size={14}/>{translate("text086")}</p>
  </section>
 </AppShell>;
 return <AppShell role="admin" title={translate("text087")} subtitle={translate("text088")}>
  <div className="cycle-list-toolbar"><div className="cycle-search"><Search size={16}/><AppInput value={search} onChange={e=>setSearch(e.target.value)} placeholder={translate("text089")}/></div><AppSelect aria-label={translate("text017")} value={yearFilter} onChange={e=>setYearFilter(e.target.value)}><option value="All">{translate("text090")}</option>{Array.from(new Set(cycles.map(c=>c.year))).sort((a,b)=>b-a).map(y=><option key={y} value={String(y)}>{y}</option>)}</AppSelect><AppSelect aria-label={translate("text066")} value={frequencyFilter} onChange={e=>setFrequencyFilter(e.target.value)}><option value="All">{translate("text091")}</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></AppSelect><AppSelect aria-label={translate("text092")} value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Draft</option><option>Active</option><option>Closed</option></AppSelect><Link className="cycle-primary" href={`/${ar?"ar":"en"}/admin/performance-cycles/new`}><Plus size={15}/>{translate("text093")}</Link></div>
  <div className="cycle-list-summary"><article><span>{translate("text094")}</span><strong>{cycles.length}</strong></article><article><span>{translate("text095")}</span><strong>{cycles.filter(c=>c.status==="Active").length}</strong></article><article><span>{translate("text096")}</span><strong>{cycles.filter(c=>c.status==="Draft").length}</strong></article><article><span>{translate("text097")}</span><strong>{cycles.filter(c=>c.status==="Closed").length}</strong></article></div>
  <section className="panel cycle-list-panel"><div className="panel-heading"><div><h3>{translate("text098")}</h3><p>{translate("text099")}</p></div><span className="readonly-pill">{translate("text100")}</span></div>
   {list.length?<div className="cycle-table-wrap"><AppTable className="cycle-table"><thead><tr><th>{translate("text101")}</th><th>{translate("text102")}</th><th>{translate("text025")}</th><th>{translate("text103")}</th><th>{translate("text104")}</th><th>{translate("text092")}</th><th>{translate("text105")}</th></tr></thead><tbody>{list.map(c=><tr key={c.id}><td><b>{ar?c.nameAr:c.nameEn}</b><small>{c.id}</small></td><td>{c.year}<small>{c.frequency}</small></td><td>{c.jobTitles}</td><td>{c.employees}<small>{c.managers} {translate("text106")}</small></td><td>{c.start}<small>{c.end}</small></td><td><span className={`cycle-status ${c.status.toLowerCase()}`}>{t(c.status,c.status==="Draft"?"مسودة":c.status==="Active"?"نشطة":"مغلقة")}</span></td><td><Link href={`/${ar?"ar":"en"}/admin/performance-cycles/${c.id}`}><Eye size={14}/>{translate("text107")}</Link></td></tr>)}</tbody></AppTable></div>:<div className="cycle-empty"><Search size={22}/><b>{translate("text108")}</b></div>}
  </section>
  <p className="cycle-inline-warning"><AlertTriangle size={14}/>{translate("text109")}</p>
 </AppShell>;
}
