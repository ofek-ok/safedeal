import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getDb } from "../../../../../db";
import { caseIsVisible, getStaffIdentity } from "../../../../lib/staff";
import { requireChatGPTUser } from "../../../../chatgpt-auth";
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
import { synthesizeFullReport } from "@/lib/report-synthesizer";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireChatGPTUser(`/staff/cases/${id}/report`);
  const staff = await getStaffIdentity();
  if (!staff || !(await caseIsVisible(staff, id))) notFound();

  const db = getDb();
  const [reportRow, caseRow, findingsRows, docsRows] = await Promise.all([
    db.$client
      .prepare(`SELECT snapshot, version, created_at FROM reports WHERE case_id = ? ORDER BY version DESC LIMIT 1`)
      .bind(id)
      .first<{ snapshot: string; version: number; created_at: string }>(),
    db.$client
      .prepare(`SELECT * FROM cases WHERE id = ?`)
      .bind(id)
      .first<Record<string, any>>(),
    db.$client
      .prepare(`SELECT category, title, note, severity, source, state, review_note AS reviewNote FROM findings WHERE case_id = ? ORDER BY created_at DESC`)
      .bind(id)
      .all<any>(),
    db.$client
      .prepare(`SELECT filename, content_type AS contentType, size, uploaded_at AS uploadedAt FROM documents WHERE case_id = ?`)
      .bind(id)
      .all<any>(),
  ]);

  if (!caseRow && !reportRow) notFound();

  let snapshotData: any = null;
  if (reportRow?.snapshot) {
    try {
      snapshotData = JSON.parse(reportRow.snapshot);
    } catch {
      snapshotData = null;
    }
  }

  const activeCase = snapshotData?.case || caseRow || {};
  const activeFindings = snapshotData?.findings || findingsRows.results || [];
  const activeDocs = snapshotData?.documents || docsRows.results || [];
  const activeVersion = reportRow?.version ?? 1;
  const activeGeneratedAt = reportRow?.created_at ?? snapshotData?.generatedAt ?? new Date().toISOString();
  const activeGeneratedBy = snapshotData?.generatedBy ?? staff?.displayName ?? "אנליסט SafeDeal";

  const r = synthesizeFullReport({
    caseRow: activeCase,
    findings: activeFindings,
    documents: activeDocs,
    version: activeVersion,
    generatedAt: activeGeneratedAt,
    generatedBy: activeGeneratedBy,
  });

  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-4 sm:px-6 py-10 pb-28 max-w-5xl mx-auto space-y-10 text-right bg-[#060E1C] text-slate-100" dir="rtl">
      {/* Top Header Navigation */}
      <header className="w-full flex items-center justify-between print:hidden">
        <Link
          href="/staff"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-bold"
        >
          <ArrowRight size={15} />
          חזרה למערכת האנליסטים
        </Link>
        <SafeDealLogo size="sm" />
      </header>

      {/* Action Bar (Download PDF / Send Email) */}
      <ReportActionBar backLink="/staff" backLabel="חזרה לתיקי עבודה" />

      {/* ── PAGE 1: EXECUTIVE DECISION PAGE ─────────────────────────────────── */}
      <div className="w-full space-y-8 print:space-y-4 animate-fade-in-up">
        <ExecutiveHeader
          dealType={r.dealType}
          reportNumber={r.reportNumber}
          generatedDate={new Date(r.generatedAt).toLocaleDateString("he-IL")}
          address={r.property.address}
          projectName={r.property.projectName}
        />

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 items-stretch">
          <Top5KeyFindings findings={r.top5Findings} />
          <QuickRiskMap categories={r.quickRiskMap} />
        </div>

        {r.valuation && <ValuationCard valuation={r.valuation} />}

        {r.madlanInsights && <MadlanInsightsCard insights={r.madlanInsights} />}
      </div>

      <div className="w-full h-[1px] bg-white/10 my-8 print:my-0 print:border-none print:page-break-before" />

      {/* ── PAGE 2: DETAILED BREAKDOWN & ACTION PLAN ────────────────────────── */}
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

        {/* 4 Pillars with 11 Sources & Insolvency check */}
        <DataHubPillars
          pillars={r.pillars}
          sourceStatuses={r.sourceStatuses}
          warnings={r.missingDataWarnings}
        />

        {/* Operative Checklist */}
        <OperativeNextSteps steps={r.operativeNextSteps} />
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
          דוח רשמי גרסה {activeVersion} · הופק על ידי {activeGeneratedBy} · נבדק ואושר במערכת האנליסטים.
          הדוח מיועד לסיוע בקבלת החלטות ואינו מהווה תחליף לייעוץ משפטי או שמאות מקרקעין.
        </p>
      </footer>
    </main>
  );
}
