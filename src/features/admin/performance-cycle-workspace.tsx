"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Eye, Filter, Plus, Search, ShieldCheck, Users, X } from "lucide-react";

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
const periodsFor = (start: string, frequency: Frequency) => {
 const count = frequency==="Quarterly"?4:frequency==="Semi-Annual"?2:1;
 const months = frequency==="Quarterly"?3:frequency==="Semi-Annual"?6:12;
 return Array.from({length:count},(_,i)=>{const d=new Date(start+"T12:00:00");d.setMonth(d.getMonth()+i*months);const s=d.toISOString().slice(0,10);const e=new Date(d);e.setMonth(e.getMonth()+months);e.setDate(e.getDate()-1);return {name:frequency==="Quarterly"?"Q"+(i+1):frequency==="Semi-Annual"?"H"+(i+1):"Annual",start:s,end:e.toISOString().slice(0,10)};});
};
const stageNames = (ar:boolean) => ar ? ["إعداد الأهداف واعتمادها","مراجعة الموظف","فترة الأداء الفعلي","تقييم المدير","المراجعة النهائية للإدارة"] : ["Objective Setting & Approval","Employee Review","Active Performance","Manager Evaluation","Admin Final Review"];

export default function PerformanceCycleWorkspace({ mode, cycleId }: { mode: "list"|"create"|"detail"; cycleId?: string }) {
 const ar=useLocale()==="ar"; const t=(en:string,arabic:string)=>ar?arabic:en;
 const [cycles,setCycles]=useState(seedCycles);
 const [search,setSearch]=useState(""); const [status,setStatus]=useState("All"); const [frequencyFilter,setFrequencyFilter]=useState("All");
 const [nameEn,setNameEn]=useState(""); const [nameAr,setNameAr]=useState(""); const [frequency,setFrequency]=useState<Frequency>("Quarterly"); const [start,setStart]=useState("2026-01-01");
 const [departments,setDepartments]=useState<string[]>([]); const [titles,setTitles]=useState<string[]>([]); const [individuals,setIndividuals]=useState<string[]>([]); const [excluded,setExcluded]=useState<string[]>([]); const [exceptions,setExceptions]=useState<string[]>([]);
 const [stages,setStages]=useState<Stage[]>(initialStages()); const [saved,setSaved]=useState(false); const [error,setError]=useState("");
 const end=useMemo(()=>start?addYear(start):"",[start]); const periods=useMemo(()=>start?periodsFor(start,frequency):[],[start,frequency]);
 const included=useMemo(()=>{const ids=new Set<string>();people.forEach(p=>{if(departments.includes(p.department)||titles.includes(p.title)||individuals.includes(p.id))ids.add(p.id);});excluded.forEach(id=>ids.delete(id));exceptions.forEach(id=>ids.add(id));return people.filter(p=>ids.has(p.id)&&(!p.activeCycle)&&(p.serviceMonths>=6||exceptions.includes(p.id)));},[departments,titles,individuals,excluded,exceptions]);
 const managerCount=new Set(included.map(p=>p.manager)).size;
 const list=cycles.filter(c=>(c.nameEn+" "+c.nameAr).toLowerCase().includes(search.toLowerCase())&&(status==="All"||c.status===status)&&(frequencyFilter==="All"||c.frequency===frequencyFilter));
 const detail=cycles.find(c=>c.id===cycleId)??cycles[0];
 const detailPeriods=periodsFor(detail.start,detail.frequency);
 const toggle=(items:string[],set:(v:string[])=>void,value:string)=>set(items.includes(value)?items.filter(x=>x!==value):[...items,value]);
 const validate=()=>{
  if(!nameEn.trim()||!nameAr.trim()||!start){setError(t("Complete both cycle names and the start date.","أدخل اسم الدورة باللغتين وتاريخ البداية."));return false;}
  if(!included.length){setError(t("Select at least one eligible employee.","اختر موظفاً مؤهلاً واحداً على الأقل."));return false;}
  if(stages.some(s=>!s.deadline)){setError(t("All five stage deadlines are required.","يجب إدخال مواعيد المراحل الخمس."));return false;}
  const first=periods[0];const dates=stages.map(s=>s.deadline);
  if(dates.some(d=>d<first.start||d>first.end)){setError(t("Each configured deadline must fall within the first generated period.","يجب أن تقع مواعيد المراحل ضمن الفترة الأولى."));return false;}
  if(dates.some((d,i)=>i>0&&d<dates[i-1])){setError(t("Stage deadlines must be in chronological order.","يجب ترتيب مواعيد المراحل زمنياً."));return false;}
  setError("");return true;
 };
 const create=(activate:boolean)=>{
  if(!validate())return;
  const id="CYC-"+new Date().getFullYear()+"-"+String(cycles.length+1).padStart(2,"0");
  setCycles(v=>[{id,nameEn,nameAr,year:Number(start.slice(0,4)),frequency,start,end,status:activate?"Active":"Draft",employees:included.length,managers:managerCount,departments:new Set(included.map(p=>p.department)).size,jobTitles:new Set(included.map(p=>p.title)).size},...v]);
  setSaved(true);
 };
 if(mode==="create") return <AppShell role="admin" title={t("Create performance cycle","إنشاء دورة أداء")} subtitle={t("Configure the annual cycle, employee scope and first-period stage deadlines.","أعدّ دورة الأداء السنوية ونطاق الموظفين ومواعيد مراحل الفترة الأولى.")}>
  <div className="cycle-workspace-top"><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><ArrowLeft size={15}/>{t("Back to cycles","العودة للدورات")}</Link><span className="cycle-demo-label">{t("Demo configuration · not saved to Backend","إعداد تجريبي · غير محفوظ في Backend")}</span></div>
  {saved?<section className="panel cycle-success"><Check size={22}/><h2>{t("Cycle demo record created","تم إنشاء سجل الدورة التجريبي")}</h2><p>{t("The record is held in this page's local state only and will reset on refresh. No notifications or workflow activation were sent.","تم حفظ السجل في الحالة المحلية للصفحة فقط وسيُعاد ضبطه عند التحديث. لم يتم إرسال إشعارات أو تفعيل سير عمل فعلي.")}</p><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}>{t("Return to cycle list","العودة لقائمة الدورات")}</Link></section>:<>
  <div className="cycle-form-grid">
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span>01</span><div><h3>{t("Cycle information","بيانات الدورة")}</h3><p>{t("Each cycle covers one annual performance year.","كل دورة تغطي سنة أداء سنوية واحدة.")}</p></div></div>
    <div className="cycle-fields two"><label>{t("Cycle name (English) *","اسم الدورة (إنجليزي) *")}<input value={nameEn} onChange={e=>setNameEn(e.target.value)} placeholder="2027 Annual Performance Cycle"/></label><label>{t("Cycle name (Arabic) *","اسم الدورة (عربي) *")}<input value={nameAr} onChange={e=>setNameAr(e.target.value)} placeholder="دورة الأداء السنوية 2027"/></label></div>
    <div className="cycle-fields three"><label>{t("Performance year","سنة الأداء")}<input readOnly value={start.slice(0,4)}/></label><label>{t("Frequency *","التكرار *")}<select value={frequency} onChange={e=>setFrequency(e.target.value as Frequency)}><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select></label><label>{t("Cycle start date *","تاريخ بداية الدورة *")}<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label></div>
    <div className="cycle-readonly-end"><CalendarDays size={17}/><div><small>{t("Cycle end date · system calculated","تاريخ نهاية الدورة · محسوب تلقائياً")}</small><strong>{end}</strong></div><span>{t("Read only","للقراءة فقط")}</span></div>
   </section>
   <section className="panel cycle-form-panel"><div className="cycle-section-head"><span>02</span><div><h3>{t("Employee scope","نطاق الموظفين")}</h3><p>{t("Select departments, job titles and/or individual employees. Duplicates are merged.","اختر الإدارات أو المسميات الوظيفية أو موظفين بعينهم. يتم دمج التكرارات.")}</p></div></div>
    <div className="cycle-scope-block"><strong>{t("Departments","الإدارات")}</strong><div className="cycle-check-grid">{["Technology","Human Resources","Finance & Operations","Program Management"].map(x=><label key={x}><input type="checkbox" checked={departments.includes(x)} onChange={()=>toggle(departments,setDepartments,x)}/>{x}</label>)}</div></div>
    <div className="cycle-scope-block"><strong>{t("Job titles","المسميات الوظيفية")}</strong><div className="cycle-check-grid">{["Frontend Developer","Software Engineer","QA Engineer","HR Specialist","Project Manager","Financial Analyst"].map(x=><label key={x}><input type="checkbox" checked={titles.includes(x)} onChange={()=>toggle(titles,setTitles,x)}/>{x}</label>)}</div></div>
    <div className="cycle-scope-block"><strong>{t("Specific employees","موظفون محددون")}</strong><div className="cycle-people-list">{people.map(p=>{const active=!!p.activeCycle;const short=p.serviceMonths<6;return <label key={p.id} className={active?"disabled":""}><input type="checkbox" disabled={active} checked={individuals.includes(p.id)||exceptions.includes(p.id)} onChange={()=>toggle(individuals,setIndividuals,p.id)}/><span><b>{p.name}</b><small>{p.id} · {p.title} · {p.department}</small></span>{active?<em>{t("In active cycle","ضمن دورة نشطة")}</em>:short?<em>{t("Under 6 months","أقل من 6 أشهر")}</em>:null}</label>})}</div></div>
    <div className="cycle-scope-summary"><strong>{included.length}</strong><span>{t("Employees in proposed scope","موظفون في النطاق المقترح")}</span><strong>{managerCount}</strong><span>{t("Managers","مديرون")}</span></div>
   </section>
   <section className="panel cycle-form-panel cycle-span-two"><div className="cycle-section-head"><span>03</span><div><h3>{t("Eligibility & exclusions","الأهلية والاستثناءات")}</h3><p>{t("Employees with less than six months of service are excluded by default. Admin may include them as an exception. Other exclusion categories remain subject to approved eligibility rules.","يتم استبعاد الموظفين ذوي الخدمة الأقل من ستة أشهر افتراضياً، ويمكن للإدارة إدراجهم كاستثناء. تظل فئات الاستبعاد الأخرى خاضعة لقواعد الأهلية المعتمدة.")}</p></div></div>
    {people.filter(p=>p.serviceMonths<6).map(p=><label className="cycle-exception" key={p.id}><span><b>{p.name}</b><small>{p.id} · {p.serviceMonths} {t("months of service","أشهر خدمة")}</small></span><span>{t("Include as exception","إدراج كاستثناء")}</span><input type="checkbox" checked={exceptions.includes(p.id)} onChange={()=>toggle(exceptions,setExceptions,p.id)}/></label>)}
    <p className="cycle-inline-warning"><AlertTriangle size={14}/>{t("Jisr sync, service-length calculation and other exclusion categories are mocked here. Production eligibility must come from the latest successful Jisr sync and backend policy.","مزامنة Jisr وحساب مدة الخدمة وفئات الاستبعاد الأخرى تجريبية هنا. يجب أن تأتي الأهلية الفعلية من آخر مزامنة ناجحة وسياسة Backend.")}</p>
   </section>
   <section className="panel cycle-form-panel cycle-span-two"><div className="cycle-section-head"><span>04</span><div><h3>{t("First-period stage deadlines","مواعيد مراحل الفترة الأولى")}</h3><p>{t("Configure the five workflow deadlines once. The same relative pattern is previewed for subsequent periods.","أدخل مواعيد المراحل الخمس مرة واحدة. يتم عرض نفس النمط النسبي للفترات التالية.")}</p></div></div>
    <div className="cycle-stage-grid">{stages.map((s,i)=><label key={s.key}><span className="cycle-stage-number">{i+1}</span><b>{t(s.en,s.ar)}</b><input type="date" value={s.deadline} min={periods[0]?.start} max={periods[0]?.end} onChange={e=>setStages(v=>v.map(x=>x.key===s.key?{...x,deadline:e.target.value}:x))}/></label>)}</div>
    <div className="cycle-period-preview"><h4>{t("Generated performance periods","فترات الأداء الناتجة")}</h4>{periods.map((p,i)=><article key={p.name}><strong>{p.name}</strong><span>{p.start} — {p.end}</span><small>{i===0?t("Configured deadlines","المواعيد المحددة"):t("Relative deadline pattern will be applied","سيتم تطبيق نمط المواعيد النسبي")}</small></article>)}</div>
   </section>
  </div>
  {error&&<p className="cycle-error"><AlertTriangle size={15}/>{error}</p>}
  <div className="cycle-form-actions"><span>{t("Activation requires valid cycle information, dates, scope and deadlines.","يتطلب التفعيل صحة بيانات الدورة والتواريخ والنطاق والمواعيد.")}</span><button className="cycle-secondary" onClick={()=>create(false)}>{t("Save as Draft","حفظ كمسودة")}</button><button className="cycle-primary" onClick={()=>create(true)}><ShieldCheck size={15}/>{t("Activate Cycle","تفعيل الدورة")}</button></div>
  </>}
 </AppShell>;
 if(mode==="detail") return <AppShell role="admin" title={ar?detail.nameAr:detail.nameEn} subtitle={t("Cycle configuration, generated periods and employee scope.","إعدادات الدورة والفترات الناتجة ونطاق الموظفين.")}>
  <div className="cycle-workspace-top"><Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><ArrowLeft size={15}/>{t("Back to cycles","العودة للدورات")}</Link><span className={`cycle-status ${detail.status.toLowerCase()}`}>{detail.status}</span></div>
  <section className="cycle-detail-stats"><article><small>{t("Performance year","سنة الأداء")}</small><strong>{detail.year}</strong></article><article><small>{t("Frequency","التكرار")}</small><strong>{detail.frequency}</strong></article><article><small>{t("Employees in scope","الموظفون بالنطاق")}</small><strong>{detail.employees}</strong></article><article><small>{t("Managers in scope","المديرون بالنطاق")}</small><strong>{detail.managers}</strong></article></section>
  <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><CalendarDays size={17}/></span><div><h3>{t("Cycle information","بيانات الدورة")}</h3><p>{detail.start} — {detail.end}</p></div></div><div className="cycle-period-preview">{detailPeriods.map(p=><article key={p.name}><strong>{p.name}</strong><span>{p.start} — {p.end}</span><small>{t("Period schedule · illustrative","جدول الفترة · توضيحي")}</small></article>)}</div></section>
  <section className="panel cycle-form-panel"><div className="cycle-section-head"><span><Users size={17}/></span><div><h3>{t("Employee inclusion & exclusion","إدراج واستبعاد الموظفين")}</h3><p>{t("The live cycle detail must show included employees, non-included employees, eligibility and exclusion reasons from the backend.","يجب أن تعرض تفاصيل الدورة الفعلية الموظفين المدرجين وغير المدرجين والأهلية وأسباب الاستبعاد من Backend.")}</p></div></div><p className="cycle-inline-warning"><AlertTriangle size={14}/>{t("This sample record does not contain employee-level inclusion data or workflow progress. No manual inclusion action is performed.","هذا السجل التجريبي لا يحتوي على بيانات إدراج الموظفين أو تقدم سير العمل على مستوى الأفراد. لا يتم تنفيذ إدراج يدوي فعلي.")}</p></section>
 </AppShell>;
 return <AppShell role="admin" title={t("Performance cycles","دورات الأداء")} subtitle={t("Create, configure and monitor annual performance cycles.","أنشئ دورات الأداء السنوية وأعدّها وتابع تقدمها.")}>
  <div className="cycle-list-toolbar"><div className="cycle-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search cycle name...","ابحث باسم الدورة...")}/></div><select value={frequencyFilter} onChange={e=>setFrequencyFilter(e.target.value)}><option>All</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Draft</option><option>Active</option><option>Closed</option></select><Link className="cycle-primary" href={`/${ar?"ar":"en"}/admin/performance-cycles/new`}><Plus size={15}/>{t("Create Performance Cycle","إنشاء دورة أداء")}</Link></div>
  <div className="cycle-list-summary"><article><span>{t("Total cycles","إجمالي الدورات")}</span><strong>{cycles.length}</strong></article><article><span>{t("Active","نشطة")}</span><strong>{cycles.filter(c=>c.status==="Active").length}</strong></article><article><span>{t("Draft","مسودات")}</span><strong>{cycles.filter(c=>c.status==="Draft").length}</strong></article><article><span>{t("Closed","مغلقة")}</span><strong>{cycles.filter(c=>c.status==="Closed").length}</strong></article></div>
  <section className="panel cycle-list-panel"><div className="panel-heading"><div><h3>{t("Performance cycle register","سجل دورات الأداء")}</h3><p>{t("Search and filter by cycle name, year, frequency and status.","ابحث وصفّ حسب اسم الدورة والسنة والتكرار والحالة.")}</p></div><span className="readonly-pill">{t("Illustrative data","بيانات توضيحية")}</span></div>
   {list.length?<div className="cycle-table-wrap"><table className="cycle-table"><thead><tr><th>{t("Cycle","الدورة")}</th><th>{t("Year / frequency","السنة / التكرار")}</th><th>{t("Employees","الموظفون")}</th><th>{t("Dates","التواريخ")}</th><th>{t("Status","الحالة")}</th><th>{t("Action","الإجراء")}</th></tr></thead><tbody>{list.map(c=><tr key={c.id}><td><b>{ar?c.nameAr:c.nameEn}</b><small>{c.id}</small></td><td>{c.year}<small>{c.frequency}</small></td><td>{c.employees}<small>{c.managers} {t("managers","مديرون")}</small></td><td>{c.start}<small>{c.end}</small></td><td><span className={`cycle-status ${c.status.toLowerCase()}`}>{t(c.status,c.status==="Draft"?"مسودة":c.status==="Active"?"نشطة":"مغلقة")}</span></td><td><Link href={`/${ar?"ar":"en"}/admin/performance-cycles/${c.id}`}><Eye size={14}/>{t("View details","عرض التفاصيل")}</Link></td></tr>)}</tbody></table></div>:<div className="cycle-empty"><Search size={22}/><b>{t("No cycles match these filters","لا توجد دورات تطابق عوامل التصفية")}</b></div>}
  </section>
  <p className="cycle-inline-warning"><AlertTriangle size={14}/>{t("Demo records and filters only. Create, activation, employee scope, Jisr eligibility, notifications and workflow progress are not persisted or connected to Backend APIs.","سجلات وفلاتر تجريبية فقط. الإنشاء والتفعيل ونطاق الموظفين وأهلية Jisr والإشعارات وتقدم سير العمل غير محفوظة أو مرتبطة بـBackend APIs.")}</p>
 </AppShell>;
}
