"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { Activity, AlertTriangle, ArrowUpRight, Building2, CheckCircle2, ClipboardList, FileBarChart2, Layers3, ShieldCheck, Users } from "lucide-react";

type Role = "department" | "hcd";
type Row = { name: string; detail: string; value: string; status: string; tone: "good" | "risk" | "neutral" };
type PageData = {
  title: string; ar: string; subtitle: string; subtitleAr: string;
  stats: [string, string, string][];
  heading: string; headingAr: string; description: string; descriptionAr: string;
  rows: Row[];
  note: string; noteAr: string;
};

const data: Record<string, PageData> = {
  "department-teams": {
    title: "Department teams", ar: "فرق الإدارة",
    subtitle: "Explore managers and teams within your department.", subtitleAr: "استعرض المديرين والفرق التابعة لإدارتك.",
    stats: [["8","Teams","الفرق"],["124","Employees","الموظفون"],["6","Managers","المديرون"],["2","Need attention","تحتاج متابعة"]],
    heading: "Team directory", headingAr: "دليل الفرق", description: "A department-scoped view of team health and ownership.", descriptionAr: "عرض على مستوى الإدارة لمتابعة الفرق والمسؤوليات.",
    rows: [
      {name:"Engineering",detail:"Omar Khaled · 28 employees",value:"86%",status:"On track",tone:"good"},
      {name:"Product Design",detail:"Sara Ahmed · 16 employees",value:"91%",status:"On track",tone:"good"},
      {name:"Quality Assurance",detail:"Nada Hany · 19 employees",value:"62%",status:"Needs attention",tone:"risk"},
      {name:"Program Management",detail:"Mona Ali · 14 employees",value:"74%",status:"On track",tone:"neutral"}
    ], note:"Illustrative department records. Team scope and reporting lines must come from the HR system.", noteAr:"سجلات توضيحية. يجب أن يأتي نطاق الفرق وخطوط التقارير من نظام الموارد البشرية."
  },
  "department-progress": {
    title:"Performance progress", ar:"تقدم الأداء", subtitle:"Monitor objective and evaluation progress across your department.", subtitleAr:"تابع تقدم الأهداف والتقييمات على مستوى إدارتك.",
    stats:[["81%","Objective progress","تقدم الأهداف"],["76%","Check-ins completed","المتابعات المكتملة"],["18","Overdue actions","إجراءات متأخرة"],["92%","Employee participation","مشاركة الموظفين"]],
    heading:"Progress by team",headingAr:"التقدم حسب الفريق",description:"Compare cycle participation and objective progress.",descriptionAr:"قارن المشاركة في الدورة وتقدم الأهداف.",
    rows:[
      {name:"Engineering",detail:"28 employees · 6 managers",value:"88%",status:"On track",tone:"good"},
      {name:"Product Design",detail:"16 employees · 3 managers",value:"93%",status:"On track",tone:"good"},
      {name:"Quality Assurance",detail:"19 employees · 4 managers",value:"58%",status:"At risk",tone:"risk"},
      {name:"Program Management",detail:"14 employees · 2 managers",value:"76%",status:"In progress",tone:"neutral"}
    ],note:"Progress values are illustrative and should be calculated from approved cycle records.",noteAr:"قيم التقدم توضيحية ويجب احتسابها من سجلات الدورة المعتمدة."
  },
  "department-reports": {
    title:"Department reports",ar:"تقارير الإدارة",subtitle:"Review department performance summaries and trends.",subtitleAr:"راجع ملخصات الأداء واتجاهاته داخل الإدارة.",
    stats:[["81%","Average progress","متوسط التقدم"],["4","Team summaries","ملخصات الفرق"],["12","Open follow-ups","متابعات مفتوحة"],["Q4","Current period","الفترة الحالية"]],
    heading:"Available report views",headingAr:"التقارير المتاحة",description:"Department-level reporting areas for the active cycle.",descriptionAr:"مجالات التقارير على مستوى الإدارة للدورة الحالية.",
    rows:[
      {name:"Objective progress summary",detail:"Progress and completion by team",value:"Open",status:"Available",tone:"good"},
      {name:"Evaluation participation",detail:"Manager and employee completion",value:"Open",status:"Available",tone:"good"},
      {name:"Overdue follow-ups",detail:"Items requiring manager attention",value:"12",status:"Needs review",tone:"risk"},
      {name:"Performance trend",detail:"Period-over-period department view",value:"Q4",status:"Preview",tone:"neutral"}
    ],note:"Report exports and live filters will be connected when reporting APIs are available.",noteAr:"سيتم ربط تصدير التقارير والفلاتر المباشرة عند توفر واجهات التقارير."
  },
  "hcd-cycles": {
    title:"Cycle governance",ar:"حوكمة الدورات",subtitle:"Review performance cycle setup, milestones and governance status.",subtitleAr:"راجع إعداد دورة الأداء ومواعيدها وحالة الحوكمة.",
    stats:[["2026","Active cycle","الدورة النشطة"],["5","Workflow stages","مراحل سير العمل"],["4","Periods","الفترات"],["3","Governance checks","فحوصات الحوكمة"]],
    heading:"Cycle milestones",headingAr:"مراحل الدورة",description:"A governance view of the annual performance workflow.",descriptionAr:"عرض حوكمة لسير عمل الأداء السنوي.",
    rows:[
      {name:"Objective setting",detail:"Employee and manager objective planning",value:"Done",status:"Completed",tone:"good"},
      {name:"Admin review",detail:"Objective plan validation",value:"Done",status:"Completed",tone:"good"},
      {name:"Employee review",detail:"Employee confirmation",value:"In progress",status:"Active",tone:"neutral"},
      {name:"Active performance",detail:"Progress updates during the period",value:"Next",status:"Upcoming",tone:"neutral"},
      {name:"Manager evaluation",detail:"Period and annual assessment",value:"Later",status:"Upcoming",tone:"neutral"}
    ],note:"Cycle dates, deadlines and period frequency must follow approved configuration.",noteAr:"يجب أن تتبع تواريخ الدورة والمواعيد النهائية وتكرار الفترات الإعدادات المعتمدة."
  },
  "hcd-templates": {
    title:"Competency templates",ar:"قوالب الكفاءات",subtitle:"Manage competency framework coverage by job family.",subtitleAr:"أدر تغطية إطار الكفاءات حسب العائلات الوظيفية.",
    stats:[["92%","Template coverage","تغطية القوالب"],["18","Job families","العائلات الوظيفية"],["3","Missing mappings","تعيينات ناقصة"],["5","Core competencies","الكفاءات الأساسية"]],
    heading:"Template coverage",headingAr:"تغطية القوالب",description:"Review job-family mapping and template readiness.",descriptionAr:"راجع ربط العائلات الوظيفية وجاهزية القوالب.",
    rows:[
      {name:"Technology",detail:"Engineering and IT roles",value:"100%",status:"Ready",tone:"good"},
      {name:"Business",detail:"Business and program roles",value:"94%",status:"Ready",tone:"good"},
      {name:"Operations",detail:"Operations and support roles",value:"78%",status:"Review",tone:"risk"},
      {name:"New job titles",detail:"Awaiting competency mapping",value:"3",status:"Action needed",tone:"risk"}
    ],note:"A missing competency template should be flagged and block the relevant evaluation action.",noteAr:"يجب إظهار تنبيه عند غياب قالب الكفاءات ومنع إجراء التقييم المرتبط به."
  },
  "hcd-calibration": {
    title:"Calibration",ar:"المعايرة",subtitle:"Review manager-year group readiness and distribution compliance.",subtitleAr:"راجع جاهزية مجموعات المدير والسنة والالتزام بالتوزيع.",
    stats:[["6","Manager groups","مجموعات المديرين"],["4","Ready groups","مجموعات جاهزة"],["2","Need review","تحتاج مراجعة"],["86%","Overall readiness","الجاهزية الإجمالية"]],
    heading:"Calibration readiness",headingAr:"جاهزية المعايرة",description:"Illustrative compliance overview. Final rules require business confirmation.",descriptionAr:"نظرة توضيحية على الالتزام. القواعد النهائية تحتاج اعتماد مسؤول الأعمال.",
    rows:[
      {name:"Engineering · Manager group A",detail:"24 employees · ratings submitted",value:"Ready",status:"Within range",tone:"good"},
      {name:"Product · Manager group B",detail:"18 employees · 2 evaluations open",value:"Review",status:"Incomplete",tone:"risk"},
      {name:"Operations · Manager group C",detail:"16 employees · distribution check",value:"Review",status:"Outside range",tone:"risk"},
      {name:"Business · Manager group D",detail:"21 employees · ratings submitted",value:"Ready",status:"Within range",tone:"good"}
    ],note:"BRD describes distribution validation and automatic calibration; the exact enforcement behavior remains an open business decision. Do not alter underlying overall scores.",noteAr:"يذكر المستند التحقق من التوزيع والمعايرة الآلية، لكن آلية التنفيذ النهائية ما زالت تحتاج قراراً من مسؤول الأعمال. لا يتم تعديل النتائج الرقمية الأصلية."
  },
  "hcd-reports": {
    title:"Organization insights",ar:"مؤشرات المؤسسة",subtitle:"Explore organization-wide performance and cycle insights.",subtitleAr:"استعرض مؤشرات الأداء والدورة على مستوى المؤسسة.",
    stats:[["84%","Objective progress","تقدم الأهداف"],["91%","Cycle participation","المشاركة في الدورة"],["76%","Evaluations complete","التقييمات المكتملة"],["5","Business units","وحدات الأعمال"]],
    heading:"Organization reporting",headingAr:"تقارير المؤسسة",description:"Consolidated views for HCD governance and monitoring.",descriptionAr:"عروض مجمعة للحوكمة والمتابعة لدى إدارة رأس المال البشري.",
    rows:[
      {name:"Cycle participation",detail:"Employee and manager activity",value:"91%",status:"On track",tone:"good"},
      {name:"Objective completion",detail:"Approved objectives and progress",value:"84%",status:"On track",tone:"good"},
      {name:"Competency coverage",detail:"Templates mapped to job families",value:"92%",status:"Review",tone:"neutral"},
      {name:"Evaluation completion",detail:"Submitted period evaluations",value:"76%",status:"In progress",tone:"neutral"}
    ],note:"Organization-wide metrics are mock values and must be replaced with scoped, permission-aware API data.",noteAr:"مؤشرات المؤسسة بيانات تجريبية ويجب استبدالها ببيانات API تراعي النطاق والصلاحيات."
  }
};

