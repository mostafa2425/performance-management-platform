"use client";

import Link from "next/link";
import { Alert, Button, Card, Col, Empty, Row, Skeleton, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { usePerformanceCycle } from "@/features/performance-cycles/performance-cycle-provider";
import { useAuthSession } from "@/lib/auth/session";
import { cyclesApi, plansApi, resultsApi } from "@/lib/api/endpoints";
import { EmployeeDashboardView } from "@/features/api/employee-dashboard-view";
import "./employee-dashboard.css";

function bilingual(value: any, ar: boolean) {
  if (!value) return "—";
  if (typeof value === "object") return ar ? value.ar || value.en : value.en || value.ar;
  return String(value);
}

export default function DashboardPage() {
  const ar = useLocale() === "ar";
  const locale = ar ? "ar" : "en";
  const { user, isReady, isAuthenticated } = useAuthSession();
  const { cycleId, activeCycle } = usePerformanceCycle();
  const t = (en: string, a: string) => (ar ? a : en);

  const cycles = useQuery({ queryKey: ["cycles"], queryFn: cyclesApi.mine, enabled: isAuthenticated });
  const plans = useQuery({
    queryKey: ["plans", "dashboard", cycleId],
    queryFn: () => plansApi.list({ filter: cycleId ? { cycle_id: cycleId } : {}, per_page: 100 }),
    enabled: isAuthenticated && Boolean(cycleId),
  });
  const results = useQuery({
    queryKey: ["results", "dashboard", cycleId],
    queryFn: () => resultsApi.list(cycleId),
    enabled: isAuthenticated && Boolean(cycleId),
  });

  const busy = !isReady || cycles.isLoading || plans.isLoading || results.isLoading;
  const error = cycles.error || plans.error || results.error;
  const cycleRows = cycles.data || [];
  const planRows = (plans.data as any)?.data || [];
  const resultRows = results.data || [];
  const active = cycleRows.filter((c: any) => (c.status?.key || c.status) === "active");
  const actionable = planRows.filter((p: any) => (p.allowed_actions || []).some((a: string) => a !== "edit_content"));
  const role = user?.roles?.admin ? "admin" : user?.roles?.manager ? "manager" : "employee";

  const primaryHref =
    role === "admin"
      ? `/${locale}/admin/performance-cycles`
      : role === "manager"
        ? `/${locale}/manager/objectives`
        : `/${locale}/employee/objectives`;

  if (role === "employee") {
    const employeeCycles = active.filter((cycle: any) => cycle.id === cycleId && cycle.my_roles?.member !== false);
    if (employeeCycles.length === 0 && activeCycle?.my_roles?.member) employeeCycles.push(activeCycle);
    return (
      <AppShell
        title={t("Overview", "نظرة عامة")}
        subtitle={t("Focus on the next step in your performance cycle.", "ركز على الخطوة التالية في دورة الأداء.")}
      >
        {busy ? (
          <Skeleton active />
        ) : error ? (
          <Alert type="error" showIcon title={(error as Error).message} />
        ) : (
          <EmployeeDashboardView
            user={user}
            cycles={employeeCycles}
            plans={planRows}
            results={resultRows}
            actionable={actionable}
            locale={locale}
            ar={ar}
          />
        )}
      </AppShell>
    );
  }

  const shortcuts =
    role === "admin"
      ? [
          { href: `/${locale}/admin/performance-cycles`, label: t("Cycles", "الدورات") },
          { href: `/${locale}/admin/plan-reviews`, label: t("Plan reviews", "مراجعة الخطط") },
          { href: `/${locale}/admin/approvals`, label: t("Final review", "المراجعة النهائية") },
        ]
      : role === "manager"
        ? [
            { href: `/${locale}/manager/objectives`, label: t("Team plans", "خطط الفريق") },
            { href: `/${locale}/manager/evaluation`, label: t("Evaluation", "التقييم") },
            { href: `/${locale}/manager/year-group`, label: t("Year group", "مجموعة السنة") },
          ]
        : [
            { href: `/${locale}/employee/objectives`, label: t("My plan", "خطتي") },
            { href: `/${locale}/employee/performance`, label: t("My results", "نتائجي") },
          ];

  return (
    <AppShell
      title={t("Overview", "نظرة عامة")}
      subtitle={t("Focus on the next step in the performance cycle.", "ركز على الخطوة التالية في دورة الأداء.")}
    >
      {busy ? (
        <Skeleton active />
      ) : error ? (
        <Alert type="error" showIcon title={(error as Error).message} />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              {t("Welcome", "مرحباً")}, {user?.employee?.full_name?.split(" ")[0] || user?.name || ""}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {active.length
                ? t(`${active.length} active cycle(s) available to you.`, `لديك ${active.length} دورة نشطة.`)
                : t("No active cycle yet. Start from the main workflow below.", "لا توجد دورة نشطة بعد. ابدأ من سير العمل أدناه.")}
            </Typography.Paragraph>
            <Link href={primaryHref}>
              <Button type="primary">{t("Continue workflow", "متابعة سير العمل")}</Button>
            </Link>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">{t("Active cycles", "الدورات النشطة")}</Typography.Text>
                <Typography.Title level={2} style={{ margin: "8px 0 0" }}>
                  {active.length}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">{t("Plans needing action", "خطط تحتاج إجراء")}</Typography.Text>
                <Typography.Title level={2} style={{ margin: "8px 0 0" }}>
                  {actionable.length}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Typography.Text type="secondary">{t("Published results", "النتائج المنشورة")}</Typography.Text>
                <Typography.Title level={2} style={{ margin: "8px 0 0" }}>
                  {resultRows.filter((r: any) => r.published).length}
                </Typography.Title>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            <Col xs={24} lg={14}>
              <Card title={t("Your cycles", "دوراتك")}>
                {active.length ? (
                  active.map((c: any) => (
                    <div key={c.id} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
                      <Typography.Text strong>{bilingual(c.name, ar)}</Typography.Text>
                      <div>
                        <Tag color="green">{c.current_stage || c.status}</Tag>
                        <Typography.Text type="secondary">
                          {c.performance_year} · {c.start_date} — {c.end_date}
                        </Typography.Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description={t("No active cycles", "لا توجد دورات نشطة")} />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={t("Next actions", "الإجراءات التالية")}>
                {actionable.length ? (
                  actionable.slice(0, 5).map((p: any) => (
                    <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                      <Typography.Text strong>
                        {p.employee?.name || p.employee?.full_name || `Plan #${p.id}`}
                      </Typography.Text>
                      <div>
                        <Tag>{p.status?.label || "—"}</Tag>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description={t("Nothing waiting on you right now.", "لا يوجد شيء بانتظارك الآن.")} />
                )}
                <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {shortcuts.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label} →
                    </Link>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </AppShell>
  );
}
