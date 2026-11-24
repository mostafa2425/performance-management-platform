"use client";
import Link from "next/link";
import {Alert,Card,Col,Empty,Row,Skeleton,Tag,Typography} from "antd";
import {useQuery} from "@tanstack/react-query";
import {useLocale} from "next-intl";
import {AppShell} from "@/components/layout/app-shell";
import {useAuthSession} from "@/lib/auth/session";
import {cyclesApi,plansApi,resultsApi} from "@/lib/api/endpoints";
const rowsOf=(v:any)=>Array.isArray(v)?v:Array.isArray(v?.data)?v.data:[];
const localized=(v:any,ar:boolean)=>typeof v==="object"?(ar?v?.ar||v?.en:v?.en||v?.ar)||"—":v||"—";
const percent=(v:any)=>typeof v==="number"?(v/100).toFixed(2)+"%":"—";
export default function EmployeeDashboardWorkspace(){
 const ar=useLocale()==="ar",locale=ar?"ar":"en",t=(en:string,a:string)=>ar?a:en;
 const {isReady,isAuthenticated}=useAuthSession();
 const cq=useQuery({queryKey:["employee-home-cycles"],queryFn:cyclesApi.mine,enabled:isAuthenticated});
 const pq=useQuery({queryKey:["employee-home-plans"],queryFn:()=>plansApi.list({per_page:100}),enabled:isAuthenticated});
 const rq=useQuery({queryKey:["employee-home-results"],queryFn:()=>resultsApi.mine(),enabled:isAuthenticated});
 const cycles=rowsOf(cq.data).filter((c:any)=>c.my_roles?.member),plans=rowsOf(pq.data),results=rowsOf(rq.data).filter((r:any)=>r.published===true),plan=plans[0];
 const busy=!isReady||cq.isLoading||pq.isLoading||rq.isLoading,error=cq.error||pq.error||rq.error;
 return <AppShell title={t("My performance","أدائي")} subtitle={t("Your current plan and published annual results.","خطتك الحالية ونتائجك السنوية المنشورة.")}>
 {busy?<Skeleton active/>:error?<Alert type="error" showIcon title={(error as Error).message}/>:<>
 <Row gutter={[12,12]} style={{marginBottom:16}}><Col xs={24} md={8}><Card><Typography.Text type="secondary">{t("Active cycles","الدورات النشطة")}</Typography.Text><Typography.Title level={2}>{cycles.length}</Typography.Title></Card></Col><Col xs={24} md={8}><Card><Typography.Text type="secondary">{t("My plan status","حالة خطتي")}</Typography.Text><Typography.Title level={4}>{plan?.status?.label||"—"}</Typography.Title></Card></Col><Col xs={24} md={8}><Card><Typography.Text type="secondary">{t("Published results","النتائج المنشورة")}</Typography.Text><Typography.Title level={2}>{results.length}</Typography.Title></Card></Col></Row>
 <Card title={t("My performance plan","خطة الأداء الخاصة بي")} style={{marginBottom:16}}>{plan?<><Row gutter={16}><Col xs={24} md={12}><Typography.Text type="secondary">{t("Cycle","الدورة")}</Typography.Text><div><Typography.Text strong>{localized(plan.cycle?.name,ar)||plan.cycle?.performance_year||"—"}</Typography.Text></div></Col><Col xs={24} md={12}><Typography.Text type="secondary">{t("Status","الحالة")}</Typography.Text><div><Tag color="processing">{plan.status?.label||"—"}</Tag></div></Col></Row><div style={{marginTop:12}}><Link href={"/"+locale+"/employee/objectives"}>{t("Open my objectives","عرض أهدافي")} →</Link></div></>:<Empty description={t("No performance plan is available yet.","لا توجد خطة أداء متاحة حتى الآن.")}/>}</Card>
 <Card title={t("My active cycles","دوراتي النشطة")} style={{marginBottom:16}}>{cycles.length?<Row gutter={[12,12]}>{cycles.map((c:any)=><Col xs={24} md={12} key={c.id}><Card size="small"><Typography.Text strong>{localized(c.name,ar)}</Typography.Text><div><Tag color="blue">{c.current_stage||"—"}</Tag></div><Typography.Text type="secondary">{t("Performance year","سنة الأداء")}: {c.performance_year||"—"}</Typography.Text></Card></Col>)}</Row>:<Empty description={t("No active cycle","لا توجد دورة نشطة")}/>}</Card>
 <Card title={t("Published annual results","النتائج السنوية المنشورة")} extra={<Link href={"/"+locale+"/employee/performance"}>{t("View all","عرض الكل")}</Link>}>{results.length?<Row gutter={[12,12]}>{results.map((r:any)=><Col xs={24} md={12} key={r.id}><Card size="small"><Typography.Text strong>{localized(r.cycle?.name,ar)} · {r.cycle?.performance_year||"—"}</Typography.Text><Row gutter={8} style={{marginTop:12}}>{[[t("Objectives","الأهداف"),r.objectives_bp],[t("Competencies","الجدارات"),r.competency_bp],[t("Overall","الإجمالي"),r.overall_bp]].map(([label,value]:any)=><Col span={8} key={label}><Typography.Text type="secondary">{label}</Typography.Text><Typography.Title level={4}>{percent(value)}</Typography.Title></Col>)}</Row><Typography.Text strong>{t("Final rating","التقييم النهائي")}: {r.rating_level??"—"} · {localized(r.rating_label,ar)}</Typography.Text>
 <div style={{marginTop:12}}><Typography.Text strong>{t("Approved objectives and KPI targets","الأهداف ومؤشرات الأداء المعتمدة")}</Typography.Text>
 {(r.objectives||[]).map((o:any,i:number)=><div key={i} style={{padding:"8px 0",borderTop:"1px solid #f0f0f0"}}><Typography.Text>{o.text||o.name||"—"}</Typography.Text>
 {(o.kpis||[]).map((k:any,j:number)=><div key={j} style={{paddingInlineStart:12}}><Typography.Text type="secondary">{k.name||"—"} · {t("Target","المستهدف")}: {k.target??"—"} {k.unit||""}</Typography.Text></div>)}</div>)}
 </div>
 {(Array.isArray(r.competencies)&&r.competencies.length>0)?<div style={{marginTop:8}}><Typography.Text strong>{t("Annual competencies","الجدارات السنوية")}</Typography.Text>{r.competencies.map((item:any,i:number)=><div key={i}><Typography.Text type="secondary">{item.name||item.competency?.name||"—"}</Typography.Text></div>)}</div>:null}
 <div style={{marginTop:8}}><Typography.Text type="secondary">{t("Published","تاريخ النشر")}: {r.published_at?new Date(r.published_at).toLocaleDateString(ar?"ar-EG":"en-US"):"—"}</Typography.Text></div></Card></Col>)}</Row>:<Empty description={t("Final results appear here after official publication.","ستظهر النتائج النهائية هنا بعد نشرها رسميًا.")}/>}</Card>
 </>}
 </AppShell>;
}