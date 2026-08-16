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
          setError("עיבוד הבקשה נכשל. אנא נסה שוב.");
        } else {
          timeoutId = setTimeout(poll, 2_000);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            `שגיאה בטעינת הדוח: ${err instanceof Error ? err.message : "בעיית חיבור"}`
          );
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
      <div className="w-full space-y-8 animate-fade-in-up">
        <ExecutiveHeader
          dealType={r.dealType}
          reportNumber={r.reportNumber || `SD-2026-${jobId.slice(-3)}`}
          generatedDate={new Date(r.generatedAt).toLocaleDateString("he-IL")}
          address={r.property.address}
          projectName={r.property.projectName}
        />

        {/* Grid: Property Details + SafeScore Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <PropertyDetailsCard details={r.property} />
          <SafeScoreCard
            score={r.safeScore}
            riskText={r.riskText}
            recommendationText={r.recommendationText}
            dealType={r.dealType}
          />
        </div>

        {/* Grid: Top 5 Findings + Quick Risk Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <Top5KeyFindings findings={r.top5Findings} />
          <QuickRiskMap categories={r.quickRiskMap} />
        </div>

        {/* Valuation & Market Comparison */}
        {r.valuation && <ValuationCard valuation={r.valuation} />}
      </div>

      {/* Page Break Divider for PDF Printing */}
      <div className="w-full h-[1px] bg-white/10 my-8 print:page-break-before" />

      {/* ── PAGE 2: DETAILED BREAKDOWN & ACTION PLAN (עמוד פירוט ופעולות) ────── */}
      <div className="w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
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
