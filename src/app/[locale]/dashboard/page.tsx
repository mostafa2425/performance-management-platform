"use client";

import { AppShell } from "@/components/layout/app-shell";
import { actionItems, employee, objectives } from "@/features/dashboard/mock-data";
import {
  ArrowUpRight, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, MoreHorizontal, Sparkles, Target, TrendingUp, Trophy, Users
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function DashboardPage() {
  const locale = useLocale();
  const ar = locale === "ar";
  const completed = objectives.filter((item) => item.status === "completed").length;
  const atRisk = objectives.filter((item) => item.status === "at-risk").length;
  const onTrack = objectives.filter((item) => item.status === "on-track").length;
  const totalWeight = objectives.reduce((sum, item) => sum + item.weight, 0);
  const averageProgress = Math.round(objectives.reduce((sum, item) => sum + item.progress, 0) / objectives.length);
  const text = (en: string, arabic: string) => ar ? arabic : en;

  return (
    <AppShell title={text("Overview", "نظرة عامة")} subtitle={text("A clear view of your goals, progress and next steps.", "تابع أهدافك ومستوى تقدمك والخطوات القادمة.")}>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow"><Sparkles size={14} /> {text("2026 PERFORMANCE CYCLE", "دورة الأداء 2026")}</div>
          <h2>{text("Good afternoon", "مساء الخير")}، {employee.name.split(" ")[0]} <span>✦</span></h2>
          <p>{text("You’re making steady progress. Keep the momentum going and stay focused on what matters.", "أنت تحقق تقدماً جيداً. استمر في التقدم وركز على الأولويات المهمة.")}</p>
          <Link href={`/${locale}/employee/objectives`} className="banner-link">{text("Explore my objectives", "استعرض أهدافي")} <ArrowUpRight size={16} /></Link>
        </div>
        <div className="welcome-visual">
          <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
          <div className="welcome-stat"><span>{text("Your progress", "تقدمك")}</span><strong>{averageProgress}%</strong><small><TrendingUp size={13} /> {text("Demo data", "بيانات تجريبية")}</small></div>
          <div className="welcome-spark spark-one">✦</div><div className="welcome-spark spark-two">✧</div>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><div className="metric-top"><span className="metric-icon blue"><Target size={19} /></span><span className="metric-trend neutral">{text("Current cycle", "الدورة الحالية")}</span></div><div className="metric-value">{objectives.length}<span className="metric-unit">/ {objectives.length}</span></div><div className="metric-label">{text("Assigned objectives", "الأهداف المسندة")}</div><div className="metric-foot">{text(`Total weight ${totalWeight}%`, `إجمالي الوزن ${totalWeight}%`)}</div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon green"><CheckCircle2 size={19} /></span><span className="metric-trend positive">{completed} {text("completed", "مكتمل")}</span></div><div className="metric-value">{averageProgress}%</div><div className="metric-label">{text("Overall progress", "إجمالي التقدم")}</div><div className="metric-progress"><span style={{width:`${averageProgress}%`}} /></div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon violet"><Target size={19} /></span><span className="metric-trend neutral">{onTrack} {text("on track", "على المسار")}</span></div><div className="metric-value">{onTrack}</div><div className="metric-label">{text("Objectives on track", "أهداف على المسار")}</div><div className="metric-foot">{text(`${atRisk} need attention`, `${atRisk} تحتاج متابعة`)}</div></article>
        <article className="metric-card"><div className="metric-top"><span className="metric-icon amber"><Clock3 size={19} /></span><span className="metric-trend warning">{atRisk} {text("at risk", "تحتاج متابعة")}</span></div><div className="metric-value">{atRisk}</div><div className="metric-label">{text("Objectives needing attention", "أهداف تحتاج متابعة")}</div><div className="metric-foot">{text("Based on current demo status", "وفق حالات البيانات التجريبية")}</div></article>
      </section>

      <div className="dashboard-grid">
        <section className="panel progress-panel">
          <div className="panel-heading"><div><h3>{text("Objective progress", "تقدم الأهداف")}</h3><p>{text("Your progress across all assigned objectives", "مستوى تقدمك في جميع الأهداف المسندة إليك")}</p></div><Link href={`/${locale}/employee/objectives`} className="text-link">{text("View all", "عرض الكل")} <ArrowRight size={15} /></Link></div>
          <div className="progress-summary"><div><strong>{averageProgress}%</strong><span>{text("average completion", "متوسط الإنجاز")}</span></div><div className="progress-legend"><span><i className="legend-dot done" /> {text("Completed", "مكتمل")}</span><span><i className="legend-dot progress" /> {text("In progress", "قيد التنفيذ")}</span><span><i className="legend-dot risk" /> {text("At risk", "يحتاج متابعة")}</span></div></div>
          <div className="objective-progress-list">
            {objectives.slice(0,5).map((item) => <div className="objective-progress-row" key={item.id}><div className="objective-row-title"><span className="objective-id">{item.id}</span><strong>{ar ? item.titleAr : item.title}</strong></div><div className="progress-track"><span className={item.status} style={{width:`${item.progress}%`}} /></div><span className="progress-percent">{item.progress}%</span></div>)}
          </div>
        </section>

        <section className="panel actions-panel">
          <div className="panel-heading"><div><h3>{text("Your next steps", "خطواتك القادمة")}</h3><p>{text("A few things to keep you moving", "بعض المهام لمساعدتك على التقدم")}</p></div><span className="count-badge">03</span></div>
          <div className="action-list">
            {actionItems.map((item) => <div className="action-item" key={item.id}><span className={`action-icon ${item.type}`}>{item.type === "review" ? <ClipboardCheck size={17}/> : item.type === "development" ? <BookOpenIcon/> : <Target size={17}/>}</span><div className="action-copy"><strong>{text(item.title, item.id===1?"راجع أهداف أدائك":item.id===2?"أكمل خطة التطوير":"راجع تقدم الأهداف")}</strong><small>{text(item.detail, item.id===1?"8 أهداف · في انتظار مراجعة الموظف":item.id===2?"ملف الكفاءات · للعرض فقط":"دقة تقدير المهام")}</small><span><CalendarDays size={12}/> {text("Due", "الموعد")}: {item.due}</span></div><ChevronRight size={16} className="action-arrow"/></div>)}
          </div>
          <Link href={`/${locale}/employee/objectives`} className="panel-bottom-link">{text("Go to my objectives", "الانتقال إلى أهدافي")} <ArrowUpRight size={15}/></Link>
        </section>

        <section className="panel cycle-panel">
          <div className="panel-heading"><div><h3>{text("Your performance cycle", "دورة أدائك")}</h3><p>{text("2026 annual performance journey · Illustrative timeline", "رحلة الأداء السنوية لعام 2026 · جدول توضيحي")}</p></div><span className="soft-status"><span className="status-dot"/> {text("In progress", "جارية")}</span></div>
          <div className="cycle-steps">
            <div className="cycle-step completed"><span className="step-marker"><Check size={13}/></span><div><strong>{text("Objective setting", "تحديد الأهداف")}</strong><small>{text("Completed · Jan 15", "مكتمل · 15 يناير")}</small></div></div>
            <div className="cycle-step current"><span className="step-marker">2</span><div><strong>{text("Active performance", "فترة الأداء")}</strong><small>{text("In progress · Jan – Dec", "جارية · يناير – ديسمبر")}</small></div><span className="current-tag">{text("CURRENT", "الحالية")}</span></div>
            <div className="cycle-step upcoming"><span className="step-marker">3</span><div><strong>{text("Manager evaluation", "تقييم المدير")}</strong><small>{text("Upcoming · Dec 20", "قادمة · 20 ديسمبر")}</small></div></div>
            <div className="cycle-step upcoming"><span className="step-marker">4</span><div><strong>{text("Final results", "النتائج النهائية")}</strong><small>{text("Upcoming · Jan 2027", "قادمة · يناير 2027")}</small></div></div>
          </div>
        </section>

        <section className="panel competency-panel">
          <div className="panel-heading"><div><h3>{text("Competency framework", "إطار الكفاءات")}</h3><p>{text("The skills that shape your performance", "المهارات التي تشكل أداءك")}</p></div><span className="competency-count">{12} {text("demo competencies", "كفاءة تجريبية")}</span></div>
          <div className="competency-highlight"><div className="competency-icon"><Users size={20}/></div><div><strong>{text("People & professional skills", "المهارات الشخصية والمهنية")}</strong><small>{text("Aligned with your role and job family", "متوافقة مع دورك الوظيفي")}</small></div><span>{12}</span></div>
          <div className="competency-tags"><span>{text("Collaboration", "التعاون")}</span><span>{text("Ownership", "المسؤولية")}</span><span>{text("Quality", "الجودة")}</span><span>{text("Demo", "تجريبي")}</span></div>
          <div className="competency-note"><CircleAlert size={15}/>{text("Competencies are evaluated annually by your manager. Demo competency names are illustrative.", "يتم تقييم الكفاءات سنوياً بواسطة مديرك. أسماء الكفاءات المعروضة تجريبية.")}</div>
        </section>
      </div>
    </AppShell>
  );
}

function ClipboardCheck({size=17}:{size?:number}) { return <CheckCircle2 size={size}/>; }
function BookOpenIcon() { return <Target size={17}/>; }