"use client";

import { DataTable } from "@/components/ui/data-table";
import { Alert, Card, Empty, Spin, Tag, Typography } from "antd";
import { useQuery } from "@tanstack/react-query";
import { resultsApi } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";

type PublishedKpi = { name: string; target: string | number; weight_bp: number };
type PublishedObjective = { id: number | string; text: string; kpis: PublishedKpi[] };
type PublishedResult = { id: number; cycle?: { performance_year?: number; name?: string | { ar?: string; en?: string } }; overall_bp: number; rating_label?: { ar?: string; en?: string }; rating_level?: string; published: boolean; published_at?: string | null; objectives: PublishedObjective[] };
export default function ApiEmployeeResultsWorkspace(){
 const ar=useLocale()==="ar"; const q=useQuery({queryKey:["results","me"],queryFn:()=>resultsApi.mine()}); const t=(en:string,a:string)=>ar?a:en;
 if(q.isLoading)return <Spin/>; if(q.isError)return <Alert type="error" showIcon title={(q.error as Error).message}/>;
 const rows=(q.data||[]) as PublishedResult[]; if(!rows.length)return <Empty description={t("No published results are available yet.","لا توجد نتائج منشورة متاحة حتى الآن.")}/>;
 return <Card title={t("My published performance results","نتائج أدائي المنشورة")}>
  <DataTable rowKey="id" dataSource={rows} pagination={{pageSize:10}} expandable={{expandedRowRender:(r:PublishedResult)=><div>{(r.objectives||[]).map((o:PublishedObjective,i:number)=><Card size="small" key={i} title={o.text}>{(o.kpis||[]).map((k:PublishedKpi,j:number)=><Typography.Paragraph key={j}>{k.name} · {t("Target","المستهدف")}: {k.target} · {(k.weight_bp/100).toFixed(2)}%</Typography.Paragraph>)}</Card>)}</div>}} columns={[
   {title:t("Performance year","سنة الأداء"),render:(_:unknown,r:PublishedResult)=>r.cycle?.performance_year},{title:t("Cycle","الدورة"),render:(_:any,r:any)=>typeof r.cycle?.name==="object"?(ar?r.cycle.name.ar:r.cycle.name.en):r.cycle?.name},
   {title:t("Overall result","النتيجة الإجمالية"),render:(_:any,r:any)=><Typography.Text strong>{(r.overall_bp/100).toFixed(2)}%</Typography.Text>},
   {title:t("Rating","التقدير"),render:(_:any,r:any)=><Tag color="blue">{r.rating_label?.[ar?"ar":"en"]||r.rating_level}</Tag>},
   {title:t("Publication","النشر"),render:(_:any,r:any)=><Tag color={r.published?"green":"gold"}>{r.published?t("Published","منشورة"):t("Pending","قيد الانتظار")}</Tag>},
   {title:t("Published at","تاريخ النشر"),dataIndex:"published_at",render:(v:string|null|undefined)=>v||"—"}
  ]}/>
 </Card>;
}