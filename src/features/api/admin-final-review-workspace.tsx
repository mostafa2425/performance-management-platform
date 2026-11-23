"use client";
import { useState } from "react";
import { Alert, App, Button, Card, Empty, Form, Input, Modal, Select, Space, Spin, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, cyclesApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
export default function ApiAdminFinalReviewWorkspace(){
 const ar=useLocale()==="ar"; const {message}=App.useApp(); const qc=useQueryClient(); const [cycleId,setCycleId]=useState<number>(); const [selected,setSelected]=useState<any>(null); const [reason,setReason]=useState(""); const [affected,setAffected]=useState<number[]>([]);
 const cycles=useQuery({queryKey:["cycles"],queryFn:cyclesApi.mine}); const groups=useQuery({queryKey:["admin","cycles",cycleId,"groups"],queryFn:()=>adminApi.groups(cycleId!,{per_page:100}),enabled:Boolean(cycleId)});
 const detail=useQuery({queryKey:["admin","group",selected?.id],queryFn:()=>adminApi.group(selected.id),enabled:Boolean(selected?.id)});
 const approve=useMutation({mutationFn:()=>adminApi.approveGroup(selected.id,detail.data.version),onSuccess:async()=>{message.success(ar?"تم اعتماد المجموعة":"Group approved");await qc.invalidateQueries({queryKey:["admin","cycles",cycleId,"groups"]});setSelected(null);}});
 const returnGroup=useMutation({mutationFn:()=>adminApi.returnGroup(selected.id,{expected_version:detail.data.version,reason,affected_member_ids:affected}),onSuccess:async()=>{message.success(ar?"تمت إعادة المجموعة":"Group returned");await qc.invalidateQueries({queryKey:["admin","cycles",cycleId,"groups"]});setSelected(null);setReason("");}});
 const t=(en:string,a:string)=>ar?a:en; const list=(groups.data as any)?.data||[];
 return <Space orientation="vertical" style={{width:"100%"}} size={16}>
  <Card title={t("Final group review","المراجعة النهائية للمجموعة")}>
   <Select style={{width:"100%",maxWidth:500,marginBottom:16}} placeholder={t("Select cycle","اختر الدورة")} value={cycleId} onChange={setCycleId} options={(cycles.data||[]).map((c:any)=>({value:c.id,label:`${typeof c.name==="object"?(ar?c.name.ar:c.name.en):c.name} · ${c.performance_year}`}))}/>
   {groups.isLoading?<Spin/>:groups.isError?<Alert type="error" title={(groups.error as Error).message}/>:list.length===0?<Empty description={t("No review groups found","لا توجد مجموعات للمراجعة")}/>:<Table rowKey={(r:any)=>r.id||`${r.manager_id}-${r.status}`} dataSource={list} columns={[
    {title:t("Manager","المدير"),render:(_:any,r:any)=>r.manager?.name||r.manager?.full_name||r.manager_id||"—"},{title:t("Members","الأعضاء"),dataIndex:"n"},{title:t("Status","الحالة"),dataIndex:"status",render:(v:string)=><Tag>{v}</Tag>},{title:t("Submission","رقم الإرسال"),dataIndex:"latest_submission_no"},{title:"",render:(_:any,r:any)=><Button onClick={()=>setSelected(r)}>{t("Review","مراجعة")}</Button>}
   ]}/>}
  </Card>
  <Modal width={900} open={Boolean(selected)} title={t("Group review","مراجعة المجموعة")} onCancel={()=>setSelected(null)} footer={null}>
   {detail.isLoading?<Spin/>:detail.isError?<Alert type="error" title={(detail.error as Error).message}/>:detail.data&&<Space orientation="vertical" style={{width:"100%"}}>
    <Tag color="blue">{detail.data.status}</Tag><Table rowKey="cycle_member_id" dataSource={detail.data.members||[]} pagination={false} columns={[{title:t("Employee","الموظف"),render:(_:any,r:any)=>r.employee?.name||r.employee?.full_name},{title:t("Overall","الإجمالي"),render:(_:any,r:any)=>r.overall_bp==null?"—":`${(r.overall_bp/100).toFixed(2)}%`},{title:t("Rating","التقدير"),dataIndex:"rating_level"}]}/>
    {detail.data.status==="pending_admin"&&<><Button type="primary" loading={approve.isPending} onClick={()=>approve.mutate()}>{t("Approve group","اعتماد المجموعة")}</Button><Form layout="vertical"><Form.Item label={t("Return reason","سبب الإعادة")} required><Input.TextArea rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></Form.Item><Form.Item label={t("Affected members (optional)","الأعضاء المتأثرون (اختياري)")}><Select mode="multiple" value={affected} onChange={setAffected} options={(detail.data.members||[]).map((m:any)=>({value:m.cycle_member_id,label:m.employee?.name||m.employee?.full_name||m.cycle_member_id}))}/></Form.Item><Button danger disabled={!reason.trim()} loading={returnGroup.isPending} onClick={()=>returnGroup.mutate()}>{t("Return group","إعادة المجموعة")}</Button></Form></>}</Space>}
  </Modal>
 </Space>;
}