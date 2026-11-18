"use client";

import { AppShell } from "@/components/layout/app-shell";
import { competencies, employee, objectives } from "@/features/dashboard/mock-data";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import {
  AlertCircle, ArrowDownUp, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Filter, MessageSquare, Search, Sparkles, Target
} from "lucide-react";

export default function EmployeeObjectivesPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const [expanded, setExpanded] = useState<string[]>(["OBJ-01"]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const text = (en: string, arabic: string) => ar ? arabic : en;
  const filtered = useMemo(() => objectives.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) || item.titleAr.includes(query);
    return matchesQuery && (filter === "all" || item.status === filter);
  }), [query, filter]);
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current,id]);

  return (
    <AppShell title={text("My objectives", "أهدافي")} subtitle={text("Understand what success looks like and track your progress throughout the cycle.", "تعرف على معايير نجاحك وتابع تقدمك طوال دورة الأداء.")}>
      <div className="employee-profile-card">
        <div className="employee-identity"><div className="employee-avatar">MG</div><div><div className="identity-name">{employee.name}<span className="draft-badge">{text("Draft", "مسودة")}</span></div><div className="identity-meta"><span>#{employee.employeeId}</span><span>{employee.email}</span></div></div></div>
        <div className="employee-details"><div><small>{text("BUSINESS UNIT", "وحدة الأعمال")}</small><strong>{employee.businessUnit}</strong></div><div><small>{text("DEPARTMENT", "الإدارة")}</small><strong>{employee.department}</strong></div><div><small>{text("LOCATION", "الموقع")}</small><strong>{employee.location}</strong></div><div><small>{text("JOB TITLE", "المسمى الوظيفي")}</small><strong>{employee.title}</strong></div><div><small>{text("LINE MANAGER", "المدير المباشر")}</small><strong>{employee.manager}</strong></div></div>
      </div>

      <div className="submission-notice"><span className="notice-icon"><Clock3 size={19}/></span><div><strong>{text("Waiting for manager submission", "في انتظار إرسال المدير")}</strong><p>{text("Your manager has not submitted your objectives for review yet. You will be able to comment or approve once they submit.", "لم يقم مديرك بإرسال الأهداف للمراجعة بعد. ستتمكن من التعليق أو الاعتماد بعد الإرسال.")}</p></div><span className="notice-status">{text("Pending", "معلق")}</span></div>

      <div className="objective-summary-grid">
        <div className="summary-tile"><span className="summary-icon blue"><Target size={18}/></span><strong>2</strong><small>{text("Categories", "تصنيفات")}</small></div>
        <div className="summary-tile"><span className="summary-icon violet"><Sparkles size={18}/></span><strong>8</strong><small>{text("Objectives", "أهداف")}</small></div>
        <div className="summary-tile"><span className="summary-icon green"><CheckCircle2 size={18}/></span><strong>20</strong><small>{text("Competencies", "كفاءة")}</small></div>
        <div className="summary-tile total"><span className="summary-icon green"><Target size={18}/></span><strong>100%</strong><small>{text("Total assigned weight", "إجمالي الأوزان")}</small></div>
      </div>

      <div className="objectives-toolbar"><div className="toolbar-left"><div className="search-field"><Search size={16}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={text("Search objectives...", "ابحث في الأهداف...")}/></div><select className="filter-select" value={filter} onChange={(e)=>setFilter(e.target.value)}><option value="all">{text("All statuses", "كل الحالات")}</option><option value="on-track">{text("On track", "على المسار")}</option><option value="at-risk">{text("At risk", "تحتاج متابعة")}</option><option value="completed">{text("Completed", "مكتمل")}</option></select></div><div className="toolbar-actions"><button onClick={()=>setExpanded(filtered.map((item)=>item.id))}><ChevronDown size={15}/>{text("Expand all", "توسيع الكل")}</button><button onClick={()=>setExpanded([])}><ChevronRight size={15}/>{text("Collapse all", "طي الكل")}</button></div></div>

      <div className="objectives-layout"><div className="objectives-main">
        <div className="category-header"><div><span className="category-symbol">✦</span><div><strong>{text("Business & Delivery", "الأعمال والتسليم")}</strong><small>8 {text("objectives", "أهداف")}</small></div></div><div className="category-weight"><strong>80%</strong><small>{text("Category weight", "وزن التصنيف")}</small></div></div>
        <div className="objective-cards">
          {filtered.map((item,index)=> {
            const open=expanded.includes(item.id);
            return <article className={`objective-card ${open?"is-expanded":""}`} key={item.id}>
              <button className="objective-card-trigger" onClick={()=>toggle(item.id)} aria-expanded={open}>
                <span className="expand-indicator">{open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</span>
                <span className="objective-number">{String(index+1).padStart(2,"0")}</span>
                <span className="objective-trigger-title">{ar?item.titleAr:item.title}</span>
                <span className="objective-type">OBJECTIVE</span><span className="weight-chip">{item.weight}%</span>
                <span className={`smart-chip ${item.smartScore>=85?"good":"mid"}`}>SMART {item.smartScore}%</span>
              </button>
              {open && <div className="objective-detail">
                <div className="objective-detail-head"><div><span className="detail-overline">{text("OBJECTIVE DETAILS", "تفاصيل الهدف")}</span><h3>{ar?item.titleAr:item.title}</h3></div><div className="weight-display"><small>{text("WEIGHT", "الوزن")}</small><strong>{item.weight}%</strong></div></div>
                <div className="objective-description-grid"><div><small>{text("ENGLISH DESCRIPTION", "الوصف بالإنجليزية")}</small><p>{item.description}</p></div><div><small>{text("ARABIC DESCRIPTION", "الوصف بالعربية")}</small><p dir="rtl">{item.descriptionAr}</p></div></div>
                <div className="smart-score-card"><div className="smart-score-heading"><div><Sparkles size={16}/><strong>{text("SMART assessment", "تقييم SMART")}</strong></div><strong>{item.smartScore}%</strong></div><div className="smart-dimensions">{["Specific","Measurable","Achievable","Relevant","Time-bound"].map((label,i)=><div key={label}><span>{text(label,["محدد","قابل للقياس","قابل للتحقيق","مرتبط","محدد بزمن"][i])}</span><strong>{[90,85,90,80,95][i]}%</strong></div>)}</div><div className="smart-bar"><span style={{width:`${item.smartScore}%`}}/></div></div>
                <div className="objective-progress-detail"><div><span>{text("Progress", "التقدم")}</span><strong>{item.progress}%</strong></div><div className="detail-progress-track"><span className={item.status} style={{width:`${item.progress}%`}}/></div><div className="detail-footer"><span className={`status-label ${item.status}`}>{item.status==="completed"?text("Completed", "مكتمل"):item.status==="at-risk"?text("Needs attention", "يحتاج متابعة"):text("On track", "على المسار")}</span><span>{text("Due", "تاريخ الاستحقاق")}: {item.dueDate}</span></div></div>
                <div className="objective-info-note"><CircleHelp size={15}/>{text("Your objective is currently read-only while waiting for manager submission.", "الهدف للعرض فقط حالياً لحين إرساله من المدير.")}</div>
              </div>}
            </article>
          })}
          {filtered.length===0 && <div className="empty-state"><Search size={24}/><strong>{text("No objectives found", "لم يتم العثور على أهداف")}</strong><span>{text("Try another search or status filter.", "جرّب البحث بكلمات أو حالة مختلفة.")}</span></div>}
        </div>

        <div className="category-header competency-category"><div><span className="category-symbol purple">✧</span><div><strong>{text("HR Competencies", "الكفاءات")}</strong><small>20 {text("competencies", "كفاءة")}</small></div></div><div className="category-weight"><strong>20%</strong><small>{text("Category weight", "وزن التصنيف")}</small></div></div>
        <div className="competency-list-card"><div className="competency-list-heading"><div><h3>{text("Core competencies", "الكفاءات الأساسية")}</h3><p>{text("Competencies assigned to your role", "الكفاءات المحددة لدورك الوظيفي")}</p></div><span className="readonly-pill">{text("Read only", "للعرض فقط")}</span></div><div className="competency-grid">{competencies.map((item,i)=><div key={item} className="competency-item"><span>{String(i+1).padStart(2,"0")}</span><strong>{ar?["تحقيق الأهداف","دعم الفريق","جودة العمل","المسؤولية واتخاذ القرار","التعلم المستمر","تحسين العمليات","تطبيق المعرفة","الالتزام بالسياسات","الالتزام بالمواعيد","التمثيل المهني","الانضباط والمساءلة","الإنتاجية والمخرجات"][i]:item}</strong><CheckCircle2 size={15}/></div>)}</div></div>
        <div className="feedback-card"><div><h3>{text("General feedback & decision", "الملاحظات العامة والقرار")}</h3><p>{text("Your objectives will be available for review once your manager submits the plan.", "ستكون أهدافك متاحة للمراجعة بعد إرسال الخطة من المدير.")}</p></div><span className="feedback-lock"><Clock3 size={16}/>{text("Awaiting submission", "في انتظار الإرسال")}</span></div>
      </div>
      <aside className="objectives-aside"><div className="aside-card"><div className="aside-heading"><strong>{text("On this page", "في هذه الصفحة")}</strong><span>02</span></div><a href="#business" className="aside-section-link active"><span>01</span>{text("Business & Delivery", "الأعمال والتسليم")}<b>8</b></a><div className="aside-subitems">{objectives.slice(0,5).map((item)=> <a key={item.id} href="#" onClick={(e)=>{e.preventDefault();toggle(item.id)}}>{ar?item.titleAr:item.title}</a>)}</div><a href="#competencies" className="aside-section-link"><span>02</span>{text("HR Competencies", "الكفاءات")}<b>20</b></a><div className="aside-tip"><Sparkles size={16}/><div><strong>{text("A quick tip", "نصيحة سريعة")}</strong><p>{text("Clear, measurable objectives make performance conversations more meaningful.", "الأهداف الواضحة والقابلة للقياس تجعل مناقشات الأداء أكثر فاعلية.")}</p></div></div></div></aside>
      </div>
    </AppShell>
  );
}