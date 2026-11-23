"use client";

import { Alert, Card, Collapse, Empty, Progress, Row, Col, Space, Statistic, Tag, Typography } from "antd";
import { bilingual, commentsForTarget, type OpenComments, weightPct } from "./plan-shared";

function CommentList({ comments, ar }: { comments: Array<{ body: string }>; ar: boolean }) {
  if (!comments.length) return null;
  return (
    <Space orientation="vertical" size={6} style={{ width: "100%", marginTop: 10 }}>
      {comments.map((comment, index) => (
        <Alert key={`${comment.body}-${index}`} type="warning" showIcon
          title={ar ? "ملاحظة على العنصر" : "Item comment"} description={comment.body} />
      ))}
    </Space>
  );
}

function scoreLabel(score: unknown) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return score <= 100 ? score : score / 100;
}

export function PlanReadonlyTree({
  objectives, openComments, ar, contentVisible = true,
}: {
  objectives?: any[] | null;
  openComments?: OpenComments;
  ar: boolean;
  contentVisible?: boolean;
}) {
  const t = (en: string, arabic: string) => (ar ? arabic : en);

  if (!contentVisible) {
    return <Alert type="info" showIcon title={t(
      "Plan content is not visible yet for your role.",
      "محتوى الخطة غير ظاهر لصلاحيتك حالياً.",
    )} />;
  }

  const rows = objectives || [];
  if (!rows.length) return <Empty description={t("No objectives yet.", "لا توجد أهداف بعد.")} />;

  const planComments = commentsForTarget(openComments || null, "plan");
  const categories = new Map<string, { id: string; name: string; objectives: any[] }>();
  rows.forEach((objective: any, index: number) => {
    const categoryId = String(objective.category_id ?? objective.category_name?.en ?? objective.category_name?.ar ?? "uncategorized");
    const categoryName = bilingual(objective.category_name, ar) || t("Uncategorized", "غير مصنف");
    if (!categories.has(categoryId)) categories.set(categoryId, { id: categoryId, name: categoryName, objectives: [] });
    categories.get(categoryId)!.objectives.push({ ...objective, __index: index });
  });

  const kpiCount = rows.reduce((sum: number, objective: any) => sum + (objective.kpis || []).length, 0);
  const totalWeight = rows.reduce((sum: number, objective: any) =>
    sum + (objective.kpis || []).reduce((part: number, kpi: any) => part + weightPct(kpi.weight_bp), 0), 0);
  const weightReady = Math.abs(totalWeight - 100) < 0.01;

  return (
    <Space orientation="vertical" size={14} style={{ width: "100%" }}>
      {planComments.length > 0 && (
        <Alert type="warning" showIcon
          title={t("Plan-level comments", "ملاحظات على مستوى الخطة")}
          description={<Space orientation="vertical" size={4}>
            {planComments.map((comment, index) => <span key={index}>{comment.body}</span>)}
          </Space>} />
      )}

      <Row gutter={[12, 12]}>
        <Col xs={12} md={8}>
          <Card size="small"><Statistic title={t("Categories", "التصنيفات")} value={categories.size} /></Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small"><Statistic title={t("Objectives", "الأهداف")} value={rows.length} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title={t("Total KPI weight", "إجمالي أوزان المؤشرات")}
              value={totalWeight} precision={2} suffix="%" valueStyle={{ color: weightReady ? "#16a34a" : "#d97706" }} />
            <Progress percent={Math.min(totalWeight, 100)} showInfo={false}
              status={weightReady ? "success" : "active"} size="small" />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
        <Typography.Text type="secondary">
          {t("Expand a category to review its objectives and KPIs.", "افتح التصنيف لمراجعة الأهداف ومؤشرات الأداء التابعة له.")}
        </Typography.Text>
        <Typography.Text type="secondary">{kpiCount} {t("KPIs", "مؤشرات أداء")}</Typography.Text>
      </Space>

      <Collapse
        items={Array.from(categories.values()).map((category) => ({
          key: category.id,
          label: (
            <Space wrap>
              <Typography.Text strong>{category.name}</Typography.Text>
              <Tag>{category.objectives.length} {t("Objectives", "أهداف")}</Tag>
              <Tag color="blue">{category.objectives.reduce((sum: number, o: any) => sum + (o.kpis || []).length, 0)} {t("KPIs", "مؤشرات")}</Tag>
            </Space>
          ),
          children: (
            <Collapse
              items={category.objectives.map((objective: any) => {
                const objectiveKpis = objective.kpis || [];
                const objectiveWeight = objectiveKpis.reduce((sum: number, kpi: any) => sum + weightPct(kpi.weight_bp), 0);
                return {
                  key: String(objective.id ?? objective.__index),
                  label: (
                    <Space wrap size={8}>
                      <Typography.Text strong>{objective.text || t("Untitled objective", "هدف بلا عنوان")}</Typography.Text>
                      <Tag>{t("Objective", "هدف")}</Tag>
                      <Tag color="blue">{objectiveWeight.toFixed(2)}%</Tag>
                      <Typography.Text type="secondary">{objectiveKpis.length} {t("KPIs", "مؤشرات")}</Typography.Text>
                    </Space>
                  ),
                  children: (
                    <Space orientation="vertical" size={12} style={{ width: "100%" }}>
                      <CommentList ar={ar} comments={commentsForTarget(openComments || null, "objective", objective.id)} />
                      {objectiveKpis.length ? (
                        <Collapse
                          items={objectiveKpis.map((kpi: any, kpiIndex: number) => {
                            const smartScore = scoreLabel(kpi.smart_score);
                            return {
                              key: String(kpi.id ?? kpiIndex),
                              label: (
                                <Space wrap size={8}>
                                  <Typography.Text strong>{kpi.name || t("Untitled KPI", "مؤشر بلا اسم")}</Typography.Text>
                                  <Tag>{weightPct(kpi.weight_bp).toFixed(2)}%</Tag>
                                  {smartScore !== null ? <Tag color={smartScore >= 70 ? "success" : "warning"}>SMART {smartScore.toFixed(0)}%</Tag> : null}
                                </Space>
                              ),
                              children: (
                                <Card size="small" type="inner">
                                  <Row gutter={[12, 12]}>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Measurement", "نوع القياس")}</Typography.Text><div>{String(kpi.measurement_type || "—").replaceAll("_", " ")}</div></Col>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Unit", "الوحدة")}</Typography.Text><div>{kpi.unit || "—"}</div></Col>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Target", "المستهدف")}</Typography.Text><div>{kpi.target ?? "—"}</div></Col>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Baseline", "خط الأساس")}</Typography.Text><div>{kpi.baseline ?? "—"}</div></Col>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Weight", "الوزن")}</Typography.Text><div>{weightPct(kpi.weight_bp).toFixed(2)}%</div></Col>
                                    <Col xs={12} md={6}><Typography.Text type="secondary">{t("Calculation direction", "اتجاه الاحتساب")}</Typography.Text><div>{kpi.direction === "lower" ? t("Lower is better", "الأقل أفضل") : t("Higher is better", "الأعلى أفضل")}</div></Col>
                                  </Row>
                                  {smartScore !== null ? <div style={{ marginTop: 14 }}>
                                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                      <Typography.Text strong>{t("SMART score", "نتيجة SMART")}</Typography.Text>
                                      <Typography.Text strong>{smartScore.toFixed(0)}%</Typography.Text>
                                    </Space>
                                    <Progress percent={Math.max(0, Math.min(100, smartScore))} />
                                  </div> : null}
                                  <CommentList ar={ar} comments={commentsForTarget(openComments || null, "kpi", kpi.id)} />
                                </Card>
                              ),
                            };
                          })}
                        />
                      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("No KPIs under this objective.", "لا توجد مؤشرات أداء لهذا الهدف.")} />}
                    </Space>
                  ),
                };
              })}
            />
          ),
        }))}
      />
    </Space>
  );
}
