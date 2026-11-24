"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {Alert,Button,Card,Col,Empty,Input,Row,Select,Spin,Statistic,Table,Tag,Typography} from "antd";
import {useQueries,useQuery} from "@tanstack/react-query";
import {useLocale} from "next-intl";
import {AppShell} from "@/components/layout/app-shell";
import {useAuthSession} from "@/lib/auth/session";
import {cyclesApi} from "@/lib/api/endpoints";
const labels:any={not_started:["Not started","لم تبدأ"],draft:["Draft","مسودة"],pending_admin:["Pending Admin approval","بانتظار موافقة المسؤول"],pending_employee:["Pending employee review","بانتظار مراجعة الموظف"],returned:["Returned","مُعادة"],approved:["Goals approved","الأهداف معتمدة"],complete:["Evaluation complete","اكتمل التقييم"],missed:["Missed","لم يتم"],removed:["Removed","مستبعد"]};
const rowsOf=(v:any)=>Array.isArray(v)?v:Array.isArray(v?.data)?v.data:[];
const nameOf=(v:any,ar:boolean)=>typeof v==="object"?(ar?v?.ar||v?.en:v?.en||v?.ar)||"—":v||"—";
export default function ManagerDashboardWorkspace(){
 const ar=useLocale()==="ar",locale=ar?"ar":"en",t=(en:string,a:string)=>ar?a:en;
 const {isReady,isAuthenticated}=useAuthSession();
 const [cycleId,setCycleId]=useState<number|undefined>(),[status,setStatus]=useState<string>(),[search,setSearch]=useState("");
 const cq=useQuery({queryKey:["manager-dashboard-cycles"],queryFn:cyclesApi.mine,enabled:isAuthenticated});
 const cycles=rowsOf(cq.data).filter((c:any)=>c.my_roles?.manager);
 const qs=useQueries({queries:cycles.map((c:any)=>({queryKey:["manager-plan-status",c.id],queryFn:()=>cyclesApi.planStatus(c.id,{per_page:100}),enabled:isAuthenticated}))});
 const evalQs=useQueries({queries:cycles.filter((c:any)=>c.current_stage==="manager_evaluation").map((c:any)=>({queryKey:["manager-team-evaluations",c.id],queryFn:()=>cyclesApi.teamEvaluations(c.id),enabled:isAuthenticated}))});
 const groupQs=useQueries({queries:cycles.filter((c:any)=>c.current_stage==="manager_evaluation"||c.current_stage==="admin_final_review").map((c:any)=>({queryKey:["manager-team-group",c.id],queryFn:()=>cyclesApi.group(c.id),enabled:isAuthenticated}))});
 const team=useMemo(()=>cycles.flatMap((c:any,i:number)=>rowsOf(qs[i]?.data).map((r:any)=>({...r,cycleId:c.id,cycleName:nameOf(c.name,ar),stage:c.current_stage,deadline:c.stages?.find((s:any)=>s.stage===c.current_stage)?.deadline_date}))),[cycles,qs,ar]);
 const scoped=team.filter((r:any)=>!cycleId||r.cycleId===cycleId);
 const filtered=scoped.filter((r:any)=>(!status||r.status?.key===status)&&[r.employee?.name,r.employee?.code].some((x:any)=>(x||"").toLowerCase().includes(search.toLowerCase())));
 const unique=new Set(scoped.map((r:any)=>r.employee?.id).filter(Boolean)).size;
 const evalRows=evalQs.flatMap(q=>rowsOf(q.data));
 const groups=groupQs.map(q=>q.data).filter(Boolean);
 const evaluationInProgress=evalRows.filter((r:any)=>r.status==="not_started"||r.status==="draft").length;
 const pendingFinal=groups.filter((g:any)=>g.status==="pending_admin").reduce((n:number,g:any)=>n+(g.n||0),0);
 const finalized=groups.filter((g:any)=>g.status==="approved").reduce((n:number,g:any)=>n+(g.n||0),0);
 const busy=!isReady||cq.isLoading||qs.some(q=>q.isLoading)||evalQs.some(q=>q.isLoading)||groupQs.some(q=>q.isLoading),error=cq.error||qs.find(q=>q.error)?.error||evalQs.find(q=>q.error)?.error||groupQs.find(q=>q.error)?.error;
 const statusKeys=["draft","pending_admin","pending_employee","returned","approved"];
 const columns:any[]=[
 {title:t("Employee","الموظف"),render:(_:any,r:any)=><div><Typography.Text strong>{r.employee?.name||"—"}</Typography.Text><br/><Typography.Text type="secondary">{r.employee?.code||"—"}</Typography.Text></div>},
 {title:t("Performance cycle","دورة الأداء"),dataIndex:"cycleName"},
 {title:t("Performance status","حالة الأداء"),render:(_:any,r:any)=><Tag>{r.status?.label||labels[r.status?.key]?.[ar?1:0]||"—"}</Tag>},
 {title:t("Action","الإجراء"),render:(_:any,r:any)=><Link href={"/"+locale+"/manager/objectives?"+(r.plan_id?"plan="+r.plan_id:"cycle_member="+r.cycle_member_id)}>{r.plan_id?t("View plan","عرض الخطة"):t("Create plan","إنشاء خطة")}</Link>}
 ];
 return <AppShell title={t("Team overview","نظرة عامة على الفريق")} subtitle={t("Monitor direct reports across your active performance cycles.","تابع الموظفين التابعين لك عبر دورات الأداء النشطة.")}>
 {busy?<Spin/>:error?<Alert type="error" showIcon title={(error as Error).message}/>:<>
 <Row gutter={[12,12]} style={{marginBottom:16}}><Col xs={24} sm={12} lg={6}><Card><Statistic title={t("Total direct reports","إجمالي الموظفين المباشرين")} value={unique}/></Card></Col>{statusKeys.map(k=><Col xs={12} sm={6} lg={3} key={k}><Card><Statistic title={labels[k][ar?1:0]} value={scoped.filter((r:any)=>r.status?.key===k).length}/></Card></Col>)}
 <Col xs={12} sm={6} lg={3}><Card><Statistic title={t("Evaluation in progress","التقييم قيد التنفيذ")} value={evaluationInProgress}/></Card></Col>
 <Col xs={12} sm={6} lg={3}><Card><Statistic title={t("Pending final approval","بانتظار الاعتماد النهائي")} value={pendingFinal}/></Card></Col>
 <Col xs={12} sm={6} lg={3}><Card><Statistic title={t("Finalized","تم الإنهاء")} value={finalized}/></Card></Col></Row>
 <Card title={t("Active performance cycles","دورات الأداء النشطة")} style={{marginBottom:16}}>{cycles.length?<Row gutter={[12,12]}>{cycles.map((c:any)=><Col xs={24} md={12} xl={8} key={c.id}><Card size="small" hoverable onClick={()=>setCycleId(c.id===cycleId?undefined:c.id)} style={{borderColor:c.id===cycleId?"#1677ff":undefined}}><Typography.Text strong>{nameOf(c.name,ar)}</Typography.Text><div><Tag color="blue">{c.current_stage||"—"}</Tag></div><Typography.Text type="secondary">{t("Deadline","الموعد النهائي")}: {c.stages?.find((s:any)=>s.stage===c.current_stage)?.deadline_date||"—"}</Typography.Text><div>{t("Employees","الموظفون")}: {team.filter((r:any)=>r.cycleId===c.id).length}</div></Card></Col>)}</Row>:<Empty description={t("No active cycles","لا توجد دورات نشطة")}/>}</Card>
 <Card title={t("My team","فريقي")} extra={<Button type="link" onClick={()=>{setCycleId(undefined);setStatus(undefined);setSearch("");}}>{t("Clear filters","مسح الفلاتر")}</Button>}>
 <Row gutter={[8,8]} style={{marginBottom:16}}><Col xs={24} md={8}><Select allowClear value={cycleId} onChange={setCycleId} style={{width:"100%"}} placeholder={t("All cycles","كل الدورات")} options={cycles.map((c:any)=>({value:c.id,label:nameOf(c.name,ar)}))}/></Col><Col xs={24} md={7}><Select allowClear value={status} onChange={setStatus} style={{width:"100%"}} placeholder={t("All statuses","كل الحالات")} options={Object.keys(labels).map(k=>({value:k,label:labels[k][ar?1:0]}))}/></Col><Col xs={24} md={9}><Input allowClear value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search employee name or ID","ابحث باسم الموظف أو رقمه")}/></Col></Row>
 <Table rowKey={(r:any)=>String(r.cycle_member_id)} columns={columns} dataSource={filtered} scroll={{x:700}} pagination={{pageSize:10}} locale={{emptyText:t("No team records found","لا توجد سجلات")}}/>
 </Card></>}
 </AppShell>;
}