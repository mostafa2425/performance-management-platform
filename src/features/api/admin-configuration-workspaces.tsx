"use client";

import { DataTable } from "@/components/ui/data-table";
import { useState } from "react";
import { Alert, App, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Skeleton, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import "./admin-configuration-workspaces.css";

export function ApiObjectiveCategoriesWorkspace(){
 const ar=useLocale()==="ar";const {message}=App.useApp();const qc=useQueryClient();const [editing,setEditing]=useState<any>(null);const [form]=Form.useForm();
 const q=useQuery({queryKey:["admin","objective-categories"],queryFn:()=>adminApi.objectiveCategories({per_page:100})});
 const save=useMutation({mutationFn:(v:any)=>editing?adminApi.updateObjectiveCategory(editing.id,{name:{ar:v.name_ar,en:v.name_en}}):adminApi.createObjectiveCategory({name:{ar:v.name_ar,en:v.name_en}}),onSuccess:async()=>{message.success(ar?"تم حفظ التصنيف":"Category saved");setEditing(null);form.resetFields();await qc.invalidateQueries({queryKey:["admin","objective-categories"]});}});
 const remove=useMutation({mutationFn:(id:number)=>adminApi.deleteObjectiveCategory(id),onSuccess:async()=>{message.success(ar?"تم حذف التصنيف":"Category deleted");await qc.invalidateQueries({queryKey:["admin","objective-categories"]});}});
 const rows=(q.data as any)?.data||[];const t=(e:string,a:string)=>ar?a:e;
 return <AppShell role="admin" title={t("Objective categories","تصنيفات الأهداف")} subtitle={t("Manage active categories used by performance plans.","إدارة التصنيفات النشطة المستخدمة في خطط الأداء.")}><Card className="admin-objective-categories-card" title={t("Categories","التصنيفات")} extra={<Button type="primary" onClick={()=>{setEditing({});form.resetFields();}}>{t("Add category","إضافة تصنيف")}</Button>}>
  {q.isLoading?<Skeleton active/>:q.isError?<Alert type="error" title={(q.error as Error).message}/>:<DataTable rowKey="id" dataSource={rows} columns={[{title:t("Arabic name","الاسم العربي"),render:(_:any,r:any)=>r.name?.ar},{title:t("English name","الاسم الإنجليزي"),render:(_:any,r:any)=>r.name?.en},{title:"ID",dataIndex:"id"},{title:"",render:(_:any,r:any)=><Space><Button onClick={()=>{setEditing(r);form.setFieldsValue({name_ar:r.name.ar,name_en:r.name.en});}}>{t("Edit","تعديل")}</Button><Popconfirm title={t("Delete this category?","حذف هذا التصنيف؟")} onConfirm={()=>remove.mutate(r.id)}><Button danger>{t("Delete","حذف")}</Button></Popconfirm></Space>}]} />}</Card>
  <Modal className="admin-objective-categories-modal" open={Boolean(editing)} title={editing?.id?t("Edit category","تعديل تصنيف"):t("New category","تصنيف جديد")} onCancel={()=>setEditing(null)} onOk={()=>form.submit()} confirmLoading={save.isPending}><Form form={form} layout="vertical" onFinish={v=>save.mutate(v)}><Row gutter={[16,0]}><Col xs={24} md={12}><Form.Item name="name_ar" label={t("Arabic name","الاسم العربي")} rules={[{required:true}]}><Input dir="rtl"/></Form.Item></Col><Col xs={24} md={12}><Form.Item name="name_en" label={t("English name","الاسم الإنجليزي")} rules={[{required:true}]}><Input/></Form.Item></Col></Row></Form></Modal>
 </AppShell>;
}

export function ApiPerformancePolicyWorkspace(){
 const ar=useLocale()==="ar";const {message}=App.useApp();const qc=useQueryClient();const [form]=Form.useForm();const [preview,setPreview]=useState<any>(null);
 const q=useQuery({queryKey:["admin","policy"],queryFn:adminApi.policy});
 const save=useMutation({mutationFn:(v:any)=>adminApi.savePolicy(v),onSuccess:async()=>{message.success(ar?"تم نشر إعدادات السياسة":"Policy version published");await qc.invalidateQueries({queryKey:["admin","policy"]});}});
 const previewMutation=useMutation({mutationFn:(v:any)=>adminApi.previewPolicy(v),onSuccess:setPreview});
 const t=(e:string,a:string)=>ar?a:e;const policy=q.data as any;
 return <AppShell role="admin" title={t("Performance configuration","إعدادات الأداء")} subtitle={t("Configure score weights, rating thresholds and Bell Curve limits.","إعداد أوزان النتائج وحدود التقديرات والتوزيع.")}><Card title={t("Scoring policy","سياسة احتساب الأداء")}>
  {q.isLoading?<><Form form={form} component={false}/><Skeleton active/></>:q.isError?<><Form form={form} component={false}/><Alert type="error" title={(q.error as Error).message}/></>:<Form form={form} key={policy?.version_no ?? "policy-loading"} layout="vertical" initialValues={policy ? {base_version:policy.version_no,objectives:policy.weights_bp.objectives/100,competencies:policy.weights_bp.competencies/100,levels:policy.levels.map((l:any)=>({...l,label_ar:l.label.ar,label_en:l.label.en,threshold:l.threshold_bp/100,bell_min:l.bell_min_bp/100,bell_max:l.bell_max_bp/100}))} : undefined} onFinish={v=>save.mutate({base_version:v.base_version,weights_bp:{objectives:Math.round(v.objectives*100),competencies:Math.round(v.competencies*100)},levels:v.levels.map((l:any)=>({level:l.level,label:{ar:l.label_ar,en:l.label_en},threshold_bp:Math.round(l.threshold*100),bell_min_bp:Math.round(l.bell_min*100),bell_max_bp:Math.round(l.bell_max*100)}))})}>{policy && <>
   <Form.Item name="base_version" hidden><Input/></Form.Item>
   <Row gutter={[16,0]}>
    <Col xs={24} md={12}><Form.Item name="objectives" label={t("Objectives weight (%)","وزن الأهداف (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} style={{width:"100%"}}/></Form.Item></Col>
    <Col xs={24} md={12}><Form.Item name="competencies" label={t("Competencies weight (%)","وزن الكفاءات (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} style={{width:"100%"}}/></Form.Item></Col>
   </Row>
   <Typography.Title level={5}>{t("Rating levels","مستويات التقدير")}</Typography.Title>
   <Form.List name="levels">{fields=><>{fields.map((f,i)=><Card size="small" key={f.key} title={`${t("Level","المستوى")} ${i+1}`} style={{marginBottom:12}}><Form.Item name={[f.name,"level"]} hidden><InputNumber/></Form.Item><Row gutter={[16,0]}><Col xs={24} md={12}><Form.Item name={[f.name,"label_ar"]} label={t("Arabic label","المسمى العربي")} rules={[{required:true}]}><Input/></Form.Item></Col><Col xs={24} md={12}><Form.Item name={[f.name,"label_en"]} label={t("English label","المسمى الإنجليزي")} rules={[{required:true}]}><Input/></Form.Item></Col><Col xs={24} md={8}><Form.Item name={[f.name,"threshold"]} label={t("Score threshold (%)","حد النتيجة (%)")}><InputNumber min={0} max={100} style={{width:"100%"}}/></Form.Item></Col><Col xs={24} md={8}><Form.Item name={[f.name,"bell_min"]} label={t("Bell Curve min (%)","الحد الأدنى للتوزيع (%)")}><InputNumber min={0} max={100} style={{width:"100%"}}/></Form.Item></Col><Col xs={24} md={8}><Form.Item name={[f.name,"bell_max"]} label={t("Bell Curve max (%)","الحد الأعلى للتوزيع (%)")}><InputNumber min={0} max={100} style={{width:"100%"}}/></Form.Item></Col></Row></Card>)}</>}</Form.List>
   <Space wrap><Button onClick={()=>form.validateFields().then(v=>previewMutation.mutate({sizes:[2,5,10,20],levels:v.levels.map((l:any)=>({level:l.level,bell_min_bp:Math.round(l.bell_min*100),bell_max_bp:Math.round(l.bell_max*100)}))}))} loading={previewMutation.isPending}>{t("Preview Bell Curve","معاينة التوزيع")}</Button><Button type="primary" htmlType="submit" loading={save.isPending}>{t("Publish new version","نشر إصدار جديد")}</Button></Space>
  </> }</Form>}
  {preview&&<Card size="small" title={t("Bell Curve preview","معاينة التوزيع")} style={{marginTop:16}}><pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(preview,null,2)}</pre></Card>}
 </Card></AppShell>;
}

export function ApiCompetencyTemplateWorkspace(){
 const ar=useLocale()==="ar";
 const {message}=App.useApp();
 const qc=useQueryClient();
 const [createOpen,setCreateOpen]=useState(false);
 const [selected,setSelected]=useState<any>(null);
 const [details,setDetails]=useState<any>(null);
 const [search,setSearch]=useState("");
 const [createForm]=Form.useForm();
 const [assignForm]=Form.useForm();
 const q=useQuery({queryKey:["admin","competency-templates"],queryFn:adminApi.competencyTemplates});
 const jobs=useQuery({queryKey:["admin","unassigned-job-titles"],queryFn:adminApi.unassignedJobTitles});
 const t=(en:string,arabic:string)=>ar?arabic:en;
 const create=useMutation({
  mutationFn:(v:any)=>adminApi.createCompetencyTemplate({
   name:{ar:v.name_ar,en:v.name_en},
   groups:[{name:{ar:v.group_ar,en:v.group_en},competencies:[{
    name:{ar:v.competency_ar,en:v.competency_en},
    description:{ar:v.description_ar||"",en:v.description_en||""}
   }]}]
  }),
  onSuccess:async()=>{
   message.success(t("Template created successfully","تم إنشاء القالب بنجاح"));
   setCreateOpen(false);
   createForm.resetFields();
   await qc.invalidateQueries({queryKey:["admin","competency-templates"]});
  }
 });
 const attach=useMutation({
  mutationFn:(v:{key:string;ids:number[]})=>adminApi.attachJobTitles(v.key,v.ids),
  onSuccess:async()=>{
   message.success(t("Job titles assigned successfully","تم ربط المسميات الوظيفية بنجاح"));
   setSelected(null);
   assignForm.resetFields();
   await qc.invalidateQueries({queryKey:["admin","competency-templates"]});
   await qc.invalidateQueries({queryKey:["admin","unassigned-job-titles"]});
  }
 });
 const remove=useMutation({
  mutationFn:(key:string)=>adminApi.deleteCompetencyTemplate(key),
  onSuccess:async()=>{
   message.success(t("Template deleted successfully","تم حذف القالب بنجاح"));
   setSelected(null);
   setDetails(null);
   await qc.invalidateQueries({queryKey:["admin","competency-templates"]});
  }
 });
 const rows=(q.data||[]) as any[];
 const filteredRows=rows.filter((r:any)=>{
  const term=search.trim().toLocaleLowerCase();
  if(!term)return true;
  const values=[
   r.name?.ar,r.name?.en,r.lineage_key,
   ...(r.groups||[]).flatMap((g:any)=>[
    g.name?.ar,g.name?.en,
    ...(g.competencies||[]).flatMap((c:any)=>[c.name?.ar,c.name?.en])
   ])
  ];
  return values.some((value:any)=>String(value||"").toLocaleLowerCase().includes(term));
 });
 const groupsCount=(r:any)=>(r.groups||[]).length;
 const competenciesCount=(r:any)=>(r.groups||[]).reduce((total:number,g:any)=>total+(g.competencies||[]).length,0);
 const columns=[
  {title:t("Template","القالب"),render:(_:any,r:any)=><Space direction="vertical" size={0}><Typography.Text strong>{r.name?.[ar?"ar":"en"]||r.name?.en||r.name?.ar||"—"}</Typography.Text><Typography.Text type="secondary" className="admin-template-key">{r.lineage_key}</Typography.Text></Space>},
  {title:t("Version","الإصدار"),dataIndex:"version",width:95,render:(v:any)=><Typography.Text strong>{v??"—"}</Typography.Text>},
  {title:t("Groups","المجموعات"),width:100,render:(_:any,r:any)=>groupsCount(r)},
  {title:t("Competencies","الكفاءات"),width:115,render:(_:any,r:any)=>competenciesCount(r)},
  {title:t("Job titles","المسميات الوظيفية"),width:130,render:(_:any,r:any)=><Typography.Text>{(r.job_titles||[]).length}</Typography.Text>},
  {title:t("Actions","الإجراءات"),key:"actions",width:170,align:"end" as const,render:(_:any,r:any)=><Space size={4} className="admin-template-actions">
   <Button size="small" type="text" icon={<EyeOutlined/>} title={t("View template details","عرض تفاصيل القالب")} aria-label={t("View template details","عرض تفاصيل القالب")} onClick={()=>setDetails(r)}/>
   <Button size="small" type="text" icon={<LinkOutlined/>} title={t("Assign job titles","ربط المسميات الوظيفية")} aria-label={t("Assign job titles","ربط المسميات الوظيفية")} onClick={()=>{setSelected(r);assignForm.resetFields();}}/>
   <Popconfirm title={t("Delete this template?","هل تريد حذف هذا القالب؟")} description={t("This action cannot be undone.","لا يمكن التراجع عن هذا الإجراء.")} okText={t("Delete","حذف")} cancelText={t("Cancel","إلغاء")} okButtonProps={{danger:true,loading:remove.isPending}} onConfirm={()=>remove.mutate(r.lineage_key)}>
    <Button size="small" type="text" danger icon={<DeleteOutlined/>} title={t("Delete template","حذف القالب")} aria-label={t("Delete template","حذف القالب")}/>
   </Popconfirm>
  </Space>}
 ];
 return <AppShell role="admin" title={t("Competency templates","قوالب الكفاءات")} subtitle={t("Manage competency templates and their job-title assignments.","إدارة قوالب الكفاءات وربطها بالمسميات الوظيفية.")}>
  <Space className="admin-competency-templates-workspace" orientation="vertical" style={{width:"100%"}} size={16}>
   <Card className="admin-competency-list-card" title={t("Template list","قائمة القوالب")} extra={<Button type="primary" icon={<PlusOutlined/>} onClick={()=>{createForm.resetFields();setCreateOpen(true);}}>{t("Add template","إضافة قالب")}</Button>}>
    <div className="admin-template-toolbar">
     <Input allowClear prefix={<SearchOutlined/>} value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search by template, group or competency name...","ابحث باسم القالب أو المجموعة أو الكفاءة...")} />
     <Typography.Text type="secondary">{t("{count} templates","{count} قالب").replace("{count}",String(filteredRows.length))}</Typography.Text>
    </div>
    {q.isLoading?<Skeleton active/>:q.isError?<Alert type="error" showIcon title={t("Unable to load competency templates","تعذر تحميل قوالب الكفاءات")} description={(q.error as Error).message}/>:<DataTable rowKey={(r:any)=>r.lineage_key} dataSource={filteredRows} columns={columns} locale={{emptyText:search?t("No templates match your search.","لا توجد قوالب تطابق البحث."):t("No templates created yet.","لم يتم إنشاء قوالب بعد.")}} />}
   </Card>
  </Space>
  <Modal className="admin-competency-template-modal" width={760} open={createOpen} title={t("Add competency template","إضافة قالب كفاءات")} okText={t("Create template","إنشاء القالب")} cancelText={t("Cancel","إلغاء")} onCancel={()=>{setCreateOpen(false);createForm.resetFields();}} onOk={()=>createForm.submit()} confirmLoading={create.isPending} destroyOnHidden>
   <Typography.Paragraph type="secondary">{t("Add the template, its first competency group and one competency. You can assign job titles after creating it.","أضف القالب ومجموعة الكفاءات الأولى وكفاءة واحدة، ويمكنك ربط المسميات الوظيفية بعد إنشاء القالب.")}</Typography.Paragraph>
   <Form form={createForm} layout="vertical" onFinish={v=>create.mutate(v)}>
    <Typography.Title level={5}>{t("Template information","بيانات القالب")}</Typography.Title>
    <Row gutter={[16,0]}>
     <Col xs={24} md={12}><Form.Item name="name_en" label={t("Template name (English)","اسم القالب بالإنجليزية")} rules={[{required:true}]}><Input placeholder={t("e.g. Engineering Competencies","مثال: الكفاءات الهندسية")} /></Form.Item></Col>
     <Col xs={24} md={12}><Form.Item name="name_ar" label={t("Template name (Arabic)","اسم القالب بالعربية")} rules={[{required:true}]}><Input dir="rtl" placeholder={t("e.g. الكفاءات الهندسية","مثال: الكفاءات الهندسية")} /></Form.Item></Col>
    </Row>
    <Typography.Title level={5}>{t("First competency group","مجموعة الكفاءات الأولى")}</Typography.Title>
    <Row gutter={[16,0]}>
     <Col xs={24} md={12}><Form.Item name="group_en" label={t("Group name (English)","اسم المجموعة بالإنجليزية")} rules={[{required:true}]}><Input placeholder={t("e.g. Core competencies","مثال: الكفاءات الأساسية")} /></Form.Item></Col>
     <Col xs={24} md={12}><Form.Item name="group_ar" label={t("Group name (Arabic)","اسم المجموعة بالعربية")} rules={[{required:true}]}><Input dir="rtl" placeholder={t("e.g. الكفاءات الأساسية","مثال: الكفاءات الأساسية")} /></Form.Item></Col>
    </Row>
    <Typography.Title level={5}>{t("First competency","الكفاءة الأولى")}</Typography.Title>
    <Row gutter={[16,0]}>
     <Col xs={24} md={12}><Form.Item name="competency_en" label={t("Competency name (English)","اسم الكفاءة بالإنجليزية")} rules={[{required:true}]}><Input placeholder={t("e.g. Communication","مثال: Communication")} /></Form.Item></Col>
     <Col xs={24} md={12}><Form.Item name="competency_ar" label={t("Competency name (Arabic)","اسم الكفاءة بالعربية")} rules={[{required:true}]}><Input dir="rtl" placeholder={t("e.g. التواصل","مثال: التواصل")} /></Form.Item></Col>
     <Col xs={24} md={12}><Form.Item name="description_en" label={t("Description (English)","الوصف بالإنجليزية")}><Input.TextArea rows={3} placeholder={t("Describe the expected behavior...","اكتب وصفاً للسلوك المتوقع...")} /></Form.Item></Col>
     <Col xs={24} md={12}><Form.Item name="description_ar" label={t("Description (Arabic)","الوصف بالعربية")}><Input.TextArea rows={3} dir="rtl" placeholder={t("اكتب وصفاً للسلوك المتوقع...","اكتب وصفاً للسلوك المتوقع...")} /></Form.Item></Col>
    </Row>
   </Form>
  </Modal>
  <Modal open={Boolean(selected)} title={t("Assign job titles","ربط المسميات الوظيفية")} okText={t("Save assignments","حفظ الربط")} cancelText={t("Cancel","إلغاء")} onCancel={()=>{setSelected(null);assignForm.resetFields();}} onOk={()=>assignForm.validateFields().then(v=>attach.mutate({key:selected.lineage_key,ids:v.job_title_ids||[]}))} confirmLoading={attach.isPending} destroyOnHidden>
   <Typography.Paragraph type="secondary">{t("Choose the job titles that should use this competency template.","اختر المسميات الوظيفية التي ستستخدم قالب الكفاءات هذا.")}</Typography.Paragraph>
   <Form form={assignForm} layout="vertical">
    <Form.Item name="job_title_ids" label={t("Available job titles","المسميات الوظيفية المتاحة")} rules={[{required:true,message:t("Select at least one job title.","اختر مسمى وظيفياً واحداً على الأقل.")}]}>
     <Select mode="multiple" showSearch optionFilterProp="label" placeholder={t("Search and select job titles...","ابحث واختر المسميات الوظيفية...")} loading={jobs.isLoading} options={(jobs.data||[]).map((j:any)=>({value:j.id,label:j.name?.[ar?"ar":"en"]||j.name}))}/>
    </Form.Item>
   </Form>
  </Modal>
  <Modal open={Boolean(details)} title={details?.name?.[ar?"ar":"en"]||t("Template details","تفاصيل القالب")} footer={<Button onClick={()=>setDetails(null)}>{t("Close","إغلاق")}</Button>} onCancel={()=>setDetails(null)} width={720}>
   {details&&<Space direction="vertical" size={16} style={{width:"100%"}}>
    <Row gutter={[12,12]}>
     <Col xs={12} md={8}><Card size="small"><Typography.Text type="secondary">{t("Version","الإصدار")}</Typography.Text><Typography.Title level={4}>{details.version??"—"}</Typography.Title></Card></Col>
     <Col xs={12} md={8}><Card size="small"><Typography.Text type="secondary">{t("Groups","المجموعات")}</Typography.Text><Typography.Title level={4}>{groupsCount(details)}</Typography.Title></Card></Col>
     <Col xs={12} md={8}><Card size="small"><Typography.Text type="secondary">{t("Competencies","الكفاءات")}</Typography.Text><Typography.Title level={4}>{competenciesCount(details)}</Typography.Title></Card></Col>
    </Row>
    {(details.groups||[]).map((group:any,index:number)=><Card size="small" key={group.id||index} title={group.name?.[ar?"ar":"en"]||group.name?.en||group.name?.ar||t("Group {number}","المجموعة {number}").replace("{number}",String(index+1))}>
     <Space direction="vertical" size={10} style={{width:"100%"}}>
      {(group.competencies||[]).map((competency:any,competencyIndex:number)=><div className="admin-template-competency-detail" key={competency.id||competencyIndex}>
       <Typography.Text strong>{competency.name?.[ar?"ar":"en"]||competency.name?.en||competency.name?.ar||"—"}</Typography.Text>
       {(competency.description?.[ar?"ar":"en"]||competency.description?.en||competency.description?.ar)&&<Typography.Paragraph type="secondary" style={{marginBottom:0}}>{competency.description?.[ar?"ar":"en"]||competency.description?.en||competency.description?.ar}</Typography.Paragraph>}
      </div>)}
     </Space>
    </Card>)}
    <div><Typography.Text type="secondary">{t("Assigned job titles","المسميات الوظيفية المرتبطة")}</Typography.Text><div className="admin-template-job-tags">{(details.job_titles||[]).length?details.job_titles.map((job:any,index:number)=><Typography.Text key={job.id||index} className="admin-template-job-tag">{job.name?.[ar?"ar":"en"]||job.name?.en||job.name?.ar||job.name}</Typography.Text>):<Typography.Text type="secondary">{t("No job titles assigned yet","لم يتم ربط مسميات وظيفية بعد")}</Typography.Text>}</div></div>
   </Space>}
  </Modal>
 </AppShell>;
}