"use client";
import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { ClipboardList, Clock3, Users } from "lucide-react";

type Role="manager"|"department"|"hcd";
const pages:Record<string,{en:string;ar:string;sub:string;subAr:string}>={
 "manager-team":{en:"My team",ar:"فريقي",sub:"Review your direct reports and their current cycle participation.",subAr:"راجع الموظفين التابعين لك ومشاركتهم في دورة الأداء."},
 "manager-reviews":{en:"Review queue",ar:"قائمة المراجعات",sub:"Objective plans and progress updates waiting for your review.",subAr:"خطط الأهداف وتحديثات التقدم التي تنتظر مراجعتك."},
 "manager-objectives":{en:"Team objectives",ar:"أهداف الفريق",sub:"Track objective alignment and progress across your team.",subAr:"تابع توافق الأهداف ومستوى التقدم عبر فريقك."},
 "manager-performance":{en:"Team performance",ar:"أداء الفريق",sub:"A consolidated view of team performance and development.",subAr:"عرض مجمع لأداء الفريق والتطوير المهني."},
 "department-teams":{en:"Department teams",ar:"فرق الإدارة",sub:"Explore teams and managers within your department.",subAr:"استعرض الفرق والمديرين داخل إدارتك."},
 "department-progress":{en:"Performance progress",ar:"تقدم الأداء",sub:"Monitor department-wide objective and evaluation progress.",subAr:"تابع تقدم الأهداف والتقييمات على مستوى الإدارة."},
 "department-reports":{en:"Department reports",ar:"تقارير الإدارة",sub:"Review department performance summaries and trends.",subAr:"راجع ملخصات الأداء والاتجاهات داخل الإدارة."},
 "hcd-cycles":{en:"Cycle governance",ar:"حوكمة الدورات",sub:"Review cycle configuration and key governance milestones.",subAr:"راجع إعدادات الدورات ومراحل الحوكمة الرئيسية."},
 "hcd-templates":{en:"Competency templates",ar:"قوالب الكفاءات",sub:"Manage competency framework coverage by job family.",subAr:"أدر تغطية إطار الكفاءات حسب العائلات الوظيفية."},
 "hcd-calibration":{en:"Calibration",ar:"المعايرة",sub:"Review calibration readiness and distribution compliance.",subAr:"راجع جاهزية المعايرة والالتزام بالتوزيع."},
 "hcd-reports":{en:"Organization insights",ar:"مؤشرات المؤسسة",sub:"Explore organization-wide performance insights.",subAr:"استعرض مؤشرات الأداء على مستوى المؤسسة."}
};
export function WorkspaceSubpage({role,page}:{role:Role;page:string}){
 const ar=useLocale()==="ar";const p=pages[page];const title=ar?p.ar:p.en;
 return <AppShell role={role} title={title} subtitle={ar?p.subAr:p.sub}>
  <section className="panel workspace-subpage"><span className="metric-icon blue">{role==="manager"?<Users size={20}/>:role==="hcd"?<ClipboardList size={20}/>:<Clock3 size={20}/>}</span><h3>{ar?"المحتوى قيد التجهيز":"Workspace section is being prepared"}</h3><p>{ar?"تم تجهيز التنقل لهذه الصفحة، وسيتم استكمال تفاصيلها وربطها بالبيانات التجريبية ثم واجهات Backend.":"Navigation is in place. Detailed workflows will be added with mock data first, then connected to backend APIs."}</p><span className="readonly-pill">{ar?"بيانات تجريبية":"Prototype workspace"}</span></section>
 </AppShell>;
}