"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import {
  BookOpen, BriefcaseBusiness, CheckCircle2, ClipboardList, Info,
  LockKeyhole, Target, Users, CalendarDays, ArrowUpRight
} from "lucide-react";

const competencies = [
  { id: "COMP-01", name: "Communication", ar: "التواصل", group: "Core", groupAr: "أساسية", description: "Shares information clearly and adapts communication to the audience.", descriptionAr: "ينقل المعلومات بوضوح ويكيّف أسلوب التواصل حسب الجمهور." },
  { id: "COMP-02", name: "Collaboration", ar: "التعاون", group: "Core", groupAr: "أساسية", description: "Works effectively with colleagues and contributes to shared outcomes.", descriptionAr: "يعمل بفاعلية مع الزملاء ويساهم في تحقيق النتائج المشتركة." },
  { id: "COMP-03", name: "Problem solving", ar: "حل المشكلات", group: "Role-based", groupAr: "مرتبطة بالوظيفة", description: "Analyzes challenges and applies structured approaches to resolve them.", descriptionAr: "يحلل التحديات ويستخدم أساليب منظمة لمعالجتها." },
  { id: "COMP-04", name: "Accountability", ar: "تحمل المسؤولية", group: "Core", groupAr: "أساسية", description: "Takes ownership of commitments, decisions and outcomes.", descriptionAr: "يتحمل مسؤولية الالتزامات والقرارات والنتائج." },
  { id: "COMP-05", name: "Adaptability", ar: "المرونة والتكيف", group: "Role-based", groupAr: "مرتبطة بالوظيفة", description: "Responds constructively to changing priorities and situations.", descriptionAr: "يتعامل بإيجابية مع تغير الأولويات والظروف." }
];

