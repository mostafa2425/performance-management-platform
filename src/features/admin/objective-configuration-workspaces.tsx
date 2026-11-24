"use client";

import { AppButton, AppInput, AppTable } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";

type Category={id:string;name:string;active:boolean;createdAt:string;updatedAt:string;historicalRefs:number};
const seed:Category[]=[
 {id:"CAT-001",name:"Strategic Growth",active:true,createdAt:"2026-01-12",updatedAt:"2026-01-12",historicalRefs:18},
 {id:"CAT-002",name:"Operational Excellence",active:true,createdAt:"2026-01-12",updatedAt:"2026-03-08",historicalRefs:24},
 {id:"CAT-003",name:"Customer Experience",active:true,createdAt:"2026-02-01",updatedAt:"2026-02-01",historicalRefs:12},
 {id:"CAT-004",name:"People Development",active:true,createdAt:"2026-02-01",updatedAt:"2026-02-01",historicalRefs:9},
 {id:"CAT-005",name:"Digital Transformation",active:true,createdAt:"2026-03-15",updatedAt:"2026-03-15",historicalRefs:6},
 {id:"CAT-006",name:"Cost Optimization",active:false,createdAt:"2025-11-02",updatedAt:"2026-04-20",historicalRefs:31}
];
export function ObjectiveCategoryWorkspace(){
 const t=useTranslations("ObjectiveConfiguration");
 const [rows,setRows]=useState(seed),[query,setQuery]=useState(""),[editor,setEditor]=useState<{id:string|null;name:string}|null>(null),[confirm,setConfirm]=useState<string|null>(null),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const filtered=useMemo(()=>rows.filter(x=>x.name.toLowerCase().includes(query.toLowerCase())),[rows,query]);
 const save=()=>{if(!editor)return;const name=editor.name.trim();if(!name){setError(t("text001"));return;}if(rows.some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&x.id!==editor.id)){setError(t("text002"));return;}const now=new Date().toISOString().slice(0,10);if(editor.id){setRows(v=>v.map(x=>x.id===editor.id?{...x,name,updatedAt:now}:x));setNotice(t("text003"));}else{setRows(v=>[{id:"CAT-"+String(Date.now()).slice(-6),name,active:true,createdAt:now,updatedAt:now,historicalRefs:0},...v]);setNotice(t("text004"));}setEditor(null);setError("");};
 const remove=()=>{if(!confirm)return;setRows(v=>v.map(x=>x.id===confirm?{...x,active:false,updatedAt:new Date().toISOString().slice(0,10)}:x));setNotice(t("text005"));setConfirm(null);};
 return <AppShell role="admin" title={t("text006")} subtitle={t("text007")}>
  <div className="cfg-topline"><span>UC-025 · {t("text008")}</span><span>{t("text009")}</span></div>
  {notice&&<div className="cfg-notice"><Check size={15}/>{notice}<AppButton onClick={()=>setNotice("")}><X size={14}/></AppButton></div>}
  <div className="cfg-metrics"><article><span>{t("text010")}</span><b>{rows.length}</b></article><article><span>{t("text011")}</span><b>{rows.filter(x=>x.active).length}</b></article><article><span>{t("text012")}</span><b>{rows.reduce((s,x)=>s+x.historicalRefs,0)}</b></article></div>
  <section className="panel cfg-panel"><div className="cfg-toolbar"><div className="cfg-search"><Search size={15}/><AppInput value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("text013")}/></div><AppButton className="cfg-primary" onClick={()=>{setEditor({id:null,name:""});setError("");}}><Plus size={15}/>{t("text014")}</AppButton></div>
   <div className="cfg-table-wrap"><AppTable className="cfg-table"><thead><tr><th>{t("text015")}</th><th>{t("text016")}</th><th>{t("text017")}</th><th>{t("text018")}</th><th>{t("text019")}</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.name}</b><small>{x.id}</small></td><td><span className={x.active?"cfg-active":"cfg-inactive"}>{x.active?t("text020"):t("text021")}</span></td><td>{x.historicalRefs}</td><td>{x.updatedAt}</td><td><div className="cfg-actions"><AppButton onClick={()=>{setEditor({id:x.id,name:x.name});setError("");}}><Pencil size={13}/>{t("text022")}</AppButton><AppButton disabled={!x.active} onClick={()=>setConfirm(x.id)}><Trash2 size={13}/>{t("text023")}</AppButton></div></td></tr>)}{!filtered.length&&<tr><td colSpan={5} className="cfg-empty">{t("text024")}</td></tr>}</tbody></AppTable></div>
  </section>
  <p className="cfg-footnote">{t("text025")}</p>
  {editor&&<div className="cfg-overlay"><section className="cfg-modal"><div className="cfg-modal-head"><div><h2>{editor.id?t("text026"):t("text014")}</h2><p>{t("text027")}</p></div><AppButton onClick={()=>setEditor(null)}><X size={17}/></AppButton></div><label>{t("text028")}<AppInput autoFocus value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")save();}}/></label>{error&&<p className="cfg-error">{error}</p>}<div className="cfg-modal-actions"><AppButton onClick={()=>setEditor(null)}>{t("text029")}</AppButton><AppButton className="cfg-primary" onClick={save}>{t("text030")}</AppButton></div></section></div>}
  {confirm&&<div className="cfg-overlay"><section className="cfg-modal"><h2>{t("text031")}</h2><p>{t("text032")}</p><div className="cfg-modal-actions"><AppButton onClick={()=>setConfirm(null)}>{t("text029")}</AppButton><AppButton className="cfg-danger" onClick={remove}>{t("text033")}</AppButton></div></section></div>}
 </AppShell>;
}
type Weights={objectives:number;competencies:number};
const initial:Weights={objectives:80,competencies:20};
export function AnnualPerformanceConfiguration(){
 const t=useTranslations("ObjectiveConfiguration");
 const [saved,setSaved]=useState<Weights>(initial),[draft,setDraft]=useState<Weights>(initial),[editing,setEditing]=useState(false),[audit,setAudit]=useState<{before:Weights;after:Weights;at:string}[]>([]),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const total=draft.objectives+draft.competencies;
 const save=()=>{if(!Number.isFinite(draft.objectives)||!Number.isFinite(draft.competencies)||draft.objectives<0||draft.objectives>100||draft.competencies<0||draft.competencies>100){setError(t("text034"));return;}if(total!==100){setError(t("text035"));return;}const changed=draft.objectives!==saved.objectives||draft.competencies!==saved.competencies;if(changed)setAudit(v=>[{before:saved,after:draft,at:new Date().toLocaleString()},...v]);setSaved(draft);setEditing(false);setError("");setNotice(changed?t("text036"):t("text037"));};
 return <AppShell role="admin" title={t("text038")} subtitle={t("text039")}>
  <div className="cfg-topline"><span>UC-026 · {t("text008")}</span><span>{t("text040")}</span></div>
  {notice&&<div className="cfg-notice"><Check size={15}/>{notice}<AppButton onClick={()=>setNotice("")}><X size={14}/></AppButton></div>}
  <div className="panel cfg-weight-panel"><div className="cfg-weight-head"><div className="cfg-icon"><SlidersHorizontal size={19}/></div><div><h2>{t("text041")}</h2><p>{t("text042")}</p></div><span className="cfg-version">{t("text043")}</span></div>
   <div className="cfg-weight-grid"><article><div className="cfg-weight-label"><span>{t("text044")}</span><strong>{saved.objectives}%</strong></div><div className="cfg-progress"><i style={{width:saved.objectives+"%"}}/></div>{editing?<label>{t("text045")}<AppInput type="number" min="0" max="100" step="1" value={draft.objectives} onChange={e=>setDraft({...draft,objectives:Number(e.target.value)})}/></label>:<small>{t("text046")}</small>}</article>
    <article><div className="cfg-weight-label"><span>{t("text047")}</span><strong>{saved.competencies}%</strong></div><div className="cfg-progress competency"><i style={{width:saved.competencies+"%"}}/></div>{editing?<label>{t("text048")}<AppInput type="number" min="0" max="100" step="1" value={draft.competencies} onChange={e=>setDraft({...draft,competencies:Number(e.target.value)})}/></label>:<small>{t("text049")}</small>}</article></div>
   <div className="cfg-total"><span>{t("text050")}</span><b className={total===100?"valid":"invalid"}>{editing?total:saved.objectives+saved.competencies}%</b><small>{(editing?total:saved.objectives+saved.competencies)===100?t("text051"):t("text052")}</small></div>
   {error&&<p className="cfg-error">{error}</p>}
   <div className="cfg-modal-actions">{editing?<><AppButton onClick={()=>{setDraft(saved);setEditing(false);setError("");}}>{t("text029")}</AppButton><AppButton className="cfg-primary" onClick={save}>{t("text053")}</AppButton></>:<AppButton className="cfg-primary" onClick={()=>{setDraft(saved);setEditing(true);setError("");}}><Pencil size={14}/>{t("text054")}</AppButton>}</div>
  </div>
  <section className="panel cfg-audit"><div className="cfg-audit-head"><div><h2>{t("text055")}</h2><p>{t("text056")}</p></div><span>{audit.length} {t("text057")}</span></div>{audit.length?audit.map((a,i)=><article key={i}><div><b>{t("text058")}</b><small>{a.at} · {t("text059")}</small></div><div><span>{t("text060")}: {a.before.objectives}% / {a.before.competencies}%</span><strong>{t("text061")}: {a.after.objectives}% / {a.after.competencies}%</strong></div></article>):<div className="cfg-empty">{t("text062")}</div>}</section>
  <p className="cfg-footnote">{t("text063")}</p>
 </AppShell>;
}
