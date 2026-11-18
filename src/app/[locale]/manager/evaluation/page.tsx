"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Calculator, CheckCircle2, LockKeyhole, Save, Send, ShieldAlert, Users } from "lucide-react";

type Direction = "higher" | "lower";
type KPI = { id: string; name: string; target: number; actual: number; direction: Direction; weight: number; unit: string; comment: string; evidence: string };
const initialKpis: KPI[] = [
  { id: "KPI-01", name: "Sprint delivery", target: 90, actual: 88, direction: "higher", weight: 40, unit: "%", comment: "", evidence: "" },
  { id: "KPI-02", name: "Production defects", target: 8, actual: 6, direction: "lower", weight: 35, unit: " defects", comment: "", evidence: "" },
  { id: "KPI-03", name: "Documentation completion", target: 95, actual: 92, direction: "higher", weight: 25, unit: "%", comment: "" }
];
const competencyNames = ["Communication", "Problem solving", "Collaboration", "Ownership"];
const ratingMap: Record<number, number> = { 1: 50, 2: 70, 3: 85, 4: 93, 5: 100 };
const periodNames = ["Q1", "Q2", "Q3", "Q4"];

function achievement(kpi: KPI): number | null {
  if (kpi.target <= 0) return null;
  if (kpi.direction === "lower" && kpi.actual === 0) return 100;
  return Math.min(100, kpi.direction === "higher" ? (kpi.actual / kpi.target) * 100 : (kpi.target / kpi.actual) * 100);
}

