import type { AuthUser } from "./types";

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string
): boolean {
  return Boolean(user?.permissions.includes(permission));
}