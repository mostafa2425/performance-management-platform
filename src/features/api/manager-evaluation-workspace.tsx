"use client";
import { useState } from "react";
import { Alert, App, Button, Card, Empty, Form, Input, InputNumber, Select, Space, Spin, Typography, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
export default function ApiManagerEvaluationWorkspace(){
 const ar=useLocale()==="ar"; const locale=ar?"ar":"en"; const {message}=App.useApp(); const qc=useQueryClient(); const [planId,setPlanId]=useState<number>(); const [form]=Form.useForm();
 const plans=useQuery({queryKey:[...queryKeys.plans,"manager-evaluation"],queryFn:()=>plansApi.list({filter:{status:"approved"},per_page:100})});
 const evaluation=useQuery({queryKey:["plans",planId,"evaluation"],queryFn:()=>plansApi.evaluation(planId!),enabled:Boolean(planId)});
 const save=useMutation({mutationFn:(body:any)=>plansApi.saveEvaluation(planId!,body),onSuccess:async()=>{message.success(ar?"تم حفظ التقييم":"Evaluation saved");await qc.invalidateQueries({queryKey:["plans",planId,"evaluation"]});}});
 const t=(en:string,arabic:string)=>ar?arabic:en; const rows=(plans.data as any)?.data||[]; const ev=evaluation.data as any;
 const selectedPlan=rows.find((p:any)=>p.id===planId);
 const initial=()=>({kpis:ev?.kpis?.map((k:any)=>({plan_kpi_id:k.plan_kpi_id,actual:k.actual===null?null:Number(k.actual),comment:k.comment||""})),competencies:ev?.competencies?.map((c:any)=>({competency_id:c.id,rating:c.rating}))});
 return <AppShell role="manager" title={t("Manager evaluation","تقييم المدير")} subtitle={t("Record actual results and annual competency ratings using the approved plan.","سجّل النتائج الفعلية وتقييمات الكفاءات السنوية بناءً على الخطة المعتمدة.")}>
  <Space direction="vertical" size={16} style={{width:"100%"}}>
   <Card><Select showSearch optionFilterProp="label" style={{width:"100%",maxWidth:600}} placeholder={t("Select an approved plan to evaluate","اختر خطة معتمدة لتقييمها")} value={planId} onChange={setPlanId} options={rows.map((p:any)=>({value:p.id,label:`${p.employee?.name||p.employee?.full_name||p.id} · ${p.display_status} · #${p.id}`}))}/>{plans.isLoading&&<Spin/>}{plans.isError&&<Alert type="error" title={(plans.error as Error).message}/>}{!rows.length&&!plans.isLoading&&<Empty description={t("No approved plans are available for evaluation.","لا توجد خطط معتمدة متاحة للتقييم.")}/>}</Card>
   {planId&&(evaluation.isLoading?<Spin/>:evaluation.isError?<Alert type="error" showIcon title={(evaluation.error as Error).message}/>:ev&&<Card title={`${selectedPlan?.employee?.name||selectedPlan?.employee?.full_name||"Employee"} · ${t("Evaluation","التقييم")}`} extra={<TagVersion value={ev.version} label={t("Version","الإصدار")}/>}>
    {!ev.evaluable&&<Alert type="warning" title={t("This member is not evaluable.","لا يمكن تقييم هذا الموظف حالياً.")}/>} {!ev.editable&&<Alert type="info" title={t("Evaluation is read-only in the current workflow state.","التقييم للقراءة فقط في حالة سير العمل الحالية.")}/>} 
    <Form form={form} key={`${planId}-${ev.version}`} layout="vertical" initialValues={initial()} onFinish={v=>save.mutate({version:ev.version,kpis:v.kpis,competencies:v.competencies})}>
     <Typography.Title level={5}>{t("KPI actuals","القيم الفعلية لمؤشرات الأداء")}</Typography.Title>
     {(ev.kpis||[]).map((k:any,i:number)=><Card size="small" key={k.plan_kpi_id} title={k.name} style={{marginBottom:10}}>
      <Typography.Paragraph type="secondary">{t("Target","المستهدف")}: {k.target} · {t("Weight","الوزن")}: {(k.weight_bp/100).toFixed(2)}%</Typography.Paragraph>
      <Form.Item name={["kpis",i,"plan_kpi_id"]} hidden initialValue={k.plan_kpi_id}><Input/></Form.Item>
      <Form.Item name={["kpis",i,"actual"]} label={t("Actual value","القيمة الفعلية")}><InputNumber style={{width:"100%"}} stringMode disabled={!ev.editable}/></Form.Item>
      <Form.Item name={["kpis",i,"comment"]} label={t("Manager comment","تعليق المدير")}><Input.TextArea rows={2} disabled={!ev.editable}/></Form.Item>
      <Space wrap>{(k.evidence||[]).map((file:any)=><Button key={file.id} size="small" onClick={()=>plansApi.downloadEvidence(planId,file.id,file.original_name)}>{t("Download","تحميل")}: {file.original_name}</Button>)}
       <Upload showUploadList={false} disabled={!ev.editable} beforeUpload={async file=>{try{await plansApi.uploadEvidence(planId,k.plan_kpi_id,file as File);message.success(ar?"تم رفع الدليل":"Evidence uploaded");await qc.invalidateQueries({queryKey:["plans",planId,"evaluation"]});}catch(e){message.error((e as Error).message);}return Upload.LIST_IGNORE;}}><Button size="small" disabled={!ev.editable} icon={<UploadOutlined/>}>{t("Upload evidence","رفع دليل")}</Button></Upload></Space>
     </Card>)}
     <Typography.Title level={5}>{t("Annual competencies","الكفاءات السنوية")}</Typography.Title>
     {(ev.competencies||[]).map((c:any,i:number)=><div key={c.id}><Form.Item name={["competencies",i,"competency_id"]} hidden initialValue={c.id}><Input/></Form.Item><Form.Item name={["competencies",i,"rating"]} label={typeof c.name==="object"?(ar?c.name.ar:c.name.en):c.name} rules={[{required:true}]}><Select disabled={!ev.editable} options={[1,2,3,4,5].map(v=>({value:v,label:String(v)}))}/></Form.Item></div>)}
     {ev.is_complete&&<Alert type="success" title={`${t("Overall score","النتيجة الإجمالية")}: ${((ev.overall_bp||0)/100).toFixed(2)}% · ${ev.rating?.label?.[locale]||""}`}/>} 
     <Button type="primary" htmlType="submit" loading={save.isPending} disabled={!ev.editable}>{t("Save evaluation","حفظ التقييم")}</Button>
    </Form>
   </Card>)}
  </Space>
 </AppShell>;
}
function TagVersion({value,label}:{value:number;label:string}){return <span>{label} {value}</span>;}