export default function ManagerEvaluationPage() {
  const ar = useLocale() === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [period, setPeriod] = useState("Q4");
  const [kpis, setKpis] = useState(initialKpis);
  const [ratings, setRatings] = useState<Record<string, number>>({ Communication: 3, "Problem solving": 4, Collaboration: 4, Ownership: 3 });
  const [saved, setSaved] = useState(false);\n  const [workflowNotice, setWorkflowNotice] = useState("");

  const results = useMemo(() => kpis.map((kpi) => {
    const score = achievement(kpi);
    return { ...kpi, score, weighted: score === null ? null : score * kpi.weight / 100 };
  }), [kpis]);
  const periodResult = results.some((item) => item.weighted === null) ? null : results.reduce((sum, item) => sum + (item.weighted ?? 0), 0);
  const competencyResult = useMemo(() => competencyNames.reduce((sum, name) => sum + ratingMap[ratings[name] || 1] * 0.25, 0), [ratings]);
  const fmt = (value: number | null) => value === null ? "—" : value.toFixed(1) + "%";

  function updateKpi(id: string, patch: Partial<KPI>) {
    setSaved(false);
    setKpis((current) => current.map((kpi) => kpi.id === id ? { ...kpi, ...patch } : kpi));
  }

  return (
    <AppShell role="manager" title={t("Manager evaluation", "تقييم المدير")} subtitle={t("Record KPI actuals, review annual competencies and prepare the Manager–Year Group.", "سجّل القيم الفعلية لمؤشرات الأداء وراجع الكفاءات السنوية وجهّز مجموعة المدير والسنة.")}>
      <div className="evaluation-topline">
        <div>
          <span className="readonly-pill">2026 · {t("Performance cycle", "دورة الأداء")}</span>
          <span className="readonly-pill">{t("Illustrative data", "بيانات توضيحية")}</span>
        </div>
        <div className="evaluation-topline-links"><Link href={`/${ar ? "ar" : "en"}/manager/year-group`}>{t("Open Manager–Year Group", "فتح مجموعة المدير والسنة")}</Link><Link href={`/${ar ? "ar" : "en"}/manager/team`}>{t("Back to team", "العودة للفريق")}</Link></div>
      </div>

      <section className="panel evaluation-context">
        <div>
          <h3>{t("Evaluation context", "بيانات التقييم")}</h3>
          <p>{t("Select the employee and period you are evaluating. Approved objectives, KPI definitions, targets and weights are locked.", "حدد الموظف والفترة محل التقييم. الأهداف وتعريفات المؤشرات والمستهدفات والأوزان المعتمدة غير قابلة للتعديل.")}</p>
        </div>
        <div className="evaluation-context-fields">
          <label>{t("Employee", "الموظف")}
            <select defaultValue="EMP-10574">
              <option value="EMP-10574">Omar Khaled · EMP-10574</option>
              <option value="EMP-10561">Sara Ahmed · EMP-10561</option>
              <option value="EMP-10589">Mona Ali · EMP-10589</option>
            </select>
          </label>
          <label>{t("Performance period", "فترة الأداء")}
            <select value={period} onChange={(event) => { setPeriod(event.target.value); setSaved(false); }}>
              {periodNames.map((name) => <option key={name} value={name}>{name} · 2026</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="evaluation-section-heading">
        <div>
          <h2>{t("Period KPI evaluation", "تقييم مؤشرات الفترة")}</h2>
          <p>{t("Enter actual performance. Achievement and weighted results are calculated automatically.", "أدخل الأداء الفعلي وسيتم حساب نسبة الإنجاز والنتيجة الموزونة تلقائياً.")}</p>
        </div>
        <span className="readonly-pill"><LockKeyhole size={12} />{t("Targets & weights locked", "المستهدفات والأوزان مقفلة")}</span>
      </div>

      <section className="panel evaluation-kpi-panel">
        <div className="evaluation-kpi-table">
          <div className="evaluation-kpi-head">
            <span>{t("KPI / direction", "المؤشر / الاتجاه")}</span>
            <span>{t("Target", "المستهدف")}</span>
            <span>{t("Actual", "الفعلي")}</span>
            <span>{t("Weight", "الوزن")}</span>
            <span>{t("Achievement", "الإنجاز")}</span>
            <span>{t("Weighted result", "النتيجة الموزونة")}</span>
          </div>
          {results.map((kpi) => (
            <article className="evaluation-kpi-row" key={kpi.id}>
              <div className="evaluation-kpi-name">
                <strong>{kpi.name}</strong>
                <small>{kpi.id} · {t(kpi.direction === "higher" ? "Higher is better" : "Lower is better", kpi.direction === "higher" ? "الأعلى أفضل" : "الأقل أفضل")}</small>
              </div>
              <span className="evaluation-readonly">{kpi.target}{kpi.unit}</span>
              <label className="evaluation-actual">
                <input aria-label={t("Actual value", "القيمة الفعلية")} type="number" min="0" step="any" value={kpi.actual} onChange={(event) => updateKpi(kpi.id, { actual: Math.max(0, Number(event.target.value)) })} />
                <small>{kpi.unit.trim() || "value"}</small>
              </label>
              <span className="evaluation-readonly">{kpi.weight}%</span>
              <strong className="evaluation-calculated">{fmt(kpi.score)}</strong>
              <strong className="evaluation-calculated">{fmt(kpi.weighted)}</strong>
              <label className="evaluation-comment">
                {t("Manager comment (optional)", "تعليق المدير (اختياري)")}
                <textarea value={kpi.comment} onChange={(event) => updateKpi(kpi.id, { comment: event.target.value })} placeholder={t("Add context or evidence reference…", "أضف توضيحاً أو مرجعاً للدليل…")} />
              </label>
            </article>
          ))}
        </div>
        <div className="evaluation-result-strip">
          <div><Calculator size={18} /><span>{t("Current period result", "نتيجة الفترة الحالية")}</span></div>
          <strong>{fmt(periodResult)}</strong>
        </div>
      </section>

      <div className="evaluation-annual-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{t("Annual competency evaluation", "تقييم الكفاءات السنوي")}</h3>
              <p>{t("Competencies are evaluated annually, not per performance period.", "يتم تقييم الكفاءات سنوياً وليس لكل فترة أداء.")}</p>
            </div>
            <span className="readonly-pill">100% {t("weight total", "إجمالي الأوزان")}</span>
          </div>
          <div className="competency-rating-list">
            {competencyNames.map((name) => (
              <label key={name}>
                <span><strong>{name}</strong><small>{t("Weight 25%", "الوزن 25%")}</small></span>
                <select value={ratings[name]} onChange={(event) => setRatings((current) => ({ ...current, [name]: Number(event.target.value) }))}>
                  {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} · {ratingMap[rating]}%</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="evaluation-result-strip">
            <span>{t("Annual competency result", "نتيجة الكفاءات السنوية")}</span>
            <strong>{fmt(competencyResult)}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{t("Annual objectives & overall result", "الأهداف السنوية والنتيجة الإجمالية")}</h3>
              <p>{t("Period results are averaged equally for the cycle frequency.", "يتم حساب متوسط نتائج الفترات بالتساوي حسب تكرار الدورة.")}</p>
            </div>
          </div>
          <div className="annual-period-list">
            {periodNames.map((name, index) => (
              <div key={name}>
                <span>{name}</span>
                <strong>{index === 3 && period === "Q4" ? fmt(periodResult) : ["82.0%", "86.0%", "88.0%", "—"][index]}</strong>
                <small>{index === 3 ? t("Current input", "المدخل الحالي") : t("Illustrative approved result", "نتيجة معتمدة توضيحية")}</small>
              </div>
            ))}
          </div>
          <div className="evaluation-note-inline">
            <AlertTriangle size={15} />
            {t("Annual objectives result and overall annual score remain provisional until all applicable periods and the Manager–Year Group are approved.", "تظل نتيجة الأهداف والنتيجة السنوية الإجمالية مبدئية حتى اكتمال الفترات المعنية واعتماد مجموعة المدير والسنة.")}
          </div>
        </section>
      </div>

      <section className="panel bellcurve-panel">
        <div className="panel-heading">
          <div>
            <h3>{t("Manager–Year Group readiness", "جاهزية مجموعة المدير والسنة")}</h3>
            <p>{t("Group-level submission and Bell Curve compliance overview.", "ملخص إرسال المجموعة والتحقق من توافق Bell Curve على مستوى المجموعة.")}</p>
          </div>
          <span className="readonly-pill"><Users size={13} />{t("Group view", "عرض المجموعة")}</span>
        </div>
        <div className="bellcurve-status">
          <ShieldAlert size={20} />
          <div>
            <strong>{t("Bell Curve policy not configured in this demo", "سياسة Bell Curve غير مهيأة في هذه النسخة التجريبية")}</strong>
            <p>{t("The BRD requires minimum and maximum rating counts for the Manager-Year Group, but the approved distribution thresholds are not available here. Compliance cannot be confirmed and no automatic rating adjustment is performed.", "يتطلب BRD حدوداً دنيا وعليا لأعداد التقييمات داخل مجموعة المدير والسنة، لكن نسب التوزيع المعتمدة غير متاحة هنا. لا يمكن تأكيد التوافق ولا يتم إجراء أي تعديل تلقائي للتقييمات.")}</p>
          </div>
        </div>
        <div className="bellcurve-checks">
          <span><CheckCircle2 size={15} />{t("KPI calculations previewed", "تمت معاينة حسابات المؤشرات")}</span>
          <span><AlertTriangle size={15} />{t("Group distribution awaiting policy", "توزيع المجموعة بانتظار السياسة")}</span>
          <span><AlertTriangle size={15} />{t("Admin group approval pending", "اعتماد المجموعة من Admin معلق")}</span>
        </div>
      </section>

      <div className="evaluation-actions">
        <div>
          {saved ? (
            <span className="evaluation-saved"><CheckCircle2 size={15} />{t("Demo draft saved locally", "تم حفظ المسودة التجريبية محلياً")}</span>
          ) : (
            <span className="evaluation-demo-warning"><AlertTriangle size={15} />{t("Demo only · no backend persistence or submission", "نسخة تجريبية فقط · لا يوجد حفظ أو إرسال إلى Backend")}</span>
          )}
        </div>
        <div className="evaluation-action-buttons"><button type="button" onClick={() => { setSaved(true); setWorkflowNotice(t("Demo draft saved locally. You can continue later while the evaluation stage is open.", "تم حفظ المسودة التجريبية محلياً ويمكنك المتابعة لاحقاً أثناء فتح مرحلة التقييم.")); }}><Save size={16} />{t("Save demo draft", "حفظ مسودة تجريبية")}</button>{period === "Q4" ? <button type="button" onClick={() => { const missing = results.some(x => x.actual < 0 || !Number.isFinite(x.actual)) || results.some(x => !x.name.trim()); setWorkflowNotice(missing ? t("Complete all KPI Actual values before saving the annual draft.", "أكمل القيم الفعلية لجميع المؤشرات قبل حفظ المسودة السنوية.") : t("Final-period evaluation is saved as an annual draft. It is not submitted individually; the complete Manager–Year Group is submitted after all eligible employees are complete.", "يتم حفظ تقييم الفترة النهائية كمسودة سنوية ولا يتم إرساله بشكل فردي؛ تُرسل مجموعة المدير والسنة بالكامل بعد اكتمال جميع الموظفين المؤهلين.")); setSaved(!missing); }}><Save size={16}/>{t("Save annual evaluation draft","حفظ مسودة التقييم السنوي")}</button> : <button type="button" onClick={() => { const valid = results.every(x => x.actual >= 0 && Number.isFinite(x.actual)) && Math.abs(results.reduce((s,x)=>s+x.weight,0)-100)<0.0001; setWorkflowNotice(valid ? t("Demo Non-Final Period evaluation is ready for individual Admin review.", "تقييم الفترة غير النهائية التجريبي جاهز للمراجعة الفردية من الإدارة.") : t("Submission blocked: enter valid Actual values and ensure KPI weights total 100%.", "تم منع الإرسال: أدخل قيماً فعلية صحيحة وتأكد أن إجمالي أوزان المؤشرات 100%.") ); setSaved(valid); }}><Send size={16}/>{t("Submit period to Admin","إرسال الفترة للإدارة")}</button>}</div>
      </div>
    </AppShell>
  );
}
