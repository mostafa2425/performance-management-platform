"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, CircleAlert,
  Clock3, FileCheck2, MessageSquareText, Target, TrendingUp, Users
} from "lucide-react";

const team = [
  { initials:"SA", name:"Sara Ahmed", role:"Senior UI/UX Designer", progress:92, objectives:5, status:"On track" },
  { initials:"OK", name:"Omar Khaled", role:"Frontend Developer", progress:78, objectives:6, status:"On track" },
  { initials:"MA", name:"Mona Ali", role:"Business Analyst", progress:61, objectives:5, status:"Needs attention" },
  { initials:"YH", name:"Youssef Hassan", role:"Software Engineer", progress:86, objectives:6, status:"On track" },
  { initials:"NH", name:"Nada Hany", role:"QA Engineer", progress:48, objectives:4, status:"Needs attention" }
];
const reviews = [
  { name:"Mona Ali", type:"Objective plan review", due:"Today", initials:"MA" },
  { name:"Nada Hany", type:"Progress update · Sprint delivery", due:"Tomorrow", initials:"NH" },
  { name:"Omar Khaled", type:"Quarterly check-in", due:"Nov 22", initials:"OK" }
];
export default function ManagerDashboardPage() {
  const ar=useLocale()==="ar";
  const t=(en:string,a:string)=>ar?a:en;
  return <AppShell role="manager" title={t("Team overview","نظرة عامة على الفريق")} subtitle={t("A focused view of your team’s goals, progress and decisions.", "تابع أهداف فريقك ومستوى التقدم والقرارات المطلوبة.")}>
    <section className="manager-welcome">
      <div><span className="manager-eyebrow"><Users size={13}/> {t("MANAGER WORKSPACE","مساحة عمل المدير")}</span><h2>{t("Great teams grow with clear goals.", "الفرق الناجحة تبدأ بأهداف واضحة.")}</h2><p>{t("Your team is moving forward. Review the priorities that need your attention and keep everyone aligned.", "فريقك يحقق تقدماً. راجع الأولويات التي تحتاج اهتمامك وحافظ على توافق الجميع.")}</p><div className="manager-banner-meta"><span><i/> {t("2026 cycle active","دورة 2026 نشطة")}</span><span><CalendarDays size={13}/> {t("Next review · Nov 22","المراجعة القادمة · 22 نوفمبر")}</span></div></div>
      <div className="manager-team-total"><strong>12</strong><span>{t("Direct reports","موظفاً تحت إدارتك")}</span><div className="manager-avatars"><i>SA</i><i>OK</i><i>MA</i><i>+9</i></div></div>
    </section>
    <section className="manager-metric-grid">
      <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon blue"><Users size={18}/></span><span className="admin-metric-neutral">{t("Your team","فريقك")}</span></div><strong>12</strong><span>{t("Team members","أعضاء الفريق")}</span><small>{t("Across 2 job families","ضمن عائلتين وظيفيتين")}</small></article>
      <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon teal"><Target size={18}/></span><span className="admin-metric-change"><TrendingUp size={12}/> 7.5%</span></div><strong>81%</strong><span>{t("Average objective progress","متوسط تقدم الأهداف")}</span><small>{t("Across active objectives","في الأهداف النشطة")}</small></article>
      <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon violet"><FileCheck2 size={18}/></span><span className="admin-metric-warning">{t("Pending","معلق")}</span></div><strong>4</strong><span>{t("Reviews to complete","مراجعات مطلوبة")}</span><small>{t("2 objective · 2 progress reviews","مراجعتا أهداف · مراجعتا تقدم")}</small></article>
      <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon amber"><CircleAlert size={18}/></span><span className="admin-metric-warning">{t("Follow up","متابعة")}</span></div><strong>2</strong><span>{t("Team members at risk","أعضاء يحتاجون متابعة")}</span><small>{t("Below expected progress","أقل من مستوى التقدم المتوقع")}</small></article>
    </section>
    <div className="manager-grid">
      <section className="panel manager-team-panel"><div className="panel-heading"><div><h3>{t("Team performance","أداء الفريق")}</h3><p>{t("Progress across your direct reports","مستوى التقدم لدى الموظفين المباشرين")}</p></div><Link className="text-link" href={`/${ar?"ar":"en"}/manager/team`}>{t("View team","عرض الفريق")} <ArrowUpRight size={14}/></Link></div>
        <div className="manager-team-list">{team.map((m,i)=><div className="manager-person-row" key={m.name}><span className={`manager-person-avatar avatar-${i%5}`}>{m.initials}</span><div className="manager-person-copy"><strong>{m.name}</strong><small>{m.role}</small></div><div className="manager-person-progress"><div><span>{t("Progress","التقدم")}</span><b>{m.progress}%</b></div><div className="department-progress-track"><span className={m.progress<65?"amber":"teal"} style={{width:`${m.progress}%`}}/></div></div><span className={`manager-status ${m.progress<65?"risk":"good"}`}>{t(m.status,m.progress<65?"يحتاج متابعة":"على المسار")}</span></div>)}</div>
      </section>
      <section className="panel manager-review-panel"><div className="panel-heading"><div><h3>{t("Your review queue","قائمة المراجعات")}</h3><p>{t("Decisions waiting for your input","قرارات بانتظار مراجعتك")}</p></div><span className="admin-task-count">04</span></div>
        <div className="manager-review-list">{reviews.map((r,i)=><div className="manager-review-row" key={r.name}><span className="manager-review-avatar">{r.initials}</span><div><strong>{r.name}</strong><small>{t(r.type,["مراجعة خطة الأهداف","تحديث التقدم · إنجاز السبرنت","مراجعة ربع سنوية"][i])}</small><span><Clock3 size={12}/>{t("Due","الموعد")}: {r.due}</span></div><ChevronRight size={15}/></div>)}</div>
        <Link className="admin-panel-link" href={`/${ar?"ar":"en"}/manager/reviews`}>{t("Open review queue","فتح قائمة المراجعات")} <ArrowUpRight size={14}/></Link>
      </section>
      <section className="panel manager-priorities"><div className="panel-heading"><div><h3>{t("Team priorities","أولويات الفريق")}</h3><p>{t("Focus areas for the current cycle","مجالات التركيز خلال الدورة الحالية")}</p></div></div><div className="manager-priority"><span className="priority-icon blue"><Target size={16}/></span><div><strong>{t("Objective alignment","مواءمة الأهداف")}</strong><small>{t("All team plans should be aligned with department priorities.", "تأكد من توافق خطط الفريق مع أولويات الإدارة.")}</small></div><b>10/12</b></div><div className="manager-priority"><span className="priority-icon teal"><MessageSquareText size={16}/></span><div><strong>{t("Regular feedback","التغذية الراجعة")}</strong><small>{t("Keep progress conversations documented.", "احرص على توثيق مناقشات التقدم.")}</small></div><b>8/12</b></div><div className="manager-priority"><span className="priority-icon amber"><CircleAlert size={16}/></span><div><strong>{t("At-risk objectives","الأهداف المعرضة للتأخر")}</strong><small>{t("Follow up on objectives below expected progress.", "تابع الأهداف الأقل من مستوى التقدم المتوقع.")}</small></div><b>3</b></div></section>
      <section className="panel manager-cycle-panel"><div className="panel-heading"><div><h3>{t("Upcoming milestones","المراحل القادمة")}</h3><p>{t("Keep your team on schedule","حافظ على التزام فريقك بالمواعيد")}</p></div></div><div className="manager-milestone"><span className="milestone-date"><b>22</b><small>NOV</small></span><div><strong>{t("Quarterly progress review","مراجعة التقدم ربع السنوية")}</strong><small>{t("4 employee updates expected","متوقع 4 تحديثات من الموظفين")}</small></div></div><div className="manager-milestone"><span className="milestone-date"><b>05</b><small>DEC</small></span><div><strong>{t("Objective progress checkpoint","نقطة متابعة تقدم الأهداف")}</strong><small>{t("Review team objective progress","مراجعة تقدم أهداف الفريق")}</small></div></div><div className="manager-milestone"><span className="milestone-date"><b>20</b><small>DEC</small></span><div><strong>{t("Manager evaluation window","فترة تقييم المدير")}</strong><small>{t("Annual evaluation activities begin","بدء أنشطة التقييم السنوي")}</small></div></div></section>
    </div>
    <div className="admin-demo-note"><CircleAlert size={15}/><span>{t("Illustrative manager demo data. Team membership, reporting lines, review tasks and progress will be provided by backend services.", "بيانات تجريبية للمدير. سيتم توفير أعضاء الفريق وخطوط الإشراف ومهام المراجعة والتقدم من خدمات Backend.")}</span></div>
  </AppShell>;
}