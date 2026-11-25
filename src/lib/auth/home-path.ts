import type { ApiUser } from "@/lib/api/types";

type WorkspaceRole = "admin" | "manager" | "employee";

export function homePathForUser(user: ApiUser | null | undefined, locale: string, preferredRole?: WorkspaceRole | null): string {
  const role: WorkspaceRole = preferredRole && user?.roles?.[preferredRole]
    ? preferredRole
    : user?.roles.admin ? "admin" : user?.roles.manager ? "manager" : "employee";
  if (role === "admin") return `/${locale}/admin`;
  if (role === "manager") return `/${locale}/manager`;
  return `/${locale}/dashboard`;
}
