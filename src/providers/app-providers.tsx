"use client";
import { App as AntdApp, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import arEG from "antd/locale/ar_EG";
import { useLocale } from "next-intl";
import { QueryProvider } from "./query-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { AuthSessionProvider } from "@/lib/auth/session";
import { PerformanceCycleProvider } from "@/features/performance-cycles/performance-cycle-provider";
export function AppProviders({children}:{children:React.ReactNode}) {
 const isArabic=useLocale()==="ar";
 return <ConfigProvider direction={isArabic?"rtl":"ltr"} locale={isArabic?arEG:enUS} theme={{cssVar:{},token:{colorPrimary:"#163366",colorSuccess:"#167d75",borderRadius:8,fontSize:16}}}>
  <AntdApp><QueryProvider><AuthSessionProvider><PerformanceCycleProvider><RegisterServiceWorker/>{children}</PerformanceCycleProvider></AuthSessionProvider></QueryProvider></AntdApp>
 </ConfigProvider>;
}