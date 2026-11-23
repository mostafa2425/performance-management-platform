"use client";
import { useState } from "react";
import { Alert, App, Button, Card, Empty, Form, Input, InputNumber, Popconfirm, Select, Space, Spin, Table, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesApi, employeesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { useLocale } from "next-intl";

const stageKeys=["goal_setting","employee_review","active_performance","manager_evaluation","admin_final_review"];
export default function ApiPerformanceCycleWorkspace({mode,cycleId}:{mode:"list"|"create"|"detail";cycleId?:string}){
 const ar=useLocale()==="ar"; const {message}=App.useApp(); const qc=useQueryClient(); const [form]=Form.useForm(); const [scopeForm]=Form.useForm(); const [preview,setPreview]=useState<any>(null);
 const cycles=useQuery({queryKey:queryKeys.adminCycles,queryFn:()=>cyclesApi.adminList({per_page:100}) ,enabled:mode==="list"});
 const cycle=useQuery({queryKey:[...queryKeys.adminCycles,cycleId],queryFn:()=>cyclesApi.adminGet(cycleId!),enabled:mode==="detail"&&Boolean(cycleId)});
 const employees=useQuery({queryKey:queryKeys.employees,queryFn:()=>employeesApi.list({per_page:100}),enabled:mode==="detail"});
 const create=useMutation({mutationFn:(v:any)=>cyclesApi.create(v),onSuccess:async()=>{message.success(ar?"تم إنشاء الدورة":"Cycle created");await qc.invalidateQueries({queryKey:queryKeys.adminCycles});}});
 const activate=useMutation({mutationFn:()=>cyclesApi.activate(cycleId!),onSuccess:async()=>{message.success(ar?"تم تفعيل الدورة":"Cycle activated");await qc.invalidateQueries({queryKey:queryKeys.adminCycles});await cycle.refetch();}});
 const setScope=useMutation({mutationFn:(v:any)=>cyclesApi.setScope(cycleId!,v),onSuccess:()=>message.success(ar?"تم حفظ نطاق الدورة":"Cycle scope saved")});
 const remove=useMutation({mutationFn:()=>cyclesApi.remove(cycleId!),onSuccess:async()=>{message.success(ar?"تم حذف المسودة":"Draft deleted");await qc.invalidateQueries({queryKey:queryKeys.adminCycles});}});
 const runPreview=async()=>{try{setPreview(await cyclesApi.preview(cycleId!));}catch(e){message.error((e as Error).message);}};
 const t=(en:string,arabic:string)=>ar?arabic:en;
 if(mode==="create") return <Card title={t("Create performance cycle","إنشاء دورة أداء")}>
  <Form form={form} layout="vertical" onFinish={v=>{const body={name:{ar:v.name_ar,en:v.name_en},performance_year:v.performance_year,start_date:v.start_date,stages:{goal_setting:v.goal_setting,employee_review:v.employee_review,active_performance:v.active_performance,manager_evaluation:v.manager_evaluation,admin_final_review:v.admin_final_review}};create.mutate(body);}}>
   <Form.Item name="name_en" label={t("Cycle name (English)","اسم الدورة بالإنجليزية")} rules={[{required:true}]}><Input/></Form.Item>
   <Form.Item name="name_ar" label={t("Cycle name (Arabic)","اسم الدورة بالعربية")} rules={[{required:true}]}><Input dir="rtl"/></Form.Item>
   <Form.Item name="performance_year" label={t("Performance year","سنة الأداء")} rules={[{required:true}]}><InputNumber min={2020} max={2100} style={{width:"100%"}}/></Form.Item>
   <Form.Item name="start_date" label={t("Start date","تاريخ البداية")} rules={[{required:true}]}><Input type="date"/></Form.Item>
   {stageKeys.map((key,i)=><Form.Item key={key} name={key} label={t(["Goal setting deadline","Employee review deadline","Active performance deadline","Manager evaluation deadline","Admin final review deadline"][i],["الموعد النهائي لتحديد الأهداف","الموعد النهائي لمراجعة الموظف","الموعد النهائي للأداء الفعلي","الموعد النهائي لتقييم المدير","الموعد النهائي للمراجعة النهائية"][i])} rules={[{required:true}]}><Input type="date"/></Form.Item>)}
   <Button type="primary" htmlType="submit" loading={create.isPending}>{t("Create draft","إنشاء مسودة")}</Button>
  </Form>
 </Card>;
 if(mode==="detail"){
  if(cycle.isLoading)return <Spin/>; if(cycle.isError)return <Alert type="error" title={(cycle.error as Error).message}/>; if(!cycle.data)return <Empty/>;
  const c=cycle.data; const candidates=(employees.data as any)?.data||[];
  return <Space direction="vertical" size={16} style={{width:"100%"}}>
   <Card title={typeof c.name==="object"?(ar?c.name.ar:c.name.en):c.name} extra={<Tag color={c.status==="active"?"green":c.status==="draft"?"blue":"default"}>{c.status}</Tag>}>
    <Typography.Paragraph>{c.performance_year} · {c.start_date} — {c.end_date}</Typography.Paragraph>
    <Space wrap><Button onClick={runPreview}>{t("Preview eligibility","معاينة أهلية الموظفين")}</Button>{c.status==="draft"&&<Popconfirm title={t("Activate this cycle? Activation cannot be undone.","هل تريد تفعيل الدورة؟ لا يمكن التراجع عن التفعيل.")} onConfirm={()=>activate.mutate()}><Button type="primary" loading={activate.isPending}>{t("Activate cycle","تفعيل الدورة")}</Button></Popconfirm>}{c.status==="draft"&&<Popconfirm title={t("Delete draft?","حذف المسودة؟")} onConfirm={()=>remove.mutate()}><Button danger>{t("Delete draft","حذف المسودة")}</Button></Popconfirm>}</Space>
    <Table rowKey="stage" pagination={false} dataSource={c.stages||[]} columns={[{title:t("Stage","المرحلة"),dataIndex:"stage"},{title:t("Deadline","الموعد النهائي"),dataIndex:"deadline_date"},{title:t("Cutoff (UTC)","وقت الإغلاق UTC"),dataIndex:"cutoff_at"},{title:t("Processed","تمت المعالجة"),dataIndex:"processed_at",render:(v:any)=>v||"—"}]}/>
   </Card>
   {c.status==="draft"&&<Card title={t("Cycle scope","نطاق الدورة")}><Form form={scopeForm} layout="vertical" onFinish={v=>setScope.mutate({departments:[],job_titles:[],employees:v.employees||[],excluded_employees:v.excluded_employees||[]})}>
    <Form.Item name="employees" label={t("Include employees","الموظفون المشمولون")}><Select mode="multiple" showSearch optionFilterProp="label" options={candidates.map((x:any)=>({value:x.id,label:`${x.full_name} · ${x.code||x.email}`}))}/></Form.Item>
    <Form.Item name="excluded_employees" label={t("Exclude employees","استبعاد موظفين")}><Select mode="multiple" options={candidates.map((x:any)=>({value:x.id,label:`${x.full_name} · ${x.code||x.email}`}))}/></Form.Item>
    <Button htmlType="submit" loading={setScope.isPending}>{t("Save scope","حفظ النطاق")}</Button></Form></Card>}
   {preview&&<Card title={t("Eligibility preview","معاينة الأهلية")}><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(preview,null,2)}</pre></Card>}
  </Space>;
 }
 return <Card title={t("Performance cycles","دورات الأداء")} extra={<Button type="primary" href={`/${ar?"ar":"en"}/admin/performance-cycles/new`}>{t("Create cycle","إنشاء دورة")}</Button>}>
  {cycles.isLoading?<Spin/>:cycles.isError?<Alert type="error" title={(cycles.error as Error).message}/>:<Table rowKey="id" dataSource={(cycles.data as any)?.data||[]} pagination={{pageSize:10}} columns={[{title:t("Cycle","الدورة"),render:(_:any,r:any)=>typeof r.name==="object"?(ar?r.name.ar:r.name.en):r.name},{title:t("Year","السنة"),dataIndex:"performance_year"},{title:t("Start","البداية"),dataIndex:"start_date"},{title:t("End","النهاية"),dataIndex:"end_date"},{title:t("Status","الحالة"),dataIndex:"status",render:(v:string)=><Tag color={v==="active"?"green":v==="draft"?"blue":"default"}>{v}</Tag>},{title:"",render:(_:any,r:any)=><Button href={`/${ar?"ar":"en"}/admin/performance-cycles/${r.id}`}>{t("Manage","إدارة")}</Button>}]}/>} 
 </Card>;
}