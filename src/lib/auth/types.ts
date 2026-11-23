import type { ApiUser } from "@/lib/api/types";
export type AppRole = "ADMIN" | "MANAGER" | "EMPLOYEE" | "DEPARTMENT_MANAGER" | "HCD";
export type AuthUser = { id:string; employeeId:string; displayName:string; email:string; roles:AppRole[]; permissions:string[]; locale?:"en"|"ar" };
export type AuthSession = { user:AuthUser; expiresAt?:string };
export function mapApiUser(user:ApiUser):AuthUser { const roles:AppRole[]=[]; if(user.roles.admin) roles.push("ADMIN"); if(user.roles.manager) roles.push("MANAGER"); if(user.roles.employee) roles.push("EMPLOYEE"); return {id:String(user.id),employeeId:user.employee?String(user.employee.id):"",displayName:user.employee?.full_name||user.name,email:user.email,roles,permissions:[]}; }