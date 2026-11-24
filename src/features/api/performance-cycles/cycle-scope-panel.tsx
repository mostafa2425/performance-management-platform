"use client";

import { DataTable } from "@/components/ui/data-table";

import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { CheckCircleFilled } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { cyclesApi, employeesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { previewQueryKey } from "./shared";
import { OptionsMultiSelect } from "./options-multi-select";
import { previewCandidates } from "./shared";

type ScopePayload = {
  departments: number[];
  job_titles: number[];
  employees: number[];
  excluded_employees: number[];
};

function normalizeIds(values?: Array<string | number> | null) {
  return (values || []).map((v) => Number(v)).filter((n) => !Number.isNaN(n));
}

function hasConfiguredScope(scope?: Partial<ScopePayload> | null) {
  if (!scope) return false;
  return (
    normalizeIds(scope.departments).length > 0 ||
    normalizeIds(scope.job_titles).length > 0 ||
    normalizeIds(scope.employees).length > 0 ||
    normalizeIds(scope.excluded_employees).length > 0
  );
}

function lookupName(map: Map<number, string>, id: number) {
  return map.get(id) || `#${id}`;
}

export function CycleScopePanel({
  cycleId,
  scope,
  status,
  managersCount,
  onActivate,
}: {
  cycleId: string;
  scope?: Partial<ScopePayload> | null;
  status?: string;
  managersCount?: number | null;
  onActivate: () => Promise<unknown> | void;
}) {
  const t = useTranslations("PerformanceCycles");
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [editingState, setEditingState] = useState<{ cycleId: string; value: boolean | null }>({ cycleId, value: null });\n  const editing = editingState.cycleId === cycleId ? editingState.value : null;\n  const setEditing = (value: boolean | null) => setEditingState({ cycleId, value });

  const included = Form.useWatch("employees", form) as Array<string | number> | undefined;
  const excluded = Form.useWatch("excluded_employees", form) as Array<string | number> | undefined;
  const departments = Form.useWatch("departments", form) as Array<string | number> | undefined;
  const jobTitles = Form.useWatch("job_titles", form) as Array<string | number> | undefined;

  const employees = useQuery({
    queryKey: [...queryKeys.employees, "scope-options"],
    queryFn: () => employeesApi.list({ per_page: 200 }),
  });

  const employeeRows = useMemo(() => (employees.data as any)?.data || [], [employees.data]);

  const cachedPreview = useQuery({
    queryKey: previewQueryKey(cycleId),
    queryFn: () => cyclesApi.preview(cycleId),
    enabled: false,
  });

  // Employees already in another active cycle (from employee flag or loaded preview) cannot be included.
  const blockedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const row of employeeRows) {
      if (row.in_other_active_cycle === true) ids.add(Number(row.id));
    }
    for (const row of previewCandidates(cachedPreview.data)) {
      if (row.status === "in_other_active_cycle") {
        const id = row.employee_id ?? row.employee?.id;
        if (id != null) ids.add(Number(id));
      }
    }
    return Array.from(ids);
  }, [employeeRows, cachedPreview.data]);

  const employeeOptions = useMemo(
    () =>
      employeeRows.map((x: any) => ({
        value: x.id,
        label: `${x.full_name} · ${x.code || x.email}`,
      })),
    [employeeRows],
  );

  const departmentOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of employeeRows) {
      const d = row.department;
      if (d?.id != null) map.set(Number(d.id), String(d.name || `#${d.id}`));
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeeRows]);

  const jobTitleOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of employeeRows) {
      const j = row.job_title;
      if (j?.id != null) map.set(Number(j.id), String(j.name || `#${j.id}`));
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [employeeRows]);

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const row of employeeRows) map.set(Number(row.id), String(row.full_name || row.code || row.id));
    return map;
  }, [employeeRows]);

  const departmentNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const opt of departmentOptions) map.set(Number(opt.value), opt.label);
    return map;
  }, [departmentOptions]);

  const jobTitleNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const opt of jobTitleOptions) map.set(Number(opt.value), opt.label);
    return map;
  }, [jobTitleOptions]);

  const scopeValues = useMemo(
    () => ({
      departments: normalizeIds(scope?.departments),
      job_titles: normalizeIds(scope?.job_titles),
      employees: normalizeIds(scope?.employees),
      excluded_employees: normalizeIds(scope?.excluded_employees),
    }),
    [scope],
  );

  useEffect(() => {
    setEditing(null);
  }, [cycleId]);

  const isEditing = editing ?? !hasConfiguredScope(scope);

  useEffect(() => {
    if (!isEditing) return;
    form.setFieldsValue(scopeValues);
  }, [isEditing, form, scopeValues]);

  const setScope = useMutation({
    mutationFn: (body: ScopePayload) => cyclesApi.setScope(cycleId, body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [...queryKeys.adminCycles, cycleId] });
      setEditing(false);
      modal.confirm({
        title: t("toast.scopeSaved"),
        icon: <CheckCircleFilled style={{ color: "#52c41a" }} />,
        okText: t("actions.activate"),
        cancelText: t("actions.close"),
        onOk: async () => {
          try {
            await onActivate();
          } catch {
            // Detailed activation errors are shown by CycleDetail.
          }
        },
      });
    },
    onError: (error: Error) => message.error(error.message),
  });

  if (status !== "draft") return null;

  const viewDepartments = scopeValues.departments;
  const viewJobTitles = scopeValues.job_titles;
  const viewEmployees = scopeValues.employees;
  const viewExcluded = scopeValues.excluded_employees;
  const configured = hasConfiguredScope(scope);

  const summaryTags = isEditing ? (
    <>
      <Tag color="purple">{t("scope.departmentsSummary", { count: departments?.length ?? 0 })}</Tag>
      <Tag color="cyan">{t("scope.jobTitlesSummary", { count: jobTitles?.length ?? 0 })}</Tag>
      <Tag color="blue">{t("scope.includedSummary", { count: included?.length ?? 0 })}</Tag>
      <Tag color="orange">{t("scope.excludedSummary", { count: excluded?.length ?? 0 })}</Tag>
      {managersCount != null && (
        <Tag color="geekblue">{t("scope.managersSummary", { count: managersCount })}</Tag>
      )}
    </>
  ) : (
    <>
      <Tag color="purple">{t("scope.departmentsSummary", { count: viewDepartments.length })}</Tag>
      <Tag color="cyan">{t("scope.jobTitlesSummary", { count: viewJobTitles.length })}</Tag>
      <Tag color="blue">{t("scope.includedSummary", { count: viewEmployees.length })}</Tag>
      <Tag color="orange">{t("scope.excludedSummary", { count: viewExcluded.length })}</Tag>
      {managersCount != null && (
        <Tag color="geekblue">{t("scope.managersSummary", { count: managersCount })}</Tag>
      )}
    </>
  );

  return (
    <Card
      title={
        <Space wrap size={[8, 8]}>
          <span>{t("sections.cycleScope")}</span>
          {/* {summaryTags} */}
        </Space>
      }
      extra={
        configured && !isEditing ? (
          <Button type="primary" onClick={() => setEditing(true)}>
            {t("actions.editScope")}
          </Button>
        ) : null
      }
    >
      {!isEditing && configured ? (
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          {(viewDepartments.length > 0 || viewJobTitles.length > 0) && (
            <Row gutter={[16, 12]}>
              {viewDepartments.length > 0 && (
                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">{t("fields.departments")}</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap size={[6, 6]}>
                      {viewDepartments.map((id) => (
                        <Tag key={`d-${id}`} color="purple">
                          {lookupName(departmentNameById, id)}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
              )}
              {viewJobTitles.length > 0 && (
                <Col xs={24} md={12}>
                  <Typography.Text type="secondary">{t("fields.jobTitles")}</Typography.Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap size={[6, 6]}>
                      {viewJobTitles.map((id) => (
                        <Tag key={`j-${id}`} color="cyan">
                          {lookupName(jobTitleNameById, id)}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </Col>
              )}
            </Row>
          )}

          <DataTable<{ id: number; kind: "included" | "excluded" }>
            rowKey={(row) => `${row.kind}-${row.id}`}
            size="middle"
            pagination={{ pageSize: 10 }}
            dataSource={[
              ...viewEmployees.map((id) => ({ id, kind: "included" as const })),
              ...viewExcluded.map((id) => ({ id, kind: "excluded" as const })),
            ]}
            locale={{ emptyText: t("scope.noEmployees") }}
            columns={[
              {
                title: t("fields.employee"),
                render: (_: unknown, row) => lookupName(employeeNameById, row.id),
              },
              {
                title: t("fields.status"),
                width: 140,
                render: (_: unknown, row) =>
                  row.kind === "excluded" ? (
                    <Tag color="orange">{t("scope.excluded")}</Tag>
                  ) : (
                    <Tag color="blue">{t("scope.included")}</Tag>
                  ),
              },
            ]}
          />
        </Space>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={scopeValues}
          onValuesChange={(changed) => {
            if ("employees" in changed) {
              const nextInclude = (changed.employees || []) as Array<string | number>;
              const currentExclude = (form.getFieldValue("excluded_employees") || []) as Array<string | number>;
              const includeSet = new Set(nextInclude.map(String));
              const cleaned = currentExclude.filter((id) => !includeSet.has(String(id)));
              if (cleaned.length !== currentExclude.length) form.setFieldValue("excluded_employees", cleaned);
              void form.validateFields(["excluded_employees"]).catch(() => undefined);
            }
            if ("excluded_employees" in changed) {
              const nextExclude = (changed.excluded_employees || []) as Array<string | number>;
              const currentInclude = (form.getFieldValue("employees") || []) as Array<string | number>;
              const excludeSet = new Set(nextExclude.map(String));
              const cleaned = currentInclude.filter((id) => !excludeSet.has(String(id)));
              if (cleaned.length !== currentInclude.length) form.setFieldValue("employees", cleaned);
              void form.validateFields(["employees"]).catch(() => undefined);
            }
          }}
          onFinish={(v) => {
            const includeIds = normalizeIds(v.employees);
            const excludeIds = normalizeIds(v.excluded_employees);
            const excludeSet = new Set(excludeIds.map(String));
            setScope.mutate({
              departments: normalizeIds(v.departments),
              job_titles: normalizeIds(v.job_titles),
              employees: includeIds.filter((id) => !excludeSet.has(String(id))),
              excluded_employees: excludeIds,
            });
          }}
        >
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12}>
              <Form.Item name="departments" label={t("fields.departments")}>
                <OptionsMultiSelect
                  options={departmentOptions}
                  loading={employees.isLoading}
                  placeholder={t("placeholders.departments")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="job_titles" label={t("fields.jobTitles")}>
                <OptionsMultiSelect
                  options={jobTitleOptions}
                  loading={employees.isLoading}
                  placeholder={t("placeholders.jobTitles")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="employees"
                label={t("fields.includeEmployees")}
                rules={[
                  {
                    validator: async (_, value?: Array<string | number>) => {
                      const other = (form.getFieldValue("excluded_employees") || []) as Array<string | number>;
                      const otherSet = new Set(other.map(String));
                      if ((value || []).some((id) => otherSet.has(String(id)))) {
                        throw new Error(t("validation.overlapEmployees"));
                      }
                    },
                  },
                ]}
              >
                <OptionsMultiSelect
                  options={employeeOptions}
                  loading={employees.isLoading}
                  disabledValues={[...(excluded || []), ...blockedIds]}
                  placeholder={t("placeholders.includeEmployees")}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="excluded_employees"
                label={t("fields.excludeEmployees")}
                dependencies={["employees"]}
                rules={[
                  {
                    validator: async (_, value?: Array<string | number>) => {
                      const other = (form.getFieldValue("employees") || []) as Array<string | number>;
                      const otherSet = new Set(other.map(String));
                      if ((value || []).some((id) => otherSet.has(String(id)))) {
                        throw new Error(t("validation.overlapEmployees"));
                      }
                    },
                  },
                ]}
              >
                <OptionsMultiSelect
                  options={employeeOptions}
                  loading={employees.isLoading}
                  disabledValues={included}
                  placeholder={t("placeholders.excludeEmployees")}
                />
              </Form.Item>
            </Col>
          </Row>
          <Space wrap>
            <Button type="primary" htmlType="submit" loading={setScope.isPending}>
              {t("actions.saveScope")}
            </Button>
            {configured && (
              <Button
                onClick={() => {
                  form.setFieldsValue(scopeValues);
                  setEditing(false);
                }}
              >
                {t("actions.cancel")}
              </Button>
            )}
            <Button
              onClick={() => form.resetFields()}
              disabled={
                !(departments?.length || jobTitles?.length || included?.length || excluded?.length)
              }
            >
              {t("scope.clearAll")}
            </Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}
