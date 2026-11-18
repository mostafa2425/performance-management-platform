"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Activity, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, FileCheck2, Filter, MoreHorizontal, Plus, Search,
  Target, TrendingUp, Users, Workflow
} from "lucide-react";

const departments = [
  { name: "Technology", employees: 186, submitted: 164, color: "navy" },
  { name: "Program Management", employees: 124, submitted: 101, color: "teal" },
  { name: "Human Resources", employees: 68, submitted: 61, color: "purple" },
  { name: "Finance & Operations", employees: 92, submitted: 70, color: "amber" }
];

const tasks = [
  { title: "Review pending objective plans", detail: "18 employees · Manager submission", due: "Today", tone: "amber" },
  { title: "Resolve competency template gaps", detail: "6 job titles require attention", due: "Nov 21", tone: "red" },
  { title: "Validate department participation", detail: "Program Management · 81% submitted", due: "Nov 24", tone: "blue" }
];

export default function AdminDashboardPage() {
  const ar = useLocale() === "ar";
  const t = (en: string, a: string) => ar ? a : en;
  return (
    <AppShell role="admin" title={t("Admin overview", "لوحة الإدارة")} subtitle={t("Monitor your performance cycle and keep every team moving forward.", "تابع دورة الأداء وتأكد من تقدم جميع الفرق في المسار الصحيح.")}>
      <section className="admin-welcome">
        <div>
          <span className="admin-eyebrow"><Activity size={13}/> {t("HUMAN CAPITAL DEVELOPMENT", "تطوير رأس المال البشري")}</span>
          <h2>{t("Performance at a glance.", "نظرة شاملة على الأداء.")}</h2>
          <p>{t("Your 2026 cycle is active. Here’s where things stand across the organization.", "دورة 2026 نشطة. إليك حالة التقدم على مستوى المؤسسة.")}</p>
          <div className="admin-banner-meta"><span><span className="admin-live-dot"/> {t("Cycle active", "الدورة نشطة")}</span><span><CalendarDays size={13}/> {t("Jan 01 – Dec 31, 2026", "1 يناير – 31 ديسمبر 2026")}</span></div>
        </div>
        <div className="admin-banner-side"><div className="admin-ring"><div><strong>78%</strong><span>{t("Overall completion", "نسبة الإنجاز")}</span></div></div><span>{t("Across 470 employees", "من إجمالي 470 موظفاً")}</span></div>
      </section>

      <section className="admin-metric-grid">
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon blue"><Users size={18}/></span><span className="admin-metric-change"><TrendingUp size={12}/> 6.2%</span></div><strong>470</strong><span>{t("Total employees", "إجمالي الموظفين")}</span><small>{t("Across 4 business units", "ضمن 4 وحدات أعمال")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon teal"><Target size={18}/></span><span className="admin-metric-change"><TrendingUp size={12}/> 4.8%</span></div><strong>366</strong><span>{t("Objectives submitted", "الأهداف المرسلة")}</span><small>{t("78% of expected submissions", "78% من الإرسال المتوقع")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon violet"><FileCheck2 size={18}/></span><span className="admin-metric-neutral">{t("In review", "قيد المراجعة")}</span></div><strong>52</strong><span>{t("Pending approvals", "اعتمادات معلقة")}</span><small>{t("Across manager and admin review", "بين مراجعة المدير والإدارة")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon amber"><CircleAlert size={18}/></span><span className="admin-metric-warning">{t("Needs attention", "تحتاج متابعة")}</span></div><strong>18</strong><span>{t("Items requiring action", "عناصر تتطلب إجراءً")}</span><small>{t("6 configuration · 12 workflow", "6 إعدادات · 12 سير عمل")}</small></article>
      </section>

      <div className="admin-content-grid">
        <section className="panel admin-cycle-panel">
          <div className="panel-heading"><div><h3>{t("Cycle progress", "تقدم الدورة")}</h3><p>{t("Submission and review status by department", "حالة الإرسال والمراجعة حسب الإدارة")}</p></div><button className="admin-ghost-button"><Filter size={14}/>{t("This cycle", "هذه الدورة")}</button></div>
          <div className="admin-progress-legend"><span><i className="admin-legend submitted"/> {t("Submitted", "تم الإرسال")}</span><span><i className="admin-legend remaining"/> {t("Remaining", "متبقي")}</span></div>
          <div className="department-progress-list">{departments.map((d)=><div className="department-progress-row" key={d.name}><div className="department-progress-title"><strong>{t(d.name, d.name==="Technology"?"التقنية":d.name==="Program Management"?"إدارة البرامج":d.name==="Human Resources"?"الموارد البشرية":"المالية والعمليات")}</strong><span>{d.submitted}/{d.employees}</span></div><div className="department-progress-track"><span className={d.color} style={{width:`${Math.round(d.submitted/d.employees*100)}%`}}/></div><small>{Math.round(d.submitted/d.employees*100)}% {t("submitted", "تم الإرسال")}</small></div>)}</div>
          <Link className="admin-panel-link" href={`/${ar?"ar":"en"}/admin/employees`}>{t("View employee progress", "عرض تقدم الموظفين")} <ArrowUpRight size={14}/></Link>
        </section>

        <section className="panel admin-tasks-panel">
          <div className="panel-heading"><div><h3>{t("Needs your attention", "يتطلب انتباهك")}</h3><p>{t("Prioritized actions to keep the cycle healthy", "إجراءات ذات أولوية للحفاظ على سير الدورة")}</p></div><span className="admin-task-count">03</span></div>
          <div className="admin-task-list">{tasks.map((task,i)=><div className="admin-task" key={task.title}><span className={`admin-task-icon ${task.tone}`}>{i===0?<Clock3 size={17}/>:i===1?<CircleAlert size={17}/>:<Workflow size={17}/>}</span><div><strong>{t(task.title,["مراجعة خطط الأهداف المعلقة","معالجة نقص قوالب الكفاءات","التحقق من مشاركة الإدارات"][i])}</strong><small>{t(task.detail,["18 موظفاً · إرسال المدير","6 مسميات وظيفية تحتاج مراجعة","إدارة البرامج · تم إرسال 81%"][i])}</small><span>{t("Due", "الموعد")}: {task.due}</span></div><ChevronRight size={15}/></div>)}</div>
          <Link className="admin-panel-link" href={`/${ar?"ar":"en"}/admin/approvals`}>{t("Open action center", "فتح مركز الإجراءات")} <ArrowUpRight size={14}/></Link>
        </section>

        <section className="panel admin-cycle-health">
          <div className="panel-heading"><div><h3>{t("Cycle milestones", "مراحل دورة الأداء")}</h3><p>{t("Key stages and current workflow position", "المراحل الرئيسية وموقع سير العمل الحالي")}</p></div><span className="admin-cycle-tag">{t("2026 CYCLE", "دورة 2026")}</span></div>
          <div className="admin-milestones">
            <div className="admin-milestone done"><span>✓</span><div><strong>{t("Objective setting", "تحديد الأهداف")}</strong><small>{t("Completed · Jan 15", "مكتملة · 15 يناير")}</small></div><b>{t("Done", "مكتملة")}</b></div>
            <div className="admin-milestone active"><span>2</span><div><strong>{t("Admin & employee review", "مراجعة الإدارة والموظف")}</strong><small>{t("In progress · 78% submitted", "جارية · تم إرسال 78%")}</small></div><b>{t("Active", "نشطة")}</b></div>
            <div className="admin-milestone"><span>3</span><div><strong>{t("Active performance", "فترة الأداء")}</strong><small>{t("Upcoming milestone", "المرحلة القادمة")}</small></div></div>
            <div className="admin-milestone"><span>4</span><div><strong>{t("Manager evaluation", "تقييم المدير")}</strong><small>{t("Planned · December", "مخططة · ديسمبر")}</small></div></div>
            <div className="admin-milestone"><span>5</span><div><strong>{t("Final review & publication", "المراجعة النهائية والنشر")}</strong><small>{t("Planned · January 2027", "مخططة · يناير 2027")}</small></div></div>
          </div>
        </section>

        <section className="panel admin-quick-panel">
          <div className="panel-heading"><div><h3>{t("Quick actions", "إجراءات سريعة")}</h3><p>{t("Common administration tasks", "المهام الإدارية الشائعة")}</p></div><MoreHorizontal size={17}/></div>
          <div className="admin-quick-grid">
            <Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><span className="quick-icon blue"><Plus size={18}/></span><strong>{t("Create a cycle", "إنشاء دورة")}</strong><small>{t("Configure a new period", "إعداد فترة جديدة")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/employees`}><span className="quick-icon teal"><Users size={18}/></span><strong>{t("Manage employees", "إدارة الموظفين")}</strong><small>{t("Review employee records", "مراجعة بيانات الموظفين")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/approvals`}><span className="quick-icon violet"><CheckCircle2 size={18}/></span><strong>{t("Review approvals", "مراجعة الاعتمادات")}</strong><small>{t("Resolve pending items", "معالجة العناصر المعلقة")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/reports`}><span className="quick-icon amber"><Activity size={18}/></span><strong>{t("View reports", "عرض التقارير")}</strong><small>{t("Explore cycle analytics", "استعراض تحليلات الدورة")}</small></Link>
          </div>
        </section>
      </div>
      <div className="admin-demo-note"><Bell size={15}/><span>{t("Demo data is illustrative. Live employee counts, workflow statuses and submission rates will come from the backend APIs.", "البيانات تجريبية للتوضيح. سيتم جلب أعداد الموظفين وحالات سير العمل ونسب الإرسال من واجهات Backend.")}</span></div>
    </AppShell>
  );
}