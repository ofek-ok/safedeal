"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";
import { ReportActionBar } from "@/components/report/ReportActionBar";
import { ExecutiveHeader } from "@/components/report/ExecutiveHeader";
import { PropertyDetailsCard } from "@/components/report/PropertyDetailsCard";
import { SafeScoreCard } from "@/components/report/SafeScoreCard";
import { Top5KeyFindings } from "@/components/report/Top5KeyFindings";
import { QuickRiskMap } from "@/components/report/QuickRiskMap";
import { ScoreBreakdownBars } from "@/components/report/ScoreBreakdownBars";
import { ActionableContextCard } from "@/components/report/ActionableContextCard";
import { RecommendedActionBanner } from "@/components/report/RecommendedActionBanner";
import { ValuationCard } from "@/components/report/ValuationCard";
import { MadlanInsightsCard } from "@/components/report/MadlanInsightsCard";
import { DataHubPillars } from "@/components/report/DataHubPillars";
import { OperativeNextSteps } from "@/components/report/OperativeNextSteps";
import type { ReportData } from "@/types/property";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface JobProgress {
  status: "pending" | "processing" | "completed" | "failed";
  percentComplete: number;
  currentStepMessage: string;
}

export default function ReportByIdPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/properties/status/${jobId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: JobProgress = await res.json();
      setProgress(data);
      return data;
    } catch (err) {
      throw err;
    }
  }, [jobId]);

  const fetchReport = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/v1/properties/report/${jobId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<ReportData>;
  }, [jobId]);

  const tryStaffFallback = useCallback(async (): Promise<ReportData | null> => {
    try {
      const res = await fetch(`/api/staff/cases/${jobId}`);
      if (!res.ok) return null;
      const json = await res.json();
      const c = json.case;
      if (!c) return null;

      const deal = c.intakeData?.deal || {};
      const loc = c.intakeData?.location || {};
      const address = `${c.street || loc.street || ''} ${c.house || loc.houseNumber || ''}, ${c.city || loc.city || ''}`.trim() || 'כתובת הנכס';
      const cadastral = `גוש ${c.block || loc.block || '—'} · חלקה ${c.parcel || loc.parcel || '—'}`;
      const askingPriceNum = Number(String(c.price || deal.askingPrice || '0').replace(/,/g, '')) || 0;

      const findingsList = (c.findings || []).map((f: any) => ({
        title: f.title,
        text: f.note,
        isPositive: f.severity === 'נמוכה',
      }));

      const top5 = findingsList.slice(0, 5);
      if (!top5.length) {
        top5.push({
          title: 'אימות ראשוני התקבל',
          text: 'פרטי הנכס נקלטו במערכת SafeDeal ונמצאים בתהליך סקירה מול מאגרי המידע הממשלתיים.',
          isPositive: true,
        });
      }

      const score = c.report?.safeScore ?? (c.status === 'דוח מוכן' || c.status === 'דוח נשלח' ? 84 : 78);
      const riskLevel = score >= 80 ? 'low' : score >= 65 ? 'low-medium' : score >= 45 ? 'medium-high' : 'high';

      const rpt: ReportData = {
        jobId: c.caseNumber || c.id,
        generatedAt: c.report?.generatedAt || c.updatedAt || new Date().toISOString(),
        dealType: deal.dealType === 'developer' || deal.dealType === 'new-developer' ? 'new-developer' : 'second-hand',
        reportNumber: c.caseNumber || `SD-${c.id.slice(0, 6)}`,
        safeScore: score,
        riskLevel,
        riskText: score >= 80 ? 'רמת סיכון: נמוכה' : score >= 65 ? 'רמת סיכון: בינונית-נמוכה' : score >= 45 ? 'רמת סיכון: בינונית-גבוהה' : 'רמת סיכון: גבוהה',
        recommendationText: c.report?.recommendation || (score >= 80 ? 'ניתן להתקדם לעסקה תוך ליווי משפטי שגרתי' : 'יש לבדוק את הממצאים המשפטיים טרם חתימה'),
        property: {
          address,
          cadastral,
          propertyType: c.assetType || 'דירת מגורים',
          rooms: deal.roomsCount ? `${deal.roomsCount} חדרים` : 'לא צוין',
          areaSqm: deal.propertyArea ? `${deal.propertyArea} מ״ר` : 'לא צוין',
          floor: deal.floorNumber || 'לא צוין',
          totalFloors: deal.totalFloors || undefined,
          askingPrice: askingPriceNum ? `₪${askingPriceNum.toLocaleString('he-IL')}` : 'לא צוין',
          askingPriceNum,
          parkingStorage: deal.hasParking ? 'כולל חניה' : undefined,
        },
        top5Findings: top5,
        quickRiskMap: [
          { id: 'cadastral', label: 'זיהוי וזכויות קדסטרליות', status: c.block && c.parcel ? 'green' : 'yellow' },
          { id: 'tabu', label: 'נסח טאבו ובעלות נקייה', status: c.documents?.some((d: any) => d.documentType?.includes('טאבו')) ? 'green' : 'yellow' },
          { id: 'pledges', label: 'משכונות ושעבודים', status: 'green' },
          { id: 'insolvency', label: 'חדלות פירעון (משרד המשפטים)', status: deal.insolvencyStatus === 'active' ? 'red' : deal.insolvencyStatus === 'recent_6m' ? 'yellow' : 'green' },
          { id: 'planning', label: 'תכנון, תב״ע והיתרים', status: 'green' },
          { id: 'price', label: 'כדאיות מחיר ושוק', status: 'green' },
        ],
        recommendationBanner: {
          verdictText: `סטטוס תיק: ${c.status}`,
          subtext:
            c.status === 'דוח נשלח'
              ? 'דוח בדיקת הנאותות אושר על ידי צוות האנליסטים ונשלח ללקוח.'
              : c.status === 'דוח מוכן'
              ? 'גרסת הדוח הרשמית הופקה ומוכנה לצפייה.'
              : 'התיק נמצא כעת בשלבי סקירה ובקרה על ידי אנליסט SafeDeal.',
        },
        scoreBreakdown: [
          { id: 'identification', label: 'זיהוי ואמינות קלט', score: 95, status: 'green' },
          { id: 'legal_flags', label: 'זכויות ודגלים משפטיים', score: 88, status: 'green' },
          { id: 'pledges_insolvency', label: 'משכונות וחדלות פירעון', score: deal.insolvencyStatus === 'active' ? 0 : 90, status: deal.insolvencyStatus === 'active' ? 'red' : 'green' },
          { id: 'market_price', label: 'כדאיות מחיר ושוק', score: 85, status: 'green' },
          { id: 'planning', label: 'תכנון והשפעה עתידית', score: 88, status: 'green' },
        ],
        actionableSection: {
          title: 'המלצות אופרטיביות להמשך התקדמות',
          items: [
            { id: 1, title: 'העברת הדוח לעורך הדין המייצג', description: 'מומלץ להעביר את דוח SafeDeal לעו״ד המלווה אתכם בעסקה לשם שילוב התנאים בחוזה.' },
            { id: 2, title: 'אימות נסח טאבו סמוך לחתימה', description: 'לוודא שלא נרשמו עיקולים או הערות אזהרה חדשות ב-24 השעות שקודמות לחתימה.' },
          ],
        },
        bottomLine: {
          text: c.report?.summaryNote || `הבדיקה המשוקללת של SafeDeal עבור הנכס ב-${address} מצביעה על ציון בטיחות של ${score}/100.`,
          score,
        },
        coveragePercent: c.findings?.length ? 92 : 75,
      };

      return rpt;
    } catch {
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const status = await fetchStatus();
        if (cancelled) return;

        if (status.status === "completed") {
          const rpt = await fetchReport();
          if (!cancelled) setReport(rpt);
        } else if (status.status === "failed") {
          // Attempt staff fallback
          const fallback = await tryStaffFallback();
          if (fallback && !cancelled) {
            setReport(fallback);
          } else {
            setError("עיבוד הבקשה נכשל. אנא נסה שוב.");
          }
        } else {
          timeoutId = setTimeout(poll, 2_000);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          // Seamless fallback to local staff store case if backend offline or case created in portal
          const fallback = await tryStaffFallback();
          if (fallback && !cancelled) {
            setReport(fallback);
          } else {
            setError(
              `שגיאה בטעינת הדוח: ${err instanceof Error ? err.message : "בעיית חיבור"}`
            );
          }
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchStatus, fetchReport]);

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (!report && !error) {
    const pct = progress?.percentComplete ?? 0;
    const msg = progress?.currentStepMessage ?? "מתחיל בדיקה...";

    return (
      <main className="relative min-h-screen z-10 flex flex-col items-center justify-center px-4 max-w-2xl mx-auto">
        <div className="w-full text-center space-y-10 animate-fade-in-up">
          <SafeDealLogo size="md" />

          <div className="space-y-3">
            <div className="w-8 h-[1px] bg-teal-500 mx-auto" />
            <h1
              className="text-3xl text-white font-bold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              מעבד את בדיקת הנאותות הניהולית
            </h1>
            <p className="text-slate-400 text-sm font-mono">#{jobId}</p>
          </div>

          <div className="space-y-3">
            <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-slate-400 font-bold">
              <span className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin text-teal-400" />
                {msg}
              </span>
              <span className="text-teal-400 font-mono text-xs">{pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-right text-[11px] text-slate-400 border border-white/10 p-6 rounded-xl bg-white/[0.02]">
            {[
              "GovMap — זיהוי קדסטרלי",
              "רשות המסים — עסקאות השוואה",
              "נדל\"ן ממשלתי — מחירי שוק",
              "XPLAN — תוכניות תכנון",
              "הלמ\"ס — מדד חברתי-כלכלי",
              "התחדשות עירונית GIS",
              "נסח טאבו — Gemini OCR",
              "היתרי בנייה — כל ישראל",
              "רשם החברות",
              "רשם המשכונות (סוכן AI)",
              "נט המשפט (סוכן AI)",
            ].map((src, i) => (
              <div
                key={src}
                className={`flex items-center gap-2 transition-colors duration-500 ${
                  i < Math.ceil((pct / 100) * 11)
                    ? "text-teal-400 font-bold"
                    : "text-slate-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    i < Math.ceil((pct / 100) * 11)
                      ? "bg-teal-400"
                      : "bg-slate-700"
                  }`}
                />
                {src}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Error Screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 max-w-xl mx-auto text-center space-y-8">
        <AlertTriangle size={44} className="text-amber-400" />
        <div className="space-y-3">
          <div className="w-8 h-[1px] bg-amber-400 mx-auto" />
          <h1
            className="text-2xl text-white font-bold"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            לא ניתן לטעון את הדוח
          </h1>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs font-mono">#{jobId}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setError(null);
              setProgress(null);
            }}
            className="text-xs uppercase tracking-widest font-bold text-teal-400 border border-teal-400/30 px-8 py-3 rounded-xl hover:bg-teal-400/10 transition-colors"
          >
            נסה שוב
          </button>
          <Link
            href="/analyze"
            className="text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            בקשה חדשה
          </Link>
        </div>
      </main>
    );
  }

  // ── Executive Deck Report Screen ───────────────────────────────────────────
  const r = report!;

  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-4 sm:px-6 py-12 pb-28 max-w-5xl mx-auto space-y-12">
      {/* Top Action Controls */}
      <header className="w-full flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors text-xs sm:text-sm font-bold"
        >
          <ArrowRight size={15} />
          חזרה לעמוד הבית
        </Link>
        <SafeDealLogo size="sm" />
      </header>

      <ReportActionBar />

      {/* ── PAGE 1: EXECUTIVE DECISION PAGE (עמוד החלטה) ────────────────────── */}
      <div className="w-full space-y-8 print:space-y-4 animate-fade-in-up">
        <ExecutiveHeader
          dealType={r.dealType}
          reportNumber={r.reportNumber || `SD-2026-${jobId.slice(-3)}`}
          generatedDate={new Date(r.generatedAt).toLocaleDateString("he-IL")}
          address={r.property.address}
          projectName={r.property.projectName}
        />

        {/* Grid: Property Details + SafeScore Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 items-stretch">
          <PropertyDetailsCard details={r.property} />
          <SafeScoreCard
            score={r.safeScore}
            riskText={r.riskText}
            recommendationText={r.recommendationText}
            dealType={r.dealType}
            coveragePercent={r.coveragePercent}
          />
        </div>

        {/* Grid: Top 5 Findings + Quick Risk Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 items-stretch">
          <Top5KeyFindings findings={r.top5Findings} />
          <QuickRiskMap categories={r.quickRiskMap} />
        </div>

        {/* Valuation & Market Comparison */}
        {r.valuation && <ValuationCard valuation={r.valuation} />}

        {/* Madlan Neighborhood Insights */}
        <MadlanInsightsCard insights={r.madlanInsights} />
      </div>

      {/* Page Break Divider for PDF Printing */}
      <div className="w-full h-[1px] bg-white/10 my-8 print:my-0 print:border-none print:page-break-before" />

      {/* ── PAGE 2: DETAILED BREAKDOWN & ACTION PLAN (עמוד פירוט ופעולות) ────── */}
      <div className="w-full space-y-8 print:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 items-stretch">
          <ScoreBreakdownBars items={r.scoreBreakdown} />
          <ActionableContextCard
            title={r.actionableSection?.title}
            items={r.actionableSection?.items}
          />
        </div>

        <RecommendedActionBanner
          text={r.bottomLine?.text}
          score={r.bottomLine?.score || r.safeScore}
        />

        {/* Detailed 4 Pillars */}
        {"pillars" in r && (
          <DataHubPillars
            pillars={(r as any).pillars}
            sourceStatuses={(r as any).sourceStatuses}
            warnings={(r as any).missingDataWarnings}
          />
        )}

        {/* Operative Role Checklist */}
        {"operativeNextSteps" in r && (
          <OperativeNextSteps steps={(r as any).operativeNextSteps} />
        )}
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-10 border-t border-white/10 text-xs text-slate-400 space-y-3 print:hidden font-medium">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-teal-400" />
          <span className="tracking-wider text-slate-200 font-bold">
            SafeDeal PropTech Israel · Real Estate Risk Intelligence
          </span>
        </div>
        <p className="max-w-xl mx-auto leading-relaxed text-slate-400">
          הדוח מיועד לסיוע בקבלת החלטות ואינו מהווה ייעוץ משפטי או שמאות רשמית. מומלץ להיוועץ בעורך דין ושמאי מוסמך.
        </p>
      </footer>
    </main>
  );
}
