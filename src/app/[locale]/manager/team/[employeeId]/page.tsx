"use client";

import { useParams } from "next/navigation";
import { ManagerEmployeeDetailWorkspace } from "@/features/api/manager-employee-detail-workspace";

export default function ManagerEmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const employeeId = decodeURIComponent(params.employeeId);
  return <ManagerEmployeeDetailWorkspace employeeId={employeeId} />;
}
