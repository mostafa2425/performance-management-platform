"use client";

import { DataTable } from "@/components/ui/data-table";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { employeesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import type { ApiEmployee } from "@/lib/api/types";

type OrgRef = { id: number; name?: string | null; type?: string | null } | null | undefined;

function refName(ref: OrgRef) {
  return ref?.name?.trim() || "—";
}

function optionMap(rows: ApiEmployee[], pick: (row: ApiEmployee) => OrgRef) {
  const map = new Map<number, string>();
  for (const row of rows) {
    const ref = pick(row);
    if (ref?.id != null) map.set(Number(ref.id), String(ref.name || `#${ref.id}`));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }));
}

function statusTag(status?: string | null, ar?: boolean) {
  const active = status === "active";
  const label = active
    ? ar
      ? "نشط"
      : "Active"
    : status === "terminated"
      ? ar
        ? "منتهي الخدمة"
        : "Terminated"
      : status || "—";
  if (active) {
    return (
      <Tag
        style={{
          marginInlineEnd: 0,
          color: "#166534",
          background: "#dcfce7",
          borderColor: "#86efac",
        }}
      >
        {label}
      </Tag>
    );
  }
  return (
    <Tag color={status === "terminated" ? "default" : "processing"} style={{ marginInlineEnd: 0 }}>
      {label}
    </Tag>
  );
}

function EmployeeDetail({
  employee,
  ar,
  t,
}: {
  employee: ApiEmployee;
  ar: boolean;
  t: (e: string, a: string) => string;
}) {
  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {employee.full_name}
        </Typography.Title>
        <Typography.Text type="secondary">
          {employee.code ? `#${employee.code}` : "—"}
          {employee.email ? ` · ${employee.email}` : ""}
        </Typography.Text>
      </div>
      <Space wrap>
        {statusTag(employee.status, ar)}
        {employee.is_active != null && (
          <Tag color={employee.is_active ? "blue" : "default"}>
            {employee.is_active ? t("Active account", "حساب نشط") : t("Inactive account", "حساب غير نشط")}
          </Tag>
        )}
        {employee.employment_type?.name && <Tag color="cyan">{employee.employment_type.name}</Tag>}
        {employee.department?.name && <Tag>{employee.department.name}</Tag>}
      </Space>
      <Descriptions
        size="small"
        bordered
        column={1}
        items={[
          { key: "code", label: t("Employee code", "الرقم الوظيفي"), children: employee.code || "—" },
          { key: "jisr", label: t("Jisr ID", "معرف جسر"), children: employee.jisr_id || "—" },
          { key: "email", label: t("Email", "البريد الإلكتروني"), children: employee.email || "—" },
          { key: "status", label: t("Status", "الحالة"), children: statusTag(employee.status, ar) },
          {
            key: "job",
            label: t("Job title", "المسمى الوظيفي"),
            children: refName(employee.job_title),
          },
          {
            key: "dept",
            label: t("Department", "الإدارة"),
            children: refName(employee.department),
          },
          {
            key: "bu",
            label: t("Business unit", "وحدة الأعمال"),
            children: refName(employee.business_unit),
          },
          {
            key: "loc",
            label: t("Location", "الموقع"),
            children: refName(employee.location),
          },
          {
            key: "etype",
            label: t("Employment type", "نوع التوظيف"),
            children: refName(employee.employment_type),
          },
          {
            key: "join",
            label: t("Joining date", "تاريخ الالتحاق"),
            children: employee.joining_date || "—",
          },
          {
            key: "term",
            label: t("Terminate date", "تاريخ إنهاء الخدمة"),
            children: employee.terminate_date || "—",
          },
          {
            key: "mgr",
            label: t("Line manager ID", "معرف المدير المباشر"),
            children: employee.line_manager_id ?? "—",
          },
        ]}
      />
    </Space>
  );
}