export function WorkspaceSubpage({role,page}:{role:Role;page:string}){
  const ar=useLocale()==="ar"; const d=data[page];
  const t=(en:string,a:string)=>ar?a:en;
  const Icon=role==="hcd"?(page==="hcd-calibration"?ShieldCheck:page==="hcd-templates"?Layers3:ClipboardList):(page==="department-teams"?Users:page==="department-reports"?FileBarChart2:Activity);
  return <AppShell role={role} title={t(d.title,d.ar)} subtitle={t(d.subtitle,d.subtitleAr)}>
    <section className="workspace-stat-grid">{d.stats.map((s,i)=><article className="workspace-stat-card" key={s[1]}><span className="workspace-stat-icon">{i===0?<Activity size={18}/>:i===1?<Users size={18}/>:i===2?<CheckCircle2 size={18}/>:<Building2 size={18}/>}</span><strong>{s[0]}</strong><span>{t(s[1],s[2])}</span><small>{t("Illustrative data","بيانات توضيحية")}</small></article>)}</section>
    <section className="panel workspace-data-panel">
      <div className="panel-heading"><div><h3>{t(d.heading,d.headingAr)}</h3><p>{t(d.description,d.descriptionAr)}</p></div><span className="readonly-pill">{t("2026 cycle","دورة 2026")}</span></div>
      <div className="workspace-record-list">{d.rows.map((row)=> <article className="workspace-record" key={row.name}><span className="workspace-record-icon"><Icon size={17}/></span><div className="workspace-record-main"><strong>{row.name}</strong><small>{row.detail}</small></div><b className="workspace-record-value">{row.value}</b><span className={"manager-status "+(row.tone==="good"?"good":row.tone==="risk"?"risk":"")}>{t(row.status,row.status==="On track"?"على المسار":row.status==="Needs attention"?"تحتاج متابعة":row.status==="Completed"?"مكتمل":row.status==="Active"?"نشط":row.status==="Upcoming"?"قادم":row.status==="Ready"?"جاهز":row.status==="Within range"?"ضمن النطاق":row.status==="Incomplete"?"غير مكتمل":row.status==="Outside range"?"خارج النطاق":row.status==="Action needed"?"يتطلب إجراء":row.status==="Available"?"متاح":row.status==="Needs review"?"يحتاج مراجعة":row.status==="In progress"?"قيد التنفيذ":row.status==="Preview"?"معاينة":row.status)}</span></article>)}</div>
      <div className="workspace-note"><AlertTriangle size={16}/><span>{t(d.note,d.noteAr)}</span></div>
    </section>
  </AppShell>;
}