export default function EmployeeDevelopmentPage() {
  const ar = useLocale() === "ar";
  const t = (en: string, a: string) => ar ? a : en;
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e8edf4", borderRadius: 13, padding: 20 };
  const muted: React.CSSProperties = { color: "#8796a8", fontSize: 12, lineHeight: 1.7 };
  return (
    <AppShell title={t("Development & competencies", "التطوير والكفاءات")} subtitle={t("Review the competencies assigned to your job title and understand the annual evaluation process.", "راجع الكفاءات المرتبطة بمسمّاك الوظيفي وتعرّف على آلية التقييم السنوي.")}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"13px 15px",border:"1px solid #dfe9f3",borderRadius:10,background:"#f7fafd",color:"#71859b",fontSize:12,lineHeight:1.7,marginBottom:16}}>
        <Info size={17} style={{flexShrink:0,marginTop:2,color:"#6285ad"}}/>
        <span>{t("The BRD defines assigned competencies and an annual manager-led competency evaluation. It does not define a separate employee learning-plan or training-booking workflow. The competency examples below are illustrative demo content.", "يحدد مستند المتطلبات الكفاءات المرتبطة بالموظف والتقييم السنوي الذي ينفذه المدير. لكنه لا يحدد سير عمل مستقل لخطة تعلم الموظف أو حجز الدورات التدريبية. أمثلة الكفاءات بالأسفل بيانات تجريبية توضيحية.")}</span>
      </div>

      <section style={{...card,background:"linear-gradient(110deg,#1b355e,#275a78 65%,#267a70)",color:"#fff",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <div>
          <span style={{display:"inline-flex",alignItems:"center",gap:7,color:"#91e0c6",fontSize:10,fontWeight:800,letterSpacing:".8px"}}><BriefcaseBusiness size={14}/>{t("EMPLOYEE COMPETENCY PROFILE","ملف كفاءات الموظف")}</span>
          <h2 style={{margin:"10px 0 5px",fontSize:21,color:"#fff"}}>{t("Your assigned competencies","الكفاءات المخصصة لك")}</h2>
          <p style={{margin:0,color:"#c5d6e4",fontSize:12}}>{t("2026 Annual Performance Cycle · Based on your job title", "دورة الأداء السنوية 2026 · وفقاً للمسمى الوظيفي")}</p>
        </div>
        <span style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 11px",border:"1px solid #ffffff35",borderRadius:20,color:"#e0edf2",fontSize:11}}><LockKeyhole size={13}/>{t("Read only","للعرض فقط")}</span>
      </section>

      <section style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12,marginBottom:16}}>
        {[
          {icon:<ClipboardList size={18}/>,value:"5",label:t("Assigned competencies","الكفاءات المخصصة")},
          {icon:<CalendarDays size={18}/>,value:t("Annual","سنوي"),label:t("Evaluation frequency","دورية التقييم")},
          {icon:<Users size={18}/>,value:t("Manager","المدير"),label:t("Evaluation owner","مسؤول التقييم")}
        ].map((item,i)=><div key={i} style={{...card,display:"flex",alignItems:"center",gap:12,padding:16}}>
          <span style={{display:"grid",placeItems:"center",width:38,height:38,borderRadius:10,background:"#edf4fb",color:"#527ca8",flexShrink:0}}>{item.icon}</span>
          <div><strong style={{display:"block",fontSize:20,color:"#2c4564"}}>{item.value}</strong><span style={{fontSize:11,color:"#8292a6"}}>{item.label}</span></div>
        </div>)}
      </section>

      <section style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
          <div><h3 style={{margin:0,color:"#293d58",fontSize:15}}>{t("Competency framework","إطار الكفاءات")}</h3><p style={{...muted,margin:"5px 0 0"}}>{t("Your template is assigned automatically according to your job title.", "يتم إسناد قالب الكفاءات تلقائياً وفقاً لمسمّاك الوظيفي.")}</p></div>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 8px",borderRadius:20,background:"#edf7f3",color:"#278a71",fontSize:10,whiteSpace:"nowrap"}}><CheckCircle2 size={12}/>{t("Template assigned · demo","القالب مُسند · تجريبي")}</span>
        </div>
        <div style={{display:"grid"}}>
          {competencies.map((item)=> <article key={item.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"15px 2px",borderTop:"1px solid #eff2f6"}}>
            <span style={{display:"grid",placeItems:"center",width:35,height:35,flexShrink:0,borderRadius:9,background:"#f0f4fa",color:"#5d7fa5"}}><Target size={17}/></span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <strong style={{color:"#405873",fontSize:13}}>{ar?item.ar:item.name}</strong>
                <span style={{padding:"3px 7px",borderRadius:20,background:"#f2f5f8",color:"#8291a3",fontSize:9}}>{ar?item.groupAr:item.group}</span>
              </div>
              <p style={{...muted,margin:"5px 0 0"}}>{ar?item.descriptionAr:item.description}</p>
              <small style={{color:"#a0aaba",fontSize:9}}>{item.id}</small>
            </div>
            <LockKeyhole size={14} style={{color:"#a5b0bd",marginTop:4,flexShrink:0}}/>
          </article>)}
        </div>
      </section>

      <section style={{...card,marginTop:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}>
          <span style={{display:"grid",placeItems:"center",width:35,height:35,borderRadius:9,background:"#fff3e3",color:"#b98949"}}><BookOpen size={17}/></span>
          <div><h3 style={{margin:0,color:"#293d58",fontSize:14}}>{t("Annual competency evaluation","التقييم السنوي للكفاءات")}</h3><p style={{...muted,margin:"4px 0 0"}}>{t("Completed by your manager during the final performance period.", "ينفذه مديرك خلال فترة الأداء الأخيرة.")}</p></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:9}}>
          {[
            [t("Quarterly cycle","دورة ربع سنوية"),"Q4"],
            [t("Semi-annual cycle","دورة نصف سنوية"),"H2"],
            [t("Annual cycle","دورة سنوية"),t("Annual","سنوي")]
          ].map(([label,value])=><div key={label} style={{padding:12,border:"1px solid #edf0f4",borderRadius:9}}>
            <span style={{display:"block",fontSize:10,color:"#8796a8",marginBottom:6}}>{label}</span><strong style={{fontSize:15,color:"#47627e"}}>{value}</strong>
          </div>)}
        </div>
        <p style={{...muted,margin:"13px 0 0"}}>{t("Competencies remain visible throughout the year and are evaluated once annually. The employee can view assigned competencies; evaluation ratings and final results are shown only when permitted by the performance-results publication rules.", "تظل الكفاءات ظاهرة طوال العام ويتم تقييمها مرة واحدة سنوياً. يمكن للموظف الاطلاع على الكفاءات المخصصة له، أما درجات التقييم والنتائج النهائية فتظهر وفق قواعد إتاحة ونشر نتائج الأداء.")}</p>
      </section>
      <div style={{display:"flex",alignItems:"center",gap:7,marginTop:13,color:"#98a5b4",fontSize:10}}><ArrowUpRight size={14}/>{t("Illustrative data only · Competency names and template weights will be supplied by the HR competency template integration.", "بيانات توضيحية فقط · سيتم توفير أسماء الكفاءات وأوزان القالب من خلال تكامل قوالب الكفاءات لدى الموارد البشرية.")}</div>
    </AppShell>
  );
}
