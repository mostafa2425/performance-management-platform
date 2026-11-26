"use client";

import { DataTable } from "@/components/ui/data-table";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftOutlined, EditOutlined, CalculatorOutlined } from "@ant-design/icons";
import { DeleteOutlined, EyeOutlined, LinkOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Empty, Form, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Skeleton, Tag, Tooltip, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import "./admin-configuration-workspaces.css";

export function ApiObjectiveCategoriesWorkspace() {
 const ar = useLocale() === "ar";
 const { message } = App.useApp();
 const qc = useQueryClient();
 const [editing, setEditing] = useState<any>(null);
 const [search, setSearch] = useState("");
 const [form] = Form.useForm();
 const t = (en: string, arabic: string) => ar ? arabic : en;
 const q = useQuery({
  queryKey: ["admin", "objective-categories"],
  queryFn: () => adminApi.objectiveCategories({ per_page: 100 }),
 });
 const rows = ((q.data as any)?.data || []) as any[];
 const filteredRows = useMemo(() => {
  const term = search.trim().toLocaleLowerCase();
  if (!term) return rows;
  return rows.filter((row: any) => [
   row.id,
   row.name?.ar,
   row.name?.en,
  ].some((value) => String(value ?? "").toLocaleLowerCase().includes(term)));
 }, [rows, search]);
 const closeEditor = () => {
  setEditing(null);
  form.resetFields();
 };
 const save = useMutation({
  mutationFn: (values: any) => {
   const payload = { name: { ar: values.name_ar.trim(), en: values.name_en.trim() } };
   return editing?.id
    ? adminApi.updateObjectiveCategory(editing.id, payload)
    : adminApi.createObjectiveCategory(payload);
  },
  onSuccess: async () => {
   message.success(t("Category saved successfully", "تم حفظ التصنيف بنجاح"));
   closeEditor();
   await qc.invalidateQueries({ queryKey: ["admin", "objective-categories"] });
  },
  onError: (error: Error) => message.error(error.message || t("Unable to save category", "تعذر حفظ التصنيف")),
 });
 const remove = useMutation({
  mutationFn: (id: number) => adminApi.deleteObjectiveCategory(id),
  onSuccess: async () => {
   message.success(t("Category deleted successfully", "تم حذف التصنيف بنجاح"));
   await qc.invalidateQueries({ queryKey: ["admin", "objective-categories"] });
  },
  onError: (error: Error) => message.error(error.message || t("Unable to delete category", "تعذر حذف التصنيف")),
 });
 const openCreate = () => {
  form.resetFields();
  setEditing({});
 };
 const openEdit = (row: any) => {
  form.setFieldsValue({ name_ar: row.name?.ar || "", name_en: row.name?.en || "" });
  setEditing(row);
 };
 const columns = [
  {
   title: t("Category", "التصنيف"),
   key: "category",
   render: (_: any, row: any) => (
    <Space direction="vertical" size={2} className="objective-category-name-cell">
     <Typography.Text strong>{row.name?.[ar ? "ar" : "en"] || row.name?.en || row.name?.ar || "—"}</Typography.Text>
     <Typography.Text type="secondary" className="objective-category-id">ID: {row.id}</Typography.Text>
    </Space>
   ),
  },
  {
   title: t("Arabic name", "الاسم العربي"),
   key: "arabic",
   render: (_: any, row: any) => <Typography.Text dir="rtl">{row.name?.ar || "—"}</Typography.Text>,
  },
  {
   title: t("English name", "الاسم الإنجليزي"),
   key: "english",
   render: (_: any, row: any) => <Typography.Text>{row.name?.en || "—"}</Typography.Text>,
  },
  {
   title: t("Last updated", "آخر تحديث"),
   dataIndex: "updated_at",
   width: 150,
   render: (value: string) => value
    ? new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium" }).format(new Date(value))
    : "—",
  },
  {
   title: t("Actions", "الإجراءات"),
   key: "actions",
   width: 112,
   align: ar ? "left" as const : "right" as const,
   render: (_: any, row: any) => (
    <Space size={4} className="objective-category-actions">
     <Tooltip title={t("Edit category", "تعديل التصنيف")}>
      <Button
       type="text"
       size="small"
       icon={<EditOutlined />}
       aria-label={t("Edit category", "تعديل التصنيف")}
       onClick={() => openEdit(row)}
      />
     </Tooltip>
     <Popconfirm
      title={t("Delete this category?", "هل تريد حذف هذا التصنيف؟")}
      description={t("This may affect objectives that reference this category.", "قد يؤثر ذلك على الأهداف المرتبطة بهذا التصنيف.")}
      okText={t("Delete", "حذف")}
      cancelText={t("Cancel", "إلغاء")}
      okButtonProps={{ danger: true, loading: remove.isPending }}
      onConfirm={() => remove.mutate(row.id)}
     >
      <Tooltip title={t("Delete category", "حذف التصنيف")}>
       <Button
        type="text"
        size="small"
        danger
        icon={<DeleteOutlined />}
        aria-label={t("Delete category", "حذف التصنيف")}
       />
      </Tooltip>
     </Popconfirm>
    </Space>
   ),
  },
 ];
 return (
  <AppShell
   role="admin"
   title={t("Objective categories", "تصنيفات الأهداف")}
   subtitle={t("Create and maintain the bilingual categories used to organize employee objectives.", "إنشاء وإدارة التصنيفات ثنائية اللغة المستخدمة لتنظيم أهداف الموظفين.")}
  >
   <Space direction="vertical" size={16} className="admin-objective-categories-workspace">
    <Row gutter={[12, 12]}>
     <Col xs={24} sm={12} lg={8}>
      <Card className="objective-category-summary-card">
       <Typography.Text type="secondary">{t("Total categories", "إجمالي التصنيفات")}</Typography.Text>
       <div className="objective-category-summary-value">
        <Typography.Title level={3}>{q.isSuccess ? rows.length : "—"}</Typography.Title>
        <Tag color="blue">{t("Available", "متاحة")}</Tag>
       </div>
      </Card>
     </Col>
     <Col xs={24} sm={12} lg={16}>
      <Card className="objective-category-guidance-card">
       <Typography.Text strong>{t("Keep categories clear and consistent", "حافظ على وضوح التصنيفات واتساقها")}</Typography.Text>
       <Typography.Paragraph type="secondary">
        {t("Use both Arabic and English names so categories remain understandable across localized workspaces.", "أدخل الاسم بالعربية والإنجليزية لضمان وضوح التصنيفات في جميع واجهات النظام.")}
       </Typography.Paragraph>
      </Card>
     </Col>
    </Row>
    <Card
     className="admin-objective-categories-card"
     title={
      <div className="objective-category-card-title">
       <div>
        <Typography.Title level={5}>{t("Category directory", "دليل التصنيفات")}</Typography.Title>
        <Typography.Text type="secondary">{t("Manage the categories available when employees create objectives.", "إدارة التصنيفات المتاحة عند إنشاء أهداف الموظفين.")}</Typography.Text>
       </div>
       <Tag>{q.isSuccess ? filteredRows.length : "—"} {t("items", "عنصر")}</Tag>
      </div>
     }
     extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
       {t("Add category", "إضافة تصنيف")}
      </Button>
     }
    >
     <div className="objective-category-toolbar">
      <Input
       allowClear
       prefix={<SearchOutlined />}
       value={search}
       onChange={(event) => setSearch(event.target.value)}
       placeholder={t("Search Arabic name, English name or ID", "ابحث بالاسم العربي أو الإنجليزي أو الرقم")}
      />
      {search ? (
       <Button type="text" onClick={() => setSearch("")}>{t("Clear search", "مسح البحث")}</Button>
      ) : null}
     </div>
     {q.isError ? (
      <Alert
       type="error"
       showIcon
       title={t("Unable to load objective categories", "تعذر تحميل تصنيفات الأهداف")}
       description={(q.error as Error).message}
       action={<Button size="small" onClick={() => q.refetch()}>{t("Retry", "إعادة المحاولة")}</Button>}
      />
     ) : (
      <DataTable
       rowKey="id"
       ariaLabel={t("Objective categories", "تصنيفات الأهداف")}
       dataSource={filteredRows}
       columns={columns as any}
       loading={q.isFetching}
       scroll={{ x: 760 }}
       pagination={{ pageSize: 10, showSizeChanger: true, hideOnSinglePage: true }}
       locale={{
        emptyText: (
         <Empty
          description={search
           ? t("No categories match your search.", "لا توجد تصنيفات تطابق البحث.")
           : t("No objective categories yet. Add the first category to get started.", "لا توجد تصنيفات بعد. أضف أول تصنيف للبدء.")}
         >
          {!search && !q.isError ? <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>{t("Add category", "إضافة تصنيف")}</Button> : null}
         </Empty>
        ),
       }}
      />
     )}
    </Card>
   </Space>
   <Modal
    className="admin-objective-categories-modal"
    open={Boolean(editing)}
    title={editing?.id ? t("Edit objective category", "تعديل تصنيف الهدف") : t("Create objective category", "إنشاء تصنيف هدف")}
    okText={editing?.id ? t("Save changes", "حفظ التعديلات") : t("Create category", "إنشاء التصنيف")}
    cancelText={t("Cancel", "إلغاء")}
    onCancel={closeEditor}
    onOk={() => form.submit()}
    confirmLoading={save.isPending}
    okButtonProps={{ disabled: save.isPending }}
    destroyOnHidden
   >
    <Typography.Paragraph type="secondary">
     {t("Provide a name in both languages. These names will be shown wherever objectives are categorized.", "أدخل اسم التصنيف باللغتين، وسيظهر الاسمان عند تصنيف الأهداف في النظام.")}
    </Typography.Paragraph>
    <Form
     form={form}
     layout="vertical"
     requiredMark="optional"
     onFinish={(values) => save.mutate(values)}
    >
     <Row gutter={[16, 0]}>
      <Col xs={24} md={12}>
       <Form.Item
        name="name_ar"
        label={t("Arabic name", "الاسم العربي")}
        rules={[
         { required: true, whitespace: true, message: t("Enter the Arabic category name.", "أدخل اسم التصنيف بالعربية.") },
         { max: 120, message: t("Name must be 120 characters or fewer.", "يجب ألا يزيد الاسم عن 120 حرفًا.") },
        ]}
       >
        <Input dir="rtl" maxLength={120} showCount placeholder={t("e.g. تطوير الأعمال", "مثال: تطوير الأعمال")} />
       </Form.Item>
      </Col>
      <Col xs={24} md={12}>
       <Form.Item
        name="name_en"
        label={t("English name", "الاسم الإنجليزي")}
        rules={[
         { required: true, whitespace: true, message: t("Enter the English category name.", "أدخل اسم التصنيف بالإنجليزية.") },
         { max: 120, message: t("Name must be 120 characters or fewer.", "يجب ألا يزيد الاسم عن 120 حرفًا.") },
        ]}
       >
        <Input maxLength={120} showCount placeholder="e.g. Business Development" />
       </Form.Item>
      </Col>
     </Row>
    </Form>
   </Modal>
  </AppShell>
 );
}

