"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AUTH_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api/config";
import { authApi } from "@/lib/api/endpoints";
import type { ApiUser } from "@/lib/api/types";
export type ActiveAppRole = "admin" | "manager" | "employee";
const ACTIVE_ROLE_STORAGE_KEY = "pmp.active-role";
type SessionValue = { token: string|null; user: ApiUser|null; activeRole: ActiveAppRole|null; availableRoles: ActiveAppRole[]; setActiveRole:(role:ActiveAppRole)=>void; isReady: boolean; isAuthenticated: boolean; login: (credentials:{email:string;password:string})=>Promise<ApiUser>; logout:()=>Promise<void> };
function rolesForUser(user:ApiUser|null):ActiveAppRole[]{ return user ? (["admin","manager","employee"] as const).filter(role=>Boolean(user.roles?.[role])) : []; }
function defaultRoleForUser(user:ApiUser|null):ActiveAppRole|null { return rolesForUser(user)[0] || null; }
function resolveRole(user:ApiUser, preferred?:string|null):ActiveAppRole|null { const roles=rolesForUser(user); return roles.includes(preferred as ActiveAppRole) ? preferred as ActiveAppRole : defaultRoleForUser(user); }
const SessionContext = createContext<SessionValue|null>(null);
export function AuthSessionProvider({children}:{children:React.ReactNode}) {
 const [token,setToken]=useState<string|null>(null); const [user,setUser]=useState<ApiUser|null>(null); const [isReady,setReady]=useState(false); const [activeRole,setActiveRoleState]=useState<ActiveAppRole|null>(null);
 const queryClient=useQueryClient(); const router=useRouter(); const locale=useLocale();
 const setActiveRole=useCallback((role:ActiveAppRole)=>{ if(!user || !rolesForUser(user).includes(role)) return; window.sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY,role); setActiveRoleState(role); },[user]);
 const clearSession=useCallback(()=>{ window.sessionStorage.removeItem(AUTH_STORAGE_KEY); window.sessionStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY); setToken(null); setUser(null); setActiveRoleState(null); queryClient.clear(); },[queryClient]);
 useEffect(()=>{ let active=true; const restore=async()=>{ try { const saved=window.sessionStorage.getItem(AUTH_STORAGE_KEY); if(!saved) return; const parsed=JSON.parse(saved) as {token?:string;expiresAt?:string};
   if(!parsed.token || (parsed.expiresAt && Date.parse(parsed.expiresAt)<=Date.now())) { clearSession(); return; } setToken(parsed.token); const current=await authApi.me(); if(active) { setUser(current); const role=resolveRole(current,window.sessionStorage.getItem(ACTIVE_ROLE_STORAGE_KEY)); setActiveRoleState(role); if(role) window.sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY,role); }
  } catch { if(active) clearSession(); } finally { if(active) setReady(true); } };
  const unauthorized=()=>{ clearSession(); router.replace(`/${locale}/login`); }; window.addEventListener(AUTH_UNAUTHORIZED_EVENT,unauthorized); void restore();
  return ()=>{ active=false; window.removeEventListener(AUTH_UNAUTHORIZED_EVENT,unauthorized); };
 },[clearSession,locale,router]);
 const login=useCallback(async(credentials:{email:string;password:string})=>{ const result=await authApi.login(credentials) as {token:string;expires_at:string;user:ApiUser};
  window.sessionStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify({token:result.token,expiresAt:result.expires_at})); setToken(result.token); setUser(result.user); const role=defaultRoleForUser(result.user); setActiveRoleState(role); if(role) window.sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY,role); setReady(true); await queryClient.invalidateQueries(); return result.user;
 },[queryClient]);
 const logout=useCallback(async()=>{ try { if(token) await authApi.logout(); } finally { clearSession(); router.replace(`/${locale}/login`); } },[clearSession,locale,router,token]);
 const availableRoles=useMemo(()=>rolesForUser(user),[user]);
 const value=useMemo(()=>({token,user,activeRole,availableRoles,setActiveRole,isReady,isAuthenticated:Boolean(token&&user),login,logout}),[token,user,activeRole,availableRoles,setActiveRole,isReady,login,logout]);
 return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useAuthSession(){ const value=useContext(SessionContext); if(!value) throw new Error("useAuthSession must be used inside AuthSessionProvider"); return value; }