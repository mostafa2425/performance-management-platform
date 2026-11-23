"use client";
import { useState } from "react";
import { Alert, Card, Input, Select, Space, Spin, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
export default function ApiEmployeesWorkspace(){
 const ar=useLocale()==="ar";const [search,setSearch]=useState("");const [status,setStatus]=useState<string>();
 const q=useQuery({queryKey:["employees",{search,status}],queryFn:()=>employeesApi.list({per_page:50,...(search?{"filter[email]":search,"filter[code]":search}:{}),...(status?{"filter[status]":status}:{})})});
 const rows=(q.data as any)?.data||[];const t=(e:string,a:string)=>ar?a:e;
 return <AppShell role="admin" title={t("Employees","الموظفون")} subtitle={t("Read-only employee directory synchronized from Jisr.","دليل الموظفين للقراءة فقط والمتزامن من نظام جسر.")}><Card><Space wrap style={{marginBottom:16}}><Input.Search allowClear value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search by email or employee code","بحث بالبريد أو الرقم الوظيفي")} style={{width:300}}/><Select allowClear placeholder={t("Employment status","حالة الموظف")} value={status} onChange={setStatus} options={[{value:"active",label:t("Active","نشط")},{value:"terminated",label:t("Terminated","منتهي الخدمة")}]}/></Space>
  {q.isLoading?<Spin/>:q.isError?<Alert type="error" title={(q.error as Error).message}/>:<Table rowKey="id" dataSource={rows} pagination={{pageSize:10}} columns={[{title:t("Employee","الموظف"),dataIndex:"full_name"},{title:t("Employee code","الرقم الوظيفي"),dataIndex:"code"},{title:t("Email","البريد الإلكتروني"),dataIndex:"email"},{title:t("Department","الإدارة"),render:(_:any,r:any)=>r.department?.name||"—"},{title:t("Job title","المسمى الوظيفي"),render:(_:any,r:any)=>r.job_title?.name||"—"},{title:t("Status","الحالة"),dataIndex:"status",render:(v:string)=><Tag color={v==="active"?"green":"default"}>{v}</Tag>}]}/>}</Card></AppShell>;
}