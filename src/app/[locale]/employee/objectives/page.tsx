"use client";

import { App, Alert, Avatar, Button, Card, Col, Collapse, Descriptions, Divider, Empty, Form, Input, Modal, Progress, Row, Select, Space, Statistic, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { competencies, employee, objectives } from "@/features/dashboard/mock-data";
import { CheckCircle2, Clock3, MessageSquare, Search, Sparkles, Target, UserRound, ChevronDown, ChevronRight } from "lucide-react";

const { Title, Text, Paragraph } = Typography;
type Decision = "approve" | "request";

export default function EmployeeObjectivesPage() {
  const ar = useLocale() === "ar";
  const { message } = App.useApp();
  const [expanded, setExpanded] = useState<string[]>(["OBJ-01"]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [comment, setComment] = useState("");
  const [submittedDecision, setSubmittedDecision] = useState<"approved" | "requested" | null>(null);
  const t = (en: string, arabic: string) => ar ? arabic : en;

  const filtered = useMemo(() => objectives.filter((item) => {
    const q = query.trim().toLocaleLowerCase();
    const matchesQuery = !q || item.title.toLocaleLowerCase().includes(q) || item.titleAr.includes(query.trim());
    return matchesQuery && (filter === "all" || item.status === filter);
  }), [query, filter]);

  const statusLabel = (status: string) => status === "completed"
    ? t("Completed", "مكتمل")
    : status === "at-risk" ? t("Needs attention", "يحتاج متابعة") : t("On track", "على المسار");
  const statusColor = (status: string) => status === "completed" ? "success" : status === "at-risk" ? "warning" : "processing";
  const objectiveWeight = objectives.reduce((sum, item) => sum + item.weight, 0);

  const submitDecision = () => {
    if (decision === "request" && !comment.trim()) return;
    setSubmittedDecision(decision === "approve" ? "approved" : "requested");
    message.success(decision === "approve"
      ? t("Demo approval recorded", "تم تسجيل الاعتماد التجريبي")
      : t("Demo modification request recorded", "تم تسجيل طلب التعديل التجريبي"));
    setDecision(null);
    setComment("");
  };

  const collapseItems = filtered.map((item, index) => {
    const title = ar ? item.titleAr : item.title;
    return {
      key: item.id,
      label: (
        <div className="eo-collapse-title">
          <Avatar shape="square" size={34}>{String(index + 1).padStart(2, "0")}</Avatar>
          <div className="eo-title-copy">
            <Text strong>{title}</Text>
            <Space size={6} wrap>
              <Tag color={statusColor(item.status)}>{statusLabel(item.status)}</Tag>
              <Text type="secondary">{t("Weight", "الوزن")}: {item.weight}%</Text>
              <Text type="secondary">SMART {item.smartScore}%</Text>
            </Space>
          </div>
          <div className="eo-title-progress">
            <Progress type="circle" percent={item.progress} size={42} strokeWidth={9} />
          </div>
        </div>
      ),
      children: (
        <div className="eo-objective-details">
          <Row gutter={[20, 16]}>
            <Col xs={24} lg={15}>
              <Text type="secondary">{t("Objective description", "وصف الهدف")}</Text>
              <Paragraph className="eo-description">{ar ? item.descriptionAr : item.description}</Paragraph>
              <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
                { key: "weight", label: t("Objective weight", "وزن الهدف"), children: <Text strong>{item.weight}%</Text> },
                { key: "due", label: t("Due date", "تاريخ الاستحقاق"), children: item.dueDate },
                { key: "status", label: t("Status", "الحالة"), children: <Tag color={statusColor(item.status)}>{statusLabel(item.status)}</Tag> },
                { key: "smart", label: "SMART", children: <Text strong>{item.smartScore}%</Text> }
              ]} />
            </Col>
            <Col xs={24} lg={9}>
              <Card size="small" className="eo-progress-card">
                <Space align="center" className="eo-progress-heading">
                  <Target size={17} />
                  <Text strong>{t("Progress", "نسبة الإنجاز")}</Text>
                </Space>
                <Title level={2} className="eo-progress-value">{item.progress}%</Title>
                <Progress percent={item.progress} status={item.status === "at-risk" ? "exception" : "normal"} />
                <Text type="secondary">{t("SMART quality score", "تقييم جودة الهدف")}</Text>
                <Progress percent={item.smartScore} size="small" />
              </Card>
            </Col>
          </Row>
          <Alert type="info" showIcon message={t("Read-only objective", "هدف للعرض فقط")} description={t("You can review the proposed objective and its progress. Editing objectives and KPIs is not available in the employee review stage.", "يمكنك مراجعة الهدف المقترح ونسبة إنجازه. تعديل الأهداف ومؤشرات الأداء غير متاح في مرحلة مراجعة الموظف.")} />
        </div>
      )
    };
  });

  return (
    <AppShell role="employee" title={t("My objectives", "أهدافي")} subtitle={t("Review your performance plan, understand expectations and follow your progress throughout the cycle.", "راجع خطة أدائك وافهم التوقعات وتابع تقدمك طوال دورة الأداء.")}>
      <Space direction="vertical" size={20} className="eo-page">
        <Card className="eo-profile-card" bordered={false}>
          <Row gutter={[20, 18]} align="middle">
            <Col xs={24} lg={8}>
              <Space size={14} align="center">
                <Avatar size={54} icon={<UserRound />} className="eo-profile-avatar">MG</Avatar>
                <div>
                  <Title level={4} className="eo-profile-name">{employee.name}</Title>
                  <Space wrap size={6}>
                    <Text type="secondary">#{employee.employeeId}</Text>
                    <Tag color="default">{t("Employee", "موظف")}</Tag>
                  </Space>
                  <Text type="secondary">{employee.email}</Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} lg={16}>
              <Descriptions size="small" column={{ xs: 1, sm: 2, xl: 3 }} items={[
                { key: "unit", label: t("Business unit", "وحدة الأعمال"), children: employee.businessUnit },
                { key: "department", label: t("Department", "الإدارة"), children: employee.department },
                { key: "title", label: t("Job title", "المسمى الوظيفي"), children: employee.title },
                { key: "location", label: t("Location", "الموقع"), children: employee.location },
                { key: "manager", label: t("Line manager", "المدير المباشر"), children: employee.manager },
                { key: "cycle", label: t("Performance cycle", "دورة الأداء"), children: employee.cycle }
              ]} />
            </Col>
          </Row>
        </Card>

        <Alert
          showIcon
          type={submittedDecision ? "success" : "warning"}
          icon={submittedDecision ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
          message={submittedDecision
            ? submittedDecision === "approved" ? t("Demo approval recorded", "تم تسجيل الاعتماد التجريبي") : t("Demo modification request recorded", "تم تسجيل طلب التعديل التجريبي")
            : t("Performance plan awaiting your review", "خطة الأداء في انتظار مراجعتك")}
          description={submittedDecision
            ? t("This is a local demo state only. No backend workflow or permanent record has been created.", "هذه حالة تجريبية محلية فقط. لم يتم إنشاء إجراء فعلي أو حفظ دائم في النظام.")
            : t("Review the objectives and competencies below. You can approve the plan or request modifications with a comment.", "راجع الأهداف والكفاءات أدناه. يمكنك اعتماد الخطة أو طلب تعديلها مع كتابة تعليق.")}
          action={!submittedDecision ? (
            <Space wrap>
              <Button icon={<MessageSquare size={15} />} onClick={() => setDecision("request")}>{t("Request changes", "طلب تعديل")}</Button>
              <Button type="primary" icon={<CheckCircle2 size={15} />} onClick={() => setDecision("approve")}>{t("Approve plan", "اعتماد الخطة")}</Button>
            </Space>
          ) : <Tag color="success">{submittedDecision === "approved" ? t("Approved (demo)", "تم الاعتماد (تجريبي)") : t("Changes requested (demo)", "طُلب التعديل (تجريبي)")}</Tag>}
        />

        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}><Card className="eo-stat-card"><Statistic title={t("Categories", "التصنيفات")} value={new Set(objectives.map(x => x.category)).size} prefix={<Target size={17} />} /></Card></Col>
          <Col xs={12} md={6}><Card className="eo-stat-card"><Statistic title={t("Objectives", "الأهداف")} value={objectives.length} prefix={<Sparkles size={17} />} /></Card></Col>
          <Col xs={12} md={6}><Card className="eo-stat-card"><Statistic title={t("Competencies", "الكفاءات")} value={competencies.length} prefix={<CheckCircle2 size={17} />} /></Card></Col>
          <Col xs={12} md={6}><Card className="eo-stat-card"><Statistic title={t("Objective weight", "أوزان الأهداف")} value={objectiveWeight} suffix="%" /></Card></Col>
        </Row>

        <Card
          title={<Space><Target size={18} /><span>{t("Objectives", "الأهداف")}</span><Tag color="blue">{filtered.length} / {objectives.length}</Tag></Space>}
          extra={<Space wrap>
            <Button size="small" onClick={() => setExpanded(filtered.map(x => x.id))}>{t("Expand all", "توسيع الكل")}</Button>
            <Button size="small" onClick={() => setExpanded([])}>{t("Collapse all", "طي الكل")}</Button>
          </Space>}
          className="eo-section-card"
        >
          <Row gutter={[12, 12]} className="eo-filter-row">
            <Col xs={24} md={15}>
              <Input allowClear prefix={<Search size={16} />} value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Search by objective title...", "ابحث باسم الهدف...")} />
            </Col>
            <Col xs={24} md={9}>
              <Select
                value={filter}
                onChange={setFilter}
                className="eo-full-width"
                options={[
                  { value: "all", label: t("All statuses", "كل الحالات") },
                  { value: "on-track", label: t("On track", "على المسار") },
                  { value: "at-risk", label: t("Needs attention", "يحتاج متابعة") },
                  { value: "completed", label: t("Completed", "مكتمل") }
                ]}
              />
            </Col>
          </Row>
          <Divider />
          {filtered.length ? <Collapse items={collapseItems} activeKey={expanded} onChange={keys => setExpanded(Array.isArray(keys) ? keys : [keys])} expandIconPosition={ar ? "end" : "start"} /> : <Empty description={t("No objectives match your filters", "لا توجد أهداف تطابق عوامل التصفية")} />}
        </Card>

        <Card
          className="eo-section-card"
          title={<Space><CheckCircle2 size={18} /><span>{t("Core competencies", "الكفاءات الأساسية")}</span><Tag>{competencies.length}</Tag></Space>}
          extra={<Tag color="default">{t("Read only", "للعرض فقط")}</Tag>}
        >
          <Paragraph type="secondary">{t("Competencies assigned to your job title. These are reviewed annually and cannot be edited here.", "الكفاءات المرتبطة بمسمّاك الوظيفي. تتم مراجعتها سنويًا ولا يمكن تعديلها من هنا.")}</Paragraph>
          <Row gutter={[10, 10]}>
            {competencies.map((item, index) => (
              <Col xs={24} sm={12} lg={8} key={item}>
                <Card size="small" className="eo-competency-item">
                  <Space align="center">
                    <Avatar size="small" shape="square">{String(index + 1).padStart(2, "0")}</Avatar>
                    <Text strong>{ar ? ["تحقيق الأهداف","دعم الفريق","جودة العمل","المسؤولية واتخاذ القرار","التعلم المستمر","تحسين العمليات","تطبيق المعرفة","الالتزام بالسياسات","الالتزام بالمواعيد","التمثيل المهني","الانضباط والمساءلة","الإنتاجية والمخرجات"][index] : item}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Alert type="info" showIcon message={t("Demo environment", "بيئة تجريبية")} description={t("Review decisions are held in local page state only. Backend integration is required to submit an auditable approval or modification request.", "قرارات المراجعة محفوظة في حالة الصفحة المحلية فقط. يلزم ربط Backend لإرسال اعتماد أو طلب تعديل قابل للتدقيق.")} />
      </Space>

      <Modal
        open={decision !== null}
        title={decision === "approve" ? t("Confirm performance plan approval", "تأكيد اعتماد خطة الأداء") : t("Request plan modifications", "طلب تعديل الخطة")}
        onCancel={() => { setDecision(null); setComment(""); }}
        onOk={submitDecision}
        okText={decision === "approve" ? t("Confirm approval", "تأكيد الاعتماد") : t("Submit request", "إرسال الطلب")}
        cancelText={t("Cancel", "إلغاء")}
        okButtonProps={{ disabled: decision === "request" && !comment.trim(), danger: false }}
        destroyOnHidden
      >
        {decision === "approve" ? (
          <Alert type="warning" showIcon message={t("Approval locks the proposed plan", "الاعتماد يؤدي إلى قفل الخطة المقترحة")} description={t("Please make sure you reviewed the objectives, targets, weights and competencies before confirming.", "تأكد من مراجعة الأهداف والمستهدفات والأوزان والكفاءات قبل التأكيد.")} />
        ) : (
          <Form layout="vertical">
            <Form.Item label={t("Comment (required)", "التعليق (إلزامي)")} required>
              <Input.TextArea rows={4} showCount maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder={t("Explain what needs to be changed...", "وضح ما الذي يحتاج إلى تعديل...")} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </AppShell>
  );
}
