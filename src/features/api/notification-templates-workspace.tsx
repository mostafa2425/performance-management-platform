"use client";
import { useMemo, useState } from "react";
import { Alert, App, Button, Card, Empty, Form, Input, List, Spin, Switch, Tag, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-hooks";
import { useLocale } from "next-intl";

type Template = {code:string;name:{ar:string;en:string};recipient:string;trigger?:string;in_use:boolean;subject:{ar:string;en:string};body:{ar:string;en:string};placeholders?:{ar:string[];en:string[]}};
export function ApiNotificationTemplatesWorkspace(){
 const locale=useLocale(); const ar=locale==="ar"; const {message}=App.useApp(); const qc=useQueryClient();
 const list=useQuery({queryKey:queryKeys.notifications,queryFn:adminApi.notificationTemplates});
 const templates=(list.data||[]) as Template[]; const [selected,setSelected]=useState<string>("");
 const activeCode=selected||templates[0]?.code||"";
 const detail=useQuery({queryKey:["admin","notification-template",activeCode],queryFn:()=>adminApi.notificationTemplate(activeCode),enabled:Boolean(activeCode)});
 const [form]=Form.useForm(); const current=detail.data as Template|undefined;
 const save=useMutation({mutationFn:(values:any)=>adminApi.updateNotificationTemplate(activeCode,values),onSuccess:async()=>{message.success(ar?"تم حفظ القالب بنجاح":"Template saved successfully");await Promise.all([qc.invalidateQueries({queryKey:queryKeys.notifications}),qc.invalidateQueries({queryKey:["admin","notification-template",activeCode]})]);}});
 const displayName=(x:Template)=>typeof x.name==="string"?x.name:(ar?x.name?.ar:x.name?.en)||x.code;
 const placeholderText=useMemo(()=>current?.placeholders?.[ar?"ar":"en"]||[],[current,ar]);
 return <div className="template-workspace">
  <div className="notification-hero"><div><span>✦ {ar?"إعدادات النظام":"SYSTEM CONFIGURATION"}</span><h2>{ar?"قوالب الإشعارات":"Notification templates"}</h2><p>{ar?"إدارة محتوى رسائل البريد الإلكتروني ثنائية اللغة من الخادم.":"Manage bilingual notification email content from the backend."}</p></div><div className="notification-hero-count"><strong>{templates.length}</strong><span>{ar?"قالب":"Templates"}</span></div></div>
  {list.isLoading?<Spin/>:list.isError?<Alert type="error" showIcon title={(list.error as Error).message}/>:templates.length===0?<Empty description={ar?"لا توجد قوالب":"No templates found"}/>:
   <div className="template-layout">
    <Card className="template-index" title={ar?"القوالب":"Templates"}><List dataSource={templates} renderItem={item=><List.Item onClick={()=>{setSelected(item.code);form.resetFields();}} style={{cursor:"pointer",background:activeCode===item.code?"rgba(22,51,102,.06)":undefined,padding:12}}><List.Item.Meta title={<span>{item.code} · {displayName(item)}</span>} description={<>{item.recipient} · <Tag color={item.in_use?"green":"default"}>{item.in_use?(ar?"مفعّل":"In use"):(ar?"غير مستخدم":"Not in use")}</Tag></>}/></List.Item>}/></Card>
    <Card className="template-editor" title={current?`${current.code} · ${displayName(current)}`:activeCode}>
     {detail.isLoading?<Spin/>:detail.isError?<Alert type="error" title={(detail.error as Error).message}/>:<Form form={form} key={current?.code ?? "template-loading"} layout="vertical" initialValues={current ? {subject:current.subject,body:current.body} : undefined} onFinish={values=>save.mutate(values)}>{current && <>
      <Alert type="info" showIcon title={ar?"استخدم المتغيرات المعتمدة فقط كما تظهر في قائمة المتغيرات لكل لغة.":"Use only the approved placeholders listed for each language."}/>
      <Form.Item label={ar?"عنوان الرسالة (عربي)":"Arabic subject"} name={["subject","ar"]} rules={[{required:true}]}><Input maxLength={255}/></Form.Item>
      <Form.Item label={ar?"عنوان الرسالة (إنجليزي)":"English subject"} name={["subject","en"]} rules={[{required:true}]}><Input maxLength={255}/></Form.Item>
      <Form.Item label={ar?"محتوى الرسالة (عربي)":"Arabic body"} name={["body","ar"]} rules={[{required:true}]}><Input.TextArea rows={6} maxLength={5000}/></Form.Item>
      <Form.Item label={ar?"محتوى الرسالة (إنجليزي)":"English body"} name={["body","en"]} rules={[{required:true}]}><Input.TextArea rows={6} maxLength={5000}/></Form.Item>
      <div style={{marginBottom:16}}><Typography.Text type="secondary">{ar?"المتغيرات المتاحة":"Allowed placeholders"}: {placeholderText.map(x=>`[${x}]`).join(", ")||"—"}</Typography.Text></div>
      <Button type="primary" htmlType="submit" loading={save.isPending}>{ar?"حفظ التغييرات":"Save changes"}</Button>
     </> }</Form>}
    </Card>
   </div>}
 </div>;
}