export default function ApiEmployeesWorkspace() {
  const ar = useLocale() === "ar";
  const t = (e: string, a: string) => (ar ? a : e);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [departmentId, setDepartmentId] = useState<number>();
  const [businessUnitId, setBusinessUnitId] = useState<number>();
  const [locationId, setLocationId] = useState<number>();
  const [jobTitleId, setJobTitleId] = useState<number>();
  const [employmentTypeId, setEmploymentTypeId] = useState<number>();
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  const listParams = useMemo(() => {
    const p: Record<string, unknown> = { per_page: 200 };
    if (status) p["filter[status]"] = status;
    return p;
  }, [status]);

  const list = useQuery({
    queryKey: [...queryKeys.employees, "directory", listParams],
    queryFn: () => employeesApi.list(listParams),
  });

  const detail = useQuery({
    queryKey: [...queryKeys.employees, "detail", selectedId],
    queryFn: () => employeesApi.get(selectedId!),
    enabled: selectedId != null,
  });

  const allRows = useMemo(
    () => ((list.data as { data?: ApiEmployee[] } | undefined)?.data || []) as ApiEmployee[],
    [list.data],
  );

  const departmentOptions = useMemo(() => optionMap(allRows, (r) => r.department), [allRows]);
  const businessUnitOptions = useMemo(() => optionMap(allRows, (r) => r.business_unit), [allRows]);
  const locationOptions = useMemo(() => optionMap(allRows, (r) => r.location), [allRows]);
  const jobTitleOptions = useMemo(() => optionMap(allRows, (r) => r.job_title), [allRows]);
  const employmentTypeOptions = useMemo(
    () => optionMap(allRows, (r) => r.employment_type),
    [allRows],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((row) => {
      if (departmentId != null && Number(row.department?.id) !== departmentId) return false;
      if (businessUnitId != null && Number(row.business_unit?.id) !== businessUnitId) return false;
      if (locationId != null && Number(row.location?.id) !== locationId) return false;
      if (jobTitleId != null && Number(row.job_title?.id) !== jobTitleId) return false;
      if (employmentTypeId != null && Number(row.employment_type?.id) !== employmentTypeId)
        return false;
      if (!q) return true;
      const haystack = [row.full_name, row.email, row.code, row.jisr_id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    allRows,
    search,
    departmentId,
    businessUnitId,
    locationId,
    jobTitleId,
    employmentTypeId,
  ]);

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    departmentId != null ||
    businessUnitId != null ||
    locationId != null ||
    jobTitleId != null ||
    employmentTypeId != null;

  const clearFilters = () => {
    setSearch("");
    setStatus(undefined);
    setDepartmentId(undefined);
    setBusinessUnitId(undefined);
    setLocationId(undefined);
    setJobTitleId(undefined);
    setEmploymentTypeId(undefined);
  };

  const detailEmployee = (detail.data as ApiEmployee | undefined) ||
    allRows.find((r) => String(r.id) === String(selectedId));

  return (
    <AppShell
      role="admin"
      title={t("Employees", "الموظفون")}
      subtitle={t(
        "Read-only employee directory synchronized from Jisr.",
        "دليل الموظفين للقراءة فقط والمتزامن من نظام جسر.",
      )}
    >
      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} md={8}>
            <Input.Search
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "Search name, email, or code",
                "بحث بالاسم أو البريد أو الرقم الوظيفي",
              )}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              style={{ width: "100%" }}
              value={status}
              onChange={setStatus}
              placeholder={t("Status", "الحالة")}
              options={[
                { value: "active", label: t("Active", "نشط") },
                { value: "terminated", label: t("Terminated", "منتهي الخدمة") },
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={departmentId}
              onChange={setDepartmentId}
              placeholder={t("Department", "الإدارة")}
              options={departmentOptions}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={businessUnitId}
              onChange={setBusinessUnitId}
              placeholder={t("Business unit", "وحدة الأعمال")}
              options={businessUnitOptions}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={locationId}
              onChange={setLocationId}
              placeholder={t("Location", "الموقع")}
              options={locationOptions}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={jobTitleId}
              onChange={setJobTitleId}
              placeholder={t("Job title", "المسمى الوظيفي")}
              options={jobTitleOptions}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              value={employmentTypeId}
              onChange={setEmploymentTypeId}
              placeholder={t("Employment type", "نوع التوظيف")}
              options={employmentTypeOptions}
            />
          </Col>
          <Col xs={12} md={4}>
            <Button block disabled={!hasFilters} onClick={clearFilters}>
              {t("Clear filters", "مسح الفلاتر")}
            </Button>
          </Col>
        </Row>

        {list.isLoading ? (
          <Spin />
        ) : list.isError ? (
          <Alert type="error" title={(list.error as Error).message} />
        ) : (
          <DataTable
            rowKey="id"
            dataSource={rows}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (n) => `${n}` }}
            scroll={{ x: 1100 }}
            rowClassName={(record) =>
              String(record.id) === String(selectedId) ? "employee-row employee-row-selected" : "employee-row"
            }
            onRow={(record) => ({
              onClick: () => setSelectedId(record.id),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(record.id);
                }
              },
              tabIndex: 0,
              role: "button",
              "aria-label": t("View employee details", "عرض تفاصيل الموظف"),
            })}
            columns={[
              {
                title: t("Code", "الرقم"),
                dataIndex: "code",
                width: 100,
                render: (code: string | null) => (code ? `#${code}` : "—"),
              },
              {
                title: t("Employee", "الموظف"),
                dataIndex: "full_name",
                render: (_: unknown, row: ApiEmployee) => (
                  <Typography.Text style={{ color: "#000", fontWeight: 500 }}>
                    {row.full_name}
                  </Typography.Text>
                ),
              },
              {
                title: t("Department", "الإدارة"),
                render: (_: unknown, row: ApiEmployee) => refName(row.department),
              },
              {
                title: t("Job title", "المسمى الوظيفي"),
                render: (_: unknown, row: ApiEmployee) => refName(row.job_title),
              },
              {
                title: t("Location", "الموقع"),
                render: (_: unknown, row: ApiEmployee) => <Tag>{refName(row.location)}</Tag>,
              },
              {
                title: t("Employment", "التوظيف"),
                render: (_: unknown, row: ApiEmployee) => {
                  const name = refName(row.employment_type);
                  return name === "—" ? "—" : <Tag color="cyan">{name}</Tag>;
                },
              },
              {
                title: t("Joined", "الالتحاق"),
                dataIndex: "joining_date",
                width: 120,
                render: (v: string | null) => v || "—",
              },
              {
                title: t("Status", "الحالة"),
                dataIndex: "status",
                width: 120,
                render: (v: string) => statusTag(v, ar),
              },
            ]}
          />
        )}
      </Card>

      <Drawer
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        width={480}
        title={t("Employee details", "تفاصيل الموظف")}
        destroyOnHidden
      >
        {detail.isLoading && !detailEmployee ? (
          <Spin />
        ) : detail.isError && !detailEmployee ? (
          <Alert type="error" title={(detail.error as Error).message} />
        ) : detailEmployee ? (
          <EmployeeDetail employee={detailEmployee} ar={ar} t={t} />
        ) : null}
      </Drawer>

      <style>{`
        .employee-row { cursor: pointer; transition: background-color 0.15s ease; }
        .employee-row:hover > td { background: rgba(22, 119, 255, 0.06) !important; }
        .employee-row-selected > td { background: rgba(22, 119, 255, 0.1) !important; }
        .employee-row:focus-visible { outline: 2px solid #1677ff; outline-offset: -2px; }
      `}</style>
    </AppShell>
  );
}
