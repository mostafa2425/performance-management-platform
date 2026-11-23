import type { ApiUser } from "@/lib/api/types";

export function homePathForUser(user: ApiUser | null | undefined, locale: string): string {
  if (user?.roles.admin) return `/${locale}/admin`;
  if (user?.roles.manager) return `/${locale}/manager`;
  return `/${locale}/dashboard`;
}
