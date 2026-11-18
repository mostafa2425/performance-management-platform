export type AppRole =
  | "ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "DEPARTMENT_MANAGER"
  | "HCD";

export type AuthUser = {
  id: string;
  employeeId: string;
  displayName: string;
  email: string;
  roles: AppRole[];
  permissions: string[];
  locale?: "en" | "ar";
};

export type AuthSession = {
  user: AuthUser;
  expiresAt?: string;
};