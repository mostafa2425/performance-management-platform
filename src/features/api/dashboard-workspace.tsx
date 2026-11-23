"use client";
import Link from "next/link";
import { Alert, Card, Col, Empty, Row, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { useAuthSession } from "@/lib/auth/session";
import { cyclesApi, plansApi, resultsApi } from "@/lib/api/endpoints";
export default function DashboardPage(){
 const ar=useLocale()==="ar"; const {user,isReady,isAuthenticated}=useAuthSession(); const t=(en:string,a:string)=>ar?a:en;
 const cycles=useQuery({queryKey:["cycles"],queryFn:cyclesApi.mine,enabled:isAuthenticated});
 const plans=useQuery({queryKey:["plans","dashboard"],queryFn:()=>plansApi.list({per_page:100}),enabled:isAuthenticated});
 const results=useQuery({queryKey:["results","dashboard"],queryFn:()=>resultsApi.list(),enabled:isAuthenticated});
 const busy= !isReady||cycles.isLoading||plans.isLoading||results.isLoading; const error=cycles.error||plans.error||results.error;
 const cycleRows=cycles.data||[]; const planRows=(plans.data as any)?.data||[]; const resultRows=results.data||[];
 const active=cycleRows.filter((c:any)=>c.status==="active"); const pending=planRows.filter((p:any)=>!["approved"].includes(p.status));
 const role=user?.roles?.admin?"admin":user?.roles?.manager?"manager":"employee";
 return <AppShell title={t("Performance overview","نظرة عامة على الأداء")} subtitle={t("Live performance data from your PMP account.","بيانات الأداء المباشرة من حسابك في منصة إدارة الأداء.")}>
  {!isAuthenticated&&isReady&&<Alert type="warning" showIcon title={t("Please sign in to view your workspace.","يرجى تسجيل الدخول لعرض مساحة العمل.")}/>} 
  {busy?<Spin/>:error?<Alert type="error" showIcon title={(error as Error).message}/>:<><section className="welcome-banner"><div className="welcome-copy"><div className="eyebrow">{t("PERFORMANCE MANAGEMENT","إدارة الأداء")}</div><h2>{t("Welcome back","مرحباً بعودتك")}، {user?.employee?.full_name?.split(" ")[0]||user?.name||""}</h2><p>{t("Your workspace is connected to the live performance API.","مساحة العمل متصلة الآن بواجهة الأداء المباشرة.")}</p></div><div className="welcome-visual"><div className="welcome-stat"><span>{t("Active cycles","الدورات النشطة")}</span><strong>{active.length}</strong><small>{t("Available to your role","متاحة حسب صلاحيتك")}</small></div></div></section>
   <Row gutter={[16,16]} style={{marginTop:20}}>
    <Col xs={24} sm={12} lg={6}><Card><Typography.Text type="secondary">{t("Active cycles","الدورات النشطة")}</Typography.Text><Typography.Title level={2}>{active.length}</Typography.Title></Card></Col>
    <Col xs={24} sm={12} lg={6}><Card><Typography.Text type="secondary">{t("Performance plans","خطط الأداء")}</Typography.Text><Typography.Title level={2}>{planRows.length}</Typography.Title></Card></Col>
    <Col xs={24} sm={12} lg={6}><Card><Typography.Text type="secondary">{t("Pending plans","الخطط المعلقة")}</Typography.Text><Typography.Title level={2}>{pending.length}</Typography.Title></Card></Col>
    <Col xs={24} sm={12} lg={6}><Card><Typography.Text type="secondary">{t("Published results","النتائج المنشورة")}</Typography.Text><Typography.Title level={2}>{resultRows.filter((r:any)=>r.published).length}</Typography.Title></Card></Col>
   </Row>
   <Row gutter={[16,16]} style={{marginTop:8}}><Col xs={24} lg={14}><Card title={t("Your performance cycles","دورات الأداء الخاصة بك")}>{active.length?active.map((c:any)=><div key={c.id} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}><Typography.Text strong>{typeof c.name==="object"?(ar?c.name.ar:c.name.en):c.name}</Typography.Text><div><Tag color="green">{c.current_stage||c.status}</Tag><Typography.Text type="secondary">{c.performance_year} · {c.start_date} — {c.end_date}</Typography.Text></div></div>):<Empty description={t("No active cycles","لا توجد دورات نشطة")}/>}</Card></Col>
    <Col xs={24} lg={10}><Card title={t("Next actions","الإجراءات التالية")}>{pending.length?pending.slice(0,5).map((p:any)=><div key={p.id} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><Typography.Text strong>{p.employee?.name||p.employee?.full_name||`Plan #${p.id}`}</Typography.Text><div><Tag>{p.display_status||p.status}</Tag></div></div>):<Empty description={t("No pending plan actions","لا توجد إجراءات خطط معلقة")}/>}</Card></Col></Row>
   <div style={{marginTop:16}}><Link href={`/${ar?"ar":"en"}/${role==="admin"?"admin/performance-cycles":role==="manager"?"manager/objectives":"employee/objectives"}`}>{t("Open your workspace","فتح مساحة العمل")} →</Link></div>
  </>}</AppShell>;
}