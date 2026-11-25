"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, FileText, Info } from "lucide-react";
import { Button, Card, Col, Empty, Row, Tag, Typography } from "antd";

type Props = { user: any; cycles: any[]; plans: any[]; results: any[]; actionable: any[]; locale: string; ar: boolean };

function bilingual(value: any, ar: boolean) {
  if (!value) return "—";
  if (typeof value === "object") return ar ? value.ar || value.en || "—" : value.en || value.ar || "—";
  return String(value);
}
function dateLabel(value: any, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function EmployeeDashboardView({ user, cycles, plans, results, actionable, locale, ar }: Props) {
  const t = (en: string, a: string) => ar ? a : en;
  const name = user?.employee?.full_name?.split(" ")[0] || user?.name || t("there", "بك");
  const plan = plans[0], cycle = cycles[0];
  const activeCount = cycles.length;
  const publishedCount = results.filter((result: any) => result.published === true).length;
  const statusLabel = plan?.status?.label || bilingual(plan?.status, ar);
  const objectiveHref = `/${locale}/employee/objectives`, resultsHref = `/${locale}/employee/performance`;

  return <div className="employee-dashboard">
    <section className="employee-welcome">
      <div className="employee-welcome-glow" aria-hidden="true" />
      <div className="employee-welcome-content">
        {cycle ? <Tag className="employee-cycle-pill"><span className="employee-live-dot" />{bilingual(cycle.name, ar)} · {cycle.performance_year || t("Active appraisal period", "فترة التقييم الحالية")}</Tag> : <Tag className="employee-cycle-pill">{t("Performance workspace", "مساحة إدارة الأداء")}</Tag>}
        <Typography.Title level={2}>{t("Welcome", "مرحباً")}, {name}</Typography.Title>
        <Typography.Paragraph>{activeCount ? t(`You have ${activeCount} active cycle(s). Keep your objectives and performance plan up to date.`, `لديك ${activeCount} دورة نشطة. تابع أهدافك وخطة أدائك باستمرار.`) : t("Your performance overview is ready. New appraisal cycles will appear here when available.", "مساحة أدائك جاهزة. ستظهر دورات التقييم الجديدة هنا عند إتاحتها.")}</Typography.Paragraph>
        <div className="employee-welcome-actions">
          <Link href={objectiveHref}><Button type="primary" size="large">{t("Continue workflow", "متابعة سير العمل")} <ArrowRight size={16} /></Button></Link>
          <Link href={resultsHref} className="employee-secondary-link">{t("View my results", "عرض نتائجي")}</Link>
        </div>
      </div>
      <div className="employee-welcome-mark" aria-hidden="true"><div className="employee-welcome-mark-inner"><CheckCircle2 size={48} /></div></div>
    </section>

    <Row gutter={[16, 16]} className="employee-metrics">
      <Col xs={24} sm={12} lg={8}><Card className="employee-metric-card employee-metric-primary"><div className="employee-metric-top"><span>{t("Active cycles", "الدورات النشطة")}</span><Tag color="processing">{t("In progress", "قيد التنفيذ")}</Tag></div><div className="employee-metric-value">{activeCount}</div><div className="employee-metric-foot">{t("cycles available to you", "دورات متاحة لك")}</div></Card></Col>
      <Col xs={24} sm={12} lg={8}><Card className="employee-metric-card"><div className="employee-metric-top"><span>{t("Plans needing action", "خطط تحتاج إلى إجراء")}</span><Tag color={actionable.length ? "warning" : "default"}>{actionable.length ? t("Action required", "مطلوب إجراء") : t("Up to date", "محدّث")}</Tag></div><div className="employee-metric-value">{actionable.length}</div><div className="employee-metric-foot">{t("pending tasks", "مهام معلقة")}</div></Card></Col>
      <Col xs={24} sm={12} lg={8}><Card className="employee-metric-card"><div className="employee-metric-top"><span>{t("Published results", "النتائج المنشورة")}</span><Tag>{t("Official results", "نتائج معتمدة")}</Tag></div><div className="employee-metric-value">{publishedCount}</div><div className="employee-metric-foot">{t("evaluations finalized", "تقييمات نهائية")}</div></Card></Col>
    </Row>

    <Row gutter={[18, 18]} className="employee-dashboard-lower">
      <Col xs={24} xl={14}><Card className="employee-panel employee-cycles-panel" title={<span className="employee-panel-title">{t("Your cycles", "دوراتك")} <Tag>{cycles.length}</Tag></span>} extra={<Link href={`/${locale}/employee/history`}>{t("View history", "عرض السجل")}</Link>}>
        {cycles.length ? cycles.map((item: any) => <article className="employee-cycle-card" key={item.id}>
          <div className="employee-cycle-heading"><div><Typography.Title level={5}>{bilingual(item.name, ar) || t("Performance cycle", "دورة الأداء")}</Typography.Title><Typography.Text type="secondary">{t("Annual individual performance milestone", "مرحلة الأداء السنوي الفردي")}</Typography.Text></div><Tag color="processing">{item.current_stage || item.status?.label || item.status || t("Active", "نشطة")}</Tag></div>
          <div className="employee-cycle-meta"><span><CalendarDays size={15} /> {item.performance_year || t("Performance cycle", "دورة الأداء")}</span><span>{dateLabel(item.start_date, locale)} — {dateLabel(item.end_date, locale)}</span></div>
          <div className="employee-cycle-footer"><span><i /> {t("Current stage", "المرحلة الحالية")}: <strong>{item.current_stage || t("In progress", "قيد التنفيذ")}</strong></span><Link href={objectiveHref}>{t("Open cycle", "فتح الدورة")} <ArrowRight size={14} /></Link></div>
        </article>) : <Empty description={t("No active cycles are available right now.", "لا توجد دورات نشطة متاحة حالياً.")} />}
        {plan && <div className="employee-plan-summary"><div className="employee-plan-icon"><ClipboardList size={19} /></div><div className="employee-plan-copy"><strong>{t("My performance plan", "خطة أدائي")}</strong><span>{t("Current status", "الحالة الحالية")}: {statusLabel || "—"}</span></div><Link href={objectiveHref}>{t("View plan", "عرض الخطة")} <ArrowRight size={14} /></Link></div>}
      </Card></Col>
      <Col xs={24} xl={10}><Card className="employee-panel employee-next-panel" title={<span className="employee-panel-title">{t("Next actions", "الإجراءات التالية")}</span>} extra={<span className={`employee-status-indicator ${actionable.length ? "has-actions" : ""}`} />}>
        {actionable.length ? <div className="employee-action-list">{actionable.slice(0, 5).map((item: any) => <Link href={objectiveHref} className="employee-action-item" key={item.id}><span className="employee-action-icon"><FileText size={18} /></span><span className="employee-action-copy"><strong>{item.cycle?.name ? bilingual(item.cycle.name, ar) : t("Performance plan", "خطة الأداء")}</strong><small>{item.status?.label || t("Action required", "مطلوب إجراء")}</small></span><ArrowRight size={16} /></Link>)}</div> : <div className="employee-empty-state"><div className="employee-empty-icon"><CheckCircle2 size={35} /><span>{t("Done", "مكتمل")}</span></div><Typography.Title level={5}>{t("Nothing waiting on you right now", "لا توجد مهام بانتظارك الآن")}</Typography.Title><Typography.Paragraph type="secondary">{t("You have addressed all assigned tasks for the active milestone. You're up to date!", "لقد أنجزت جميع المهام المطلوبة للمرحلة الحالية. أنت على اطلاع كامل!")}</Typography.Paragraph></div>}
        <div className="employee-panel-footer"><Link href={objectiveHref}>{t("My plan", "خطتي")} <ArrowRight size={14} /></Link><span /><Link href={resultsHref}>{t("My results", "نتائجي")} <ArrowRight size={14} /></Link></div>
      </Card></Col>
    </Row>
    {cycle && <div className="employee-info-note"><Info size={17} /><span>{t("Your cycle is active. Review your personal objectives and check with your direct manager if your KPI definitions need updates.", "دورتك نشطة. راجع أهدافك الشخصية وتواصل مع مديرك المباشر إذا كانت مؤشرات الأداء تحتاج إلى تحديث.")}</span></div>}
  </div>;
}