function getPolicyPreviewRows(preview:any):any[] {
 if(Array.isArray(preview)) return preview;
 for(const key of ["rows","data","results","allocations"]) if(Array.isArray(preview?.[key])) return preview[key];
 if(preview && typeof preview==="object") {
  const groups=Object.entries(preview).filter((entry)=>Array.isArray(entry[1]));
  if(groups.length) return groups.flatMap(([scenario,items])=>(items as any[]).map(item=>({scenario,...item})));
 }
 return [];
}

export function ApiPerformancePolicyWorkspace(){
 const ar=useLocale()==="ar";const router=useRouter();const [preview,setPreview]=useState<any>(null);
 const q=useQuery({queryKey:["admin","policy"],queryFn:adminApi.policy});
 const previewMutation=useMutation({mutationFn:(policy:any)=>adminApi.previewPolicy({sizes:[2,5,10,20],levels:(policy.levels||[]).map((level:any)=>({level:level.level,bell_min_bp:level.bell_min_bp,bell_max_bp:level.bell_max_bp}))}),onSuccess:setPreview});
 const t=(en:string,arabic:string)=>ar?arabic:en;const policy=q.data as any;const levels=policy?.levels||[];const previewRows=getPolicyPreviewRows(preview);
 const previewColumns=previewRows.length?Object.keys(previewRows[0]).map(key=>({title:key.replaceAll("_"," ").replace(/\b\w/g,(letter:string)=>letter.toUpperCase()),dataIndex:key,render:(value:any)=>value!==null&&typeof value==="object"?JSON.stringify(value):value??"—"})):[];
 return <AppShell role="admin" title={t("Performance configuration","إعدادات الأداء")} subtitle={t("Review the current scoring policy and Bell Curve distribution before making changes.","راجع سياسة احتساب الأداء والتوزيع قبل إجراء أي تغييرات.")}>
  <Space direction="vertical" size={16} style={{width:"100%"}}>
   {q.isLoading?<Card><Skeleton active/></Card>:q.isError?<Alert type="error" showIcon title={t("Unable to load scoring policy","تعذر تحميل سياسة احتساب الأداء")} description={(q.error as Error).message}/>:<>
    <Row gutter={[12,12]}>
     <Col xs={24} sm={8}><Card className="policy-overview-card"><Typography.Text type="secondary">{t("Policy version","إصدار السياسة")}</Typography.Text><Typography.Title level={3}>{"v"+(policy?.version_no??"—")}</Typography.Title></Card></Col>
     <Col xs={24} sm={8}><Card className="policy-overview-card"><Typography.Text type="secondary">{t("Objectives weight","وزن الأهداف")}</Typography.Text><Typography.Title level={3}>{policy?.weights_bp?.objectives!=null?(policy.weights_bp.objectives/100)+"%":"—"}</Typography.Title></Card></Col>
     <Col xs={24} sm={8}><Card className="policy-overview-card"><Typography.Text type="secondary">{t("Competencies weight","وزن الكفاءات")}</Typography.Text><Typography.Title level={3}>{policy?.weights_bp?.competencies!=null?(policy.weights_bp.competencies/100)+"%":"—"}</Typography.Title></Card></Col>
    </Row>
    <Card className="policy-levels-card" title={t("Rating levels & Bell Curve","مستويات التقدير والتوزيع")} extra={<Space wrap>
     <Button icon={<CalculatorOutlined/>} loading={previewMutation.isPending} onClick={()=>previewMutation.mutate(policy)}>{t("Preview Bell Curve","معاينة التوزيع")}</Button>
     <Button type="primary" icon={<EditOutlined/>} onClick={()=>router.push("/admin/performance-configuration/edit")}>{t("Edit scoring policy","تعديل سياسة الاحتساب")}</Button>
    </Space>}>
     <Typography.Paragraph type="secondary">{t("Review score thresholds and the allowed minimum and maximum distribution for each rating level.","راجع حدود الدرجات ونسب التوزيع الدنيا والعليا المسموح بها لكل مستوى تقدير.")}</Typography.Paragraph>
     <DataTable rowKey={(row:any)=>row.level} dataSource={levels} pagination={false} columns={[
      {title:t("Level","المستوى"),dataIndex:"level",width:90,render:(value:any)=><Typography.Text strong>{value??"—"}</Typography.Text>},
      {title:t("Rating","التقدير"),render:(_:any,row:any)=>row.label?.[ar?"ar":"en"]||row.label?.en||row.label?.ar||"—"},
      {title:t("Score threshold","حد النتيجة"),render:(_:any,row:any)=>row.threshold_bp!=null?(row.threshold_bp/100)+"%":"—"},
      {title:t("Bell Curve minimum","الحد الأدنى للتوزيع"),render:(_:any,row:any)=>row.bell_min_bp!=null?(row.bell_min_bp/100)+"%":"—"},
      {title:t("Bell Curve maximum","الحد الأعلى للتوزيع"),render:(_:any,row:any)=>row.bell_max_bp!=null?(row.bell_max_bp/100)+"%":"—"}
     ]}/>
    </Card>
    {preview&&<Card className="policy-preview-card" title={t("Bell Curve preview results","نتائج معاينة التوزيع")} extra={<Button type="text" onClick={()=>setPreview(null)}>{t("Clear preview","مسح المعاينة")}</Button>}>
     {previewRows.length?<DataTable rowKey={(_:any,index?:number)=>String(index)} dataSource={previewRows} pagination={false} columns={previewColumns}/>:<Alert type="info" showIcon title={t("Preview generated","تم إنشاء المعاينة")} description={t("The preview service returned no tabular rows. Review the configured distribution ranges above.","أعادت خدمة المعاينة نتيجة دون صفوف جدولية. راجع نطاقات التوزيع المحددة أعلاه.")}/>}
    </Card>}
   </>}
  </Space>
 </AppShell>;
}

