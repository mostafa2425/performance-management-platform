"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AUTH_STORAGE_KEY, AUTH_UNAUTHORIZED_EVENT } from "@/lib/api/config";
import { authApi } from "@/lib/api/endpoints";
import type { ApiUser } from "@/lib/api/types";
type SessionValue = { token: string|null; user: ApiUser|null; isReady: boolean; isAuthenticated: boolean; login: (credentials:{email:string;password:string})=>Promise<ApiUser>; logout:()=>Promise<void> };
const SessionContext = createContext<SessionValue|null>(null);
export function AuthSessionProvider({children}:{children:React.ReactNode}) {
 const [token,setToken]=useState<string|null>(null); const [user,setUser]=useState<ApiUser|null>(null); const [isReady,setReady]=useState(false);
 const queryClient=useQueryClient(); const router=useRouter(); const locale=useLocale();
 const clearSession=useCallback(()=>{ window.sessionStorage.removeItem(AUTH_STORAGE_KEY); setToken(null); setUser(null); queryClient.clear(); },[queryClient]);
 useEffect(()=>{ let active=true; const restore=async()=>{ try { const saved=window.sessionStorage.getItem(AUTH_STORAGE_KEY); if(!saved) return; const parsed=JSON.parse(saved) as {token?:string;expiresAt?:string};
   if(!parsed.token || (parsed.expiresAt && Date.parse(parsed.expiresAt)<=Date.now())) { clearSession(); return; } setToken(parsed.token); const current=await authApi.me(); if(active) setUser(current);
  } catch { if(active) clearSession(); } finally { if(active) setReady(true); } };
  const unauthorized=()=>{ clearSession(); router.replace(`/${locale}/login`); }; window.addEventListener(AUTH_UNAUTHORIZED_EVENT,unauthorized); void restore();
  return ()=>{ active=false; window.removeEventListener(AUTH_UNAUTHORIZED_EVENT,unauthorized); };
 },[clearSession,locale,router]);
 const login=useCallback(async(credentials:{email:string;password:string})=>{ const result=await authApi.login(credentials) as {token:string;expires_at:string;user:ApiUser};
  window.sessionStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify({token:result.token,expiresAt:result.expires_at})); setToken(result.token); setUser(result.user); setReady(true); await queryClient.invalidateQueries(); return result.user;
 },[queryClient]);
 const logout=useCallback(async()=>{ try { if(token) await authApi.logout(); } finally { clearSession(); router.replace(`/${locale}/login`); } },[clearSession,locale,router,token]);
 const value=useMemo(()=>({token,user,isReady,isAuthenticated:Boolean(token&&user),login,logout}),[token,user,isReady,login,logout]);
 return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useAuthSession(){ const value=useContext(SessionContext); if(!value) throw new Error("useAuthSession must be used inside AuthSessionProvider"); return value; }