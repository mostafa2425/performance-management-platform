"use client";

import { AppButton } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale, useTranslations } from "next-intl";
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
  const translate = useTranslations("AdminDashboard");
  return (
    <AppShell role="admin" title={translate("text001")} subtitle={translate("text002")}>
      <section className="admin-welcome">
        <div>
          <span className="admin-eyebrow"><Activity size={13}/> {translate("text003")}</span>
          <h2>{translate("text004")}</h2>
          <p>{translate("text005")}</p>
          <div className="admin-banner-meta"><span><span className="admin-live-dot"/> {translate("text006")}</span><span><CalendarDays size={13}/> {translate("text007")}</span></div>
        </div>
        <div className="admin-banner-side"><div className="admin-ring"><div><strong>78%</strong><span>{translate("text008")}</span></div></div><span>{translate("text009")}</span></div>
      </section>

      <section className="admin-metric-grid">
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon blue"><Users size={18}/></span><span className="admin-metric-change"><TrendingUp size={12}/> 6.2%</span></div><strong>470</strong><span>{translate("text010")}</span><small>{translate("text011")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon teal"><Target size={18}/></span><span className="admin-metric-change"><TrendingUp size={12}/> 4.8%</span></div><strong>366</strong><span>{translate("text012")}</span><small>{translate("text013")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon violet"><FileCheck2 size={18}/></span><span className="admin-metric-neutral">{translate("text014")}</span></div><strong>52</strong><span>{translate("text015")}</span><small>{translate("text016")}</small></article>
        <article className="admin-metric"><div className="admin-metric-head"><span className="admin-metric-icon amber"><CircleAlert size={18}/></span><span className="admin-metric-warning">{translate("text017")}</span></div><strong>18</strong><span>{translate("text018")}</span><small>{translate("text019")}</small></article>
      </section>

      <div className="admin-content-grid">
        <section className="panel admin-cycle-panel">
          <div className="panel-heading"><div><h3>{translate("text020")}</h3><p>{translate("text021")}</p></div><AppButton className="admin-ghost-button"><Filter size={14}/>{translate("text022")}</AppButton></div>
          <div className="admin-progress-legend"><span><i className="admin-legend submitted"/> {translate("text023")}</span><span><i className="admin-legend remaining"/> {translate("text024")}</span></div>
          <div className="department-progress-list">{departments.map((d)=><div className="department-progress-row" key={d.name}><div className="department-progress-title"><strong>{t(d.name, d.name==="Technology"?"التقنية":d.name==="Program Management"?"إدارة البرامج":d.name==="Human Resources"?"الموارد البشرية":"المالية والعمليات")}</strong><span>{d.submitted}/{d.employees}</span></div><div className="department-progress-track"><span className={d.color} style={{width:`${Math.round(d.submitted/d.employees*100)}%`}}/></div><small>{Math.round(d.submitted/d.employees*100)}% {translate("text025")}</small></div>)}</div>
          <Link className="admin-panel-link" href={`/${ar?"ar":"en"}/admin/employees`}>{translate("text026")} <ArrowUpRight size={14}/></Link>
        </section>

        <section className="panel admin-tasks-panel">
          <div className="panel-heading"><div><h3>{translate("text027")}</h3><p>{translate("text028")}</p></div><span className="admin-task-count">03</span></div>
          <div className="admin-task-list">{tasks.map((task,i)=><div className="admin-task" key={task.title}><span className={`admin-task-icon ${task.tone}`}>{i===0?<Clock3 size={17}/>:i===1?<CircleAlert size={17}/>:<Workflow size={17}/>}</span><div><strong>{t(task.title,["مراجعة خطط الأهداف المعلقة","معالجة نقص قوالب الكفاءات","التحقق من مشاركة الإدارات"][i])}</strong><small>{t(task.detail,["18 موظفاً · إرسال المدير","6 مسميات وظيفية تحتاج مراجعة","إدارة البرامج · تم إرسال 81%"][i])}</small><span>{translate("text029")}: {task.due}</span></div><ChevronRight size={15}/></div>)}</div>
          <Link className="admin-panel-link" href={`/${ar?"ar":"en"}/admin/approvals`}>{translate("text030")} <ArrowUpRight size={14}/></Link>
        </section>

        <section className="panel admin-cycle-health">
          <div className="panel-heading"><div><h3>{translate("text031")}</h3><p>{translate("text032")}</p></div><span className="admin-cycle-tag">{translate("text033")}</span></div>
          <div className="admin-milestones">
            <div className="admin-milestone done"><span>✓</span><div><strong>{translate("text034")}</strong><small>{translate("text035")}</small></div><b>{translate("text036")}</b></div>
            <div className="admin-milestone active"><span>2</span><div><strong>{translate("text037")}</strong><small>{translate("text038")}</small></div><b>{translate("text039")}</b></div>
            <div className="admin-milestone"><span>3</span><div><strong>{translate("text040")}</strong><small>{translate("text041")}</small></div></div>
            <div className="admin-milestone"><span>4</span><div><strong>{translate("text042")}</strong><small>{translate("text043")}</small></div></div>
            <div className="admin-milestone"><span>5</span><div><strong>{translate("text044")}</strong><small>{translate("text045")}</small></div></div>
          </div>
        </section>

        <section className="panel admin-quick-panel">
          <div className="panel-heading"><div><h3>{translate("text046")}</h3><p>{translate("text047")}</p></div><MoreHorizontal size={17}/></div>
          <div className="admin-quick-grid">
            <Link href={`/${ar?"ar":"en"}/admin/performance-cycles`}><span className="quick-icon blue"><Plus size={18}/></span><strong>{translate("text048")}</strong><small>{translate("text049")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/employees`}><span className="quick-icon teal"><Users size={18}/></span><strong>{translate("text050")}</strong><small>{translate("text051")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/approvals`}><span className="quick-icon violet"><CheckCircle2 size={18}/></span><strong>{translate("text052")}</strong><small>{translate("text053")}</small></Link>
            <Link href={`/${ar?"ar":"en"}/admin/reports`}><span className="quick-icon amber"><Activity size={18}/></span><strong>{translate("text054")}</strong><small>{translate("text055")}</small></Link>
          </div>
        </section>
      </div>
      <div className="admin-demo-note"><Bell size={15}/><span>{translate("text056")}</span></div>
    </AppShell>
  );
}