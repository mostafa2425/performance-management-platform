"use client";

import { AppShell } from "@/components/layout/app-shell";
import { actionItems, employee, objectives } from "@/features/dashboard/mock-data";
import {
  ArrowUpRight, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, MoreHorizontal, Sparkles, Target, TrendingUp, Trophy, Users
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function DashboardPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const translate = useTranslations("Dashboard");
  const completed = objectives.filter((item) => item.status === "completed").length;
  const atRisk = objectives.filter((item) => item.status === "at-risk").length;
  const onTrack = objectives.filter((item) => item.status === "on-track").length;
  const totalWeight = objectives.reduce((sum, item) => sum + item.weight, 0);
  const averageProgress = Math.round(objectives.reduce((sum, item) => sum + item.progress, 0) / objectives.length);

  return (
    <AppShell title={translate("text001")} subtitle={translate("text002")}>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow"><Sparkles size={14} /> {translate("text003")}</div>
          <h2>{translate("text004")}، {employee.name.split(" ")[0]} <span>✦</span></h2>
          <p>{translate("text005")}</p>
          <Link href={`/${locale}/employee/objectives`} className="banner-link">{translate("text006")} <ArrowUpRight size={16} /></Link>
        </div>
        <div className="welcome-visual">
          <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
          <div className="welcome-stat"><span>{translate("text007")}</span><strong>{averageProgress}%</strong><small><TrendingUp size={13} /> {translate("text008")}</small></div>
          <div className="welcome-spark spark-one">✦</div><div className="welcome-spark spark-two">✧</div>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><Target size={19} /></span><span className="metric-trend neutral">{translate("text009")}</span></div><div className="metric-value">{objectives.length}<span className="metric-unit">/ {objectives.length}</span></div><div className="metric-label">{translate("text010")}</div><div className="metric-foot">{text(`Total weight ${totalWeight}%`, `إجمالي الوزن ${totalWeight}%`)}</div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon green"><CheckCircle2 size={19} /></span><span className="metric-trend positive">{completed} {translate("text011")}</span></div><div className="metric-value">{averageProgress}%</div><div className="metric-label">{translate("text012")}</div><div className="metric-progress"><span style={{width:`${averageProgress}%`}} /></div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon violet"><Target size={19} /></span><span className="metric-trend neutral">{onTrack} {translate("text013")}</span></div><div className="metric-value">{onTrack}</div><div className="metric-label">{translate("text014")}</div><div className="metric-foot">{text(`${atRisk} need attention`, `${atRisk} تحتاج متابعة`)}</div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><Clock3 size={19} /></span><span className="metric-trend warning">{atRisk} {translate("text015")}</span></div><div className="metric-value">{atRisk}</div><div className="metric-label">{translate("text016")}</div><div className="metric-foot">{translate("text017")}</div></article>
      </section>

      <div className="dashboard-grid">
        <section className="panel progress-panel">
          <div className="panel-heading"><div><h3>{translate("text018")}</h3><p>{translate("text019")}</p></div><Link href={`/${locale}/employee/objectives`} className="text-link">{translate("text020")} <ArrowRight size={15} /></Link></div>
          <div className="progress-summary"><div><strong>{averageProgress}%</strong><span>{translate("text021")}</span></div><div className="progress-legend"><span><i className="legend-dot done" /> {translate("text022")}</span><span><i className="legend-dot progress" /> {translate("text023")}</span><span><i className="legend-dot risk" /> {translate("text024")}</span></div></div>
          <div className="objective-progress-list">
            {objectives.slice(0,5).map((item) => <div className="objective-progress-row" key={item.id}><div className="objective-row-title"><span className="objective-id">{item.id}</span><strong>{ar ? item.titleAr : item.title}</strong></div><div className="progress-track"><span className={item.status} style={{width:`${item.progress}%`}} /></div><span className="progress-percent">{item.progress}%</span></div>)}
          </div>
        </section>

        <section className="panel actions-panel">
          <div className="panel-heading"><div><h3>{translate("text025")}</h3><p>{translate("text026")}</p></div><span className="count-badge">01</span></div>
          <div className="action-list">
            {actionItems.map((item) => <Link href={`/${locale}/employee/objectives`} className="action-item" key={item.id}><span className={`action-icon ${item.type}`}><ClipboardCheck size={17}/></span><div className="action-copy"><strong>{text(item.title, "راجع خطة أدائك")}</strong><small>{text(item.detail, "في انتظار مراجعتك · اعتماد أو طلب تعديل")}</small><span><CalendarDays size={12}/> {translate("text027")}</span></div><ChevronRight size={16} className="action-arrow"/></Link>)}
          </div>
          <Link href={`/${locale}/employee/objectives`} className="panel-bottom-link">{translate("text028")} <ArrowUpRight size={15}/></Link>
        </section>

        <section className="panel cycle-panel">
          <div className="panel-heading"><div><h3>{translate("text029")}</h3><p>{translate("text030")}</p></div><span className="soft-status"><span className="status-dot"/> {translate("text031")}</span></div>
          <div className="cycle-steps">
            <div className="cycle-step completed"><span className="step-marker"><Check size={13}/></span><div><strong>{translate("text032")}</strong><small>{translate("text033")}</small></div></div>
            <div className="cycle-step current"><span className="step-marker">2</span><div><strong>{translate("text034")}</strong><small>{translate("text035")}</small></div><span className="current-tag">{translate("text036")}</span></div>
            <div className="cycle-step upcoming"><span className="step-marker">3</span><div><strong>{translate("text037")}</strong><small>{translate("text038")}</small></div></div>
            <div className="cycle-step upcoming"><span className="step-marker">4</span><div><strong>{translate("text039")}</strong><small>{translate("text040")}</small></div></div>
          </div>
        </section>

        <section className="panel competency-panel">
          <div className="panel-heading"><div><h3>{translate("text041")}</h3><p>{translate("text042")}</p></div><span className="competency-count">{12} {translate("text043")}</span></div>
          <div className="competency-highlight"><div className="competency-icon"><Users size={20}/></div><div><strong>{translate("text044")}</strong><small>{translate("text045")}</small></div><span>{12}</span></div>
          <div className="competency-tags"><span>{translate("text046")}</span><span>{translate("text047")}</span><span>{translate("text048")}</span><span>{translate("text049")}</span></div>
          <div className="competency-note"><CircleAlert size={15}/>{translate("text050")}</div>
        </section>
      </div>
    </AppShell>
  );
}

function ClipboardCheck({size=17}:{size?:number}) { return <CheckCircle2 size={size}/>; }
function BookOpenIcon() { return <Target size={17}/>; }