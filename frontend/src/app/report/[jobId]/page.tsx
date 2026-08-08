"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";
import { ReportActionBar } from "@/components/report/ReportActionBar";
import { SafeScoreCard } from "@/components/report/SafeScoreCard";
import { AiExecutiveSummary } from "@/components/report/AiExecutiveSummary";
import { DataHubPillars } from "@/components/report/DataHubPillars";
import { OperativeNextSteps } from "@/components/report/OperativeNextSteps";
import type { SynthesizedReport, JobProgress } from "@/types/report";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Props {
  params: { jobId: string };
}

export default function ReportByIdPage({ params }: Props) {
  const { jobId } = params;
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [report, setReport] = useState<SynthesizedReport | null>(null);
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
    return res.json() as Promise<SynthesizedReport>;
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
          // Still processing — poll again in 2s
          timeoutId = setTimeout(poll, 2_000);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(`שגיאה בטעינת הדוח: ${err instanceof Error ? err.message : "בעיית חיבור"}`);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchStatus, fetchReport]);

  // ── Loading / Progress Screen ────────────────────────────────────────────────
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
              className="text-3xl text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              מעבד את הבדיקה שלך
            </h1>
            <p className="text-slate-400 text-sm tracking-wide">
              #{jobId}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-3">
            <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin text-teal-500" />
                {msg}
              </span>
              <span className="text-teal-400 font-mono">{pct}%</span>
            </div>
          </div>

          {/* Source checklist */}
          <div className="grid grid-cols-2 gap-2 text-right text-[11px] text-slate-500 border border-white/[0.06] p-6">
            {[
              "GovMap — זיהוי קדסטרלי",
              "רשות המסים — עסקאות השוואה",
              "נדל\"ן ממשלתי — מחירי שוק",
              "XPLAN — תוכניות תכנון",
              "הלמ\"ס — מדד חברתי-כלכלי",
              "התחדשות עירונית",
              "נסח טאבו — Gemini OCR",
              "היתרי בנייה — כל ישראל",
              "רשם החברות",
              "רשם המשכונות",
              "נט המשפט / נבו",
            ].map((src, i) => (
              <div
                key={src}
                className={`flex items-center gap-2 transition-colors duration-500 ${
                  i < Math.ceil((pct / 100) * 11) ? "text-teal-400" : "text-slate-600"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  i < Math.ceil((pct / 100) * 11) ? "bg-teal-400" : "bg-slate-700"
                }`} />
                {src}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // ── Error Screen ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 max-w-xl mx-auto text-center space-y-8">
        <AlertTriangle size={40} className="text-amber-400" />
        <div className="space-y-3">
          <div className="w-8 h-[1px] bg-amber-400 mx-auto" />
          <h1 className="text-2xl text-white" style={{ fontFamily: "var(--font-serif)" }}>
            לא ניתן לטעון את הדוח
          </h1>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs font-mono">#{jobId}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setError(null); setProgress(null); }}
            className="text-xs uppercase tracking-widest text-teal-400 border border-teal-400/30 px-8 py-3 hover:bg-teal-400/10 transition-colors"
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

  // ── Report Screen ─────────────────────────────────────────────────────────────
  const r = report!;

  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-4 sm:px-6 py-20 pb-32 max-w-5xl mx-auto space-y-10">
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

      <div className="w-full space-y-3 pt-4 pb-2 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-[1px] bg-teal-500 mb-1" />
          <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold">
            בדיקה מ-11 מקורות מידע רשמיים
          </span>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {r.executiveSummary.title}
          </h1>
          <p className="text-slate-500 text-xs font-mono">{r.jobId} · {new Date(r.generatedAt).toLocaleDateString("he-IL")}</p>
        </div>
      </div>

      <ReportActionBar />

      {/* Print header */}
      <div className="hidden print:flex items-center justify-between w-full mb-8 pb-6 border-b border-slate-300">
        <SafeDealLogo size="md" />
        <div className="text-left text-xs text-slate-700 font-medium">
          <p className="font-bold">SafeDeal – דוח נאותות רשמי</p>
          <p>תאריך הפקה: {new Date(r.generatedAt).toLocaleDateString("he-IL")}</p>
          <p>#{r.jobId}</p>
        </div>
      </div>

      <div className="w-full space-y-10">
        <SafeScoreCard
          score={r.safeScore}
          address={r.property.address}
          cadastral={r.property.cadastral}
          askingPrice={r.property.askingPrice || undefined}
          riskText={r.riskText}
        />
        <AiExecutiveSummary data={r.executiveSummary} />
        <DataHubPillars pillars={r.pillars} sourceStatuses={r.sourceStatuses} warnings={r.missingDataWarnings} />
        <OperativeNextSteps steps={r.operativeNextSteps} />
      </div>

      <footer className="w-full text-center py-10 border-t border-white/10 text-xs text-slate-300 space-y-3 print:hidden font-medium">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-teal-400" />
          <span className="tracking-wider text-slate-200 font-bold">SafeDeal PropTech Israel</span>
        </div>
        <p className="max-w-xl mx-auto leading-relaxed text-slate-300">
          הדוח מיועד לסיוע בקבלת החלטות ואינו מהווה ייעוץ משפטי או שמאות רשמית. מומלץ להיוועץ בעורך דין ושמאי מוסמך.
        </p>
      </footer>
    </main>
  );
}