export function ApiPerformancePolicyEditorWorkspace(){
 const ar=useLocale()==="ar";const router=useRouter();const {message}=App.useApp();const qc=useQueryClient();const [form]=Form.useForm();
 const q=useQuery({queryKey:["admin","policy"],queryFn:adminApi.policy});
 const save=useMutation({mutationFn:(v:any)=>adminApi.savePolicy({base_version:v.base_version,weights_bp:{objectives:Math.round(v.objectives*100),competencies:Math.round(v.competencies*100)},levels:v.levels.map((level:any)=>({level:level.level,label:{ar:level.label_ar,en:level.label_en},threshold_bp:Math.round(level.threshold*100),bell_min_bp:Math.round(level.bell_min*100),bell_max_bp:Math.round(level.bell_max*100)}))}),onSuccess:async()=>{message.success(ar?"تم نشر إصدار جديد من السياسة":"New policy version published");await qc.invalidateQueries({queryKey:["admin","policy"]});router.push("/admin/performance-configuration");}});
 const t=(en:string,arabic:string)=>ar?arabic:en;const policy=q.data as any;
 return <AppShell role="admin" title={t("Edit scoring policy","تعديل سياسة احتساب الأداء")} subtitle={t("Update score weights, rating thresholds and Bell Curve limits.","حدّث أوزان النتائج وحدود التقديرات ونسب التوزيع.")}>
  <Space direction="vertical" size={16} style={{width:"100%"}}>
   <Button type="text" icon={<ArrowLeftOutlined/>} onClick={()=>router.push("/admin/performance-configuration")}>{t("Back to configuration","العودة إلى الإعدادات")}</Button>
   <Card className="policy-editor-card" title={t("Scoring policy settings","إعدادات سياسة احتساب الأداء")}>
    {q.isLoading?<Skeleton active/>:q.isError?<Alert type="error" showIcon title={t("Unable to load scoring policy","تعذر تحميل سياسة احتساب الأداء")} description={(q.error as Error).message}/>:<Form form={form} key={policy?.version_no??"policy"} layout="vertical" initialValues={{base_version:policy?.version_no,objectives:policy?.weights_bp?.objectives/100,competencies:policy?.weights_bp?.competencies/100,levels:(policy?.levels||[]).map((level:any)=>({...level,label_ar:level.label?.ar,label_en:level.label?.en,threshold:level.threshold_bp/100,bell_min:level.bell_min_bp/100,bell_max:level.bell_max_bp/100}))}} onFinish={values=>save.mutate(values)}>
     <Form.Item name="base_version" hidden><Input/></Form.Item>
     <Typography.Title level={5}>{t("Score weights","أوزان النتائج")}</Typography.Title>
     <Row gutter={[16,0]}>
      <Col xs={24} md={12}><Form.Item name="objectives" label={t("Objectives weight (%)","وزن الأهداف (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} precision={2} style={{width:"100%"}} placeholder={t("Enter objectives weight","أدخل وزن الأهداف")}/></Form.Item></Col>
      <Col xs={24} md={12}><Form.Item name="competencies" label={t("Competencies weight (%)","وزن الكفاءات (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} precision={2} style={{width:"100%"}} placeholder={t("Enter competencies weight","أدخل وزن الكفاءات")}/></Form.Item></Col>
     </Row>
     <Alert type="info" showIcon title={t("Weights must total 100%","يجب أن يساوي إجمالي الأوزان 100%")} description={t("Objectives and competencies weights are used to calculate the final performance score.","تُستخدم أوزان الأهداف والكفاءات في حساب نتيجة الأداء النهائية.")}/>
     <Typography.Title level={5} style={{marginTop:24}}>{t("Rating levels","مستويات التقدير")}</Typography.Title>
     <Form.List name="levels">{fields=><Space direction="vertical" size={12} style={{width:"100%"}}>{fields.map((field,index)=><Card size="small" key={field.key} className="policy-level-editor-card" title={t("Rating level","مستوى التقدير")+" "+(index+1)}>
      <Form.Item name={[field.name,"level"]} hidden><InputNumber/></Form.Item>
      <Row gutter={[16,0]}>
       <Col xs={24} md={12}><Form.Item name={[field.name,"label_en"]} label={t("Rating label (English)","مسمى التقدير بالإنجليزية")} rules={[{required:true}]}><Input placeholder={t("e.g. Exceeds expectations","مثال: Exceeds expectations")}/></Form.Item></Col>
       <Col xs={24} md={12}><Form.Item name={[field.name,"label_ar"]} label={t("Rating label (Arabic)","مسمى التقدير بالعربية")} rules={[{required:true}]}><Input dir="rtl" placeholder={t("مثال: يفوق التوقعات","مثال: يفوق التوقعات")}/></Form.Item></Col>
       <Col xs={24} md={8}><Form.Item name={[field.name,"threshold"]} label={t("Score threshold (%)","حد النتيجة (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} precision={2} style={{width:"100%"}} placeholder="0–100"/></Form.Item></Col>
       <Col xs={24} md={8}><Form.Item name={[field.name,"bell_min"]} label={t("Bell Curve minimum (%)","الحد الأدنى للتوزيع (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} precision={2} style={{width:"100%"}} placeholder="0–100"/></Form.Item></Col>
       <Col xs={24} md={8}><Form.Item name={[field.name,"bell_max"]} label={t("Bell Curve maximum (%)","الحد الأعلى للتوزيع (%)")} rules={[{required:true}]}><InputNumber min={0} max={100} precision={2} style={{width:"100%"}} placeholder="0–100"/></Form.Item></Col>
      </Row>
     </Card>)}</Space>}</Form.List>
     <div className="policy-editor-footer"><Button onClick={()=>router.push("/admin/performance-configuration")}>{t("Cancel","إلغاء")}</Button><Button type="primary" htmlType="submit" loading={save.isPending}>{t("Publish new version","نشر إصدار جديد")}</Button></div>
    </Form>}
   </Card>
  </Space>
 </AppShell>;
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
  {title:t("Actions","الإجراءات"),key:"actions",width:170,align:(ar?"left" as const:"right" as const),render:(_:any,r:any)=><Space size={4} className="admin-template-actions">
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