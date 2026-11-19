"use client";

import { AppInput } from "@/components/ui-antd-primitives";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { CalendarDays, ChevronRight, CircleCheck, Clock3, Search, Users } from "lucide-react";
import { useState } from "react";

type SectionKey = "cycles" | "employees" | "approvals" | "reports";
const config = {
  cycles: { en:"Performance cycles", ar:"دورات الأداء", subEn:"Create, configure and monitor organization-wide performance cycles.", subAr:"إنشاء وإعداد ومتابعة دورات الأداء على مستوى المؤسسة.", rows:[["2026 Annual Performance Cycle","Annual · Jan 01 – Dec 31, 2026","Active"],["2025 Annual Performance Cycle","Annual · Jan 01 – Dec 31, 2025","Published"],["2026 Mid-Year Check-in","Semi-Annual · Jul 01 – Dec 31, 2026","Draft"]] },
  employees: { en:"Employees", ar:"الموظفون", subEn:"Review employee records and performance-cycle participation.", subAr:"مراجعة بيانات الموظفين ومشاركتهم في دورة الأداء.", rows:[["Mostafa Gamal","Technology · Frontend Developer","Active"],["Sara Ahmed","Human Resources · HR Specialist","Active"],["Omar Khaled","Finance & Operations · Analyst","Active"],["Mona Ali","Program Management · Project Manager","On leave"]] },
  approvals: { en:"Approvals", ar:"الاعتمادات", subEn:"Track pending reviews and decisions across the performance workflow.", subAr:"متابعة المراجعات والقرارات المعلقة خلال دورة الأداء.", rows:[["Objective plan · Mostafa Gamal","Manager submission · Program Management","Pending"],["Objective plan · Sara Ahmed","Admin review · Human Resources","Pending"],["Competency template · Product Designer","Configuration issue · Technology","Needs attention"]] },
  reports: { en:"Reports & analytics", ar:"التقارير والتحليلات", subEn:"Explore performance-cycle participation and organizational progress.", subAr:"استعراض المشاركة في دورة الأداء ومستوى التقدم المؤسسي.", rows:[["2026 Cycle Participation","470 employees · Organization-wide","Available"],["Objective Submission Summary","By department · 2026 cycle","Available"],["Competency Template Coverage","By job title · Current setup","Available"]] }
};
export function AdminSectionPage({section}:{section:SectionKey}) {
  const ar=useLocale()==="ar";
  const c=config[section];
  const [search,setSearch]=useState("");
  const rows=c.rows.filter(r=>r.join(" ").toLowerCase().includes(search.toLowerCase()));
  const title=ar?c.ar:c.en;
  return <AppShell role="admin" title={title} subtitle={ar?c.subAr:c.subEn}>
    <div className="admin-section-toolbar"><div className="search-field"><Search size={15}/><AppInput value={search} onChange={e=>setSearch(e.target.value)} placeholder={ar?"بحث...":"Search records..."}/></div><span className="readonly-pill">{ar?"بيانات تجريبية":"Mock data"}</span></div>
    <section className="panel admin-record-panel"><div className="panel-heading"><div><h3>{title}</h3><p>{ar?`عدد السجلات: ${rows.length}`:`${rows.length} records`}</p></div><span className="admin-cycle-tag">2026</span></div>
      <div className="admin-record-list">{rows.map((row,i)=><div className="admin-record" key={row[0]}><span className="admin-record-icon">{section==="employees"?<Users size={17}/>:section==="cycles"?<CalendarDays size={17}/>:section==="approvals"?<Clock3 size={17}/>:<CircleCheck size={17}/>}</span><div><strong>{row[0]}</strong><small>{row[1]}</small></div><span className={`admin-record-status ${row[2].toLowerCase().replace(/ /g,"-")}`}>{row[2]}</span><ChevronRight size={15}/></div>)}</div>
    </section>
    <div className="admin-demo-note"><Clock3 size={15}/><span>{ar?"هذه شاشة تجريبية. سيتم ربط البيانات والإجراءات الفعلية عند توفر Backend APIs.":"This is a prototype screen. Live records and actions will be connected when backend APIs are available."}</span></div>
  </AppShell>;
}