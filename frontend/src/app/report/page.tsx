import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
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

export const metadata: Metadata = {
  title: "דוח סיכונים רשמי | SafeDeal",
  description:
    "דוח הערכת סיכונים מקיף מ-11 מקורות מידע רשמיים לרכישת דירה בישראל.",
};

export default function ReportPage() {
  const propertyDetails = {
    address: "הוד השרון 8, רחוב הרימון",
    propertyType: "דירת 4 חדרים",
    rooms: "4 חדרים",
    areaSqm: "112 מ״ר",
    floor: "קומה 3 מתוך 6",
    parkingStorage: "חניה אחת / מחסן",
    askingPrice: "₪3,050,000",
    yearBuilt: "1998",
  };

  const top5Findings = [
    {
      title: "זכויות הבעלות תקינות",
      text: "לא נמצאו בעיות רישום משמעותיות או מחלוקות בעלות",
      isPositive: true,
    },
    {
      title: "לא נמצאו חובות רשומים על הנכס",
      text: "היטלי השבחה או שעבודים פתוחים, לא אותרו חובות ארנונה",
      isPositive: true,
    },
    {
      title: "לא נמצאו חריגות בנייה מהותיות",
      text: "הנכס תואם ברובו את התיעוד הקיים",
      isPositive: true,
    },
    {
      title: "אחד מבעלי הנכס מצוי בקשיים פיננסיים",
      text: "קיימות אינדיקציות לחובות או הליכים כספיים שיכולים להשפיע על העסקה",
      isPositive: false,
    },
    {
      title: "קיים סיכון לעיכוב בהעברת הזכויות",
      text: "נדרשת בדיקה חוזרת לפני חתימה ולפני העברת התשלום האחרון",
      isPositive: false,
    },
  ];

  const quickRiskMap = [
    { id: "ownership", label: "בעלות וזכויות", status: "green" as const },
    { id: "debts", label: "חובות על הנכס", status: "green" as const },
    { id: "violations", label: "חריגות בנייה", status: "green" as const },
    { id: "building-state", label: "מצב הבניין", status: "yellow" as const },
    { id: "market-price", label: "מחיר מול שוק", status: "yellow" as const },
    { id: "seller-risk", label: "חובות המוכר / סיכון פיננסי", status: "red" as const },
  ];

  const scoreBreakdown = [
    { id: "ownership", label: "בעלות וזכויות", score: 95, status: "green" as const, iconKey: "Scale" },
    { id: "debts", label: "חובות על הנכס", score: 100, status: "green" as const, iconKey: "Landmark" },
    { id: "violations", label: "חריגות בנייה", score: 90, status: "green" as const, iconKey: "FileCheck" },
    { id: "legal-state", label: "מצב משפטי", score: 85, status: "green" as const, iconKey: "Shield" },
    { id: "building-state", label: "מצב הבניין", score: 70, status: "yellow" as const, iconKey: "Building" },
    { id: "market-price", label: "מחיר מול שוק", score: 75, status: "yellow" as const, iconKey: "TrendingUp" },
    { id: "seller-risk", label: "סיכון פיננסי של המוכר", score: 30, status: "red" as const, iconKey: "UserX" },
  ];

  const actionableItems = [
    {
      id: 1,
      title: "עיקול חדש לפני השלמת העסקה",
      description: "נושה עשוי להטיל עיקול על זכויות המוכר לפני העברת הבעלות.",
    },
    {
      id: 2,
      title: "עיכוב בקבלת אישורים",
      description: "ייתכן שיהיה צורך להסדיר חובות או אישורים לפני סיום העסקה.",
    },
    {
      id: 3,
      title: "סיכון בהעברת כספים",
      description: "יש לוודא שכספי התמורה עוברים במנגנון נאמנות בטוח.",
    },
    {
      id: 4,
      title: "בדיקה חוזרת לפני הסגירה",
      description: "המצב הפיננסי של המוכר יכול להשתנות בין החתימה למסירה.",
    },
  ];

  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-4 sm:px-6 py-12 pb-28 max-w-5xl mx-auto space-y-12">
      {/* Top Header Navigation */}
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

      {/* ── PAGE 1: EXECUTIVE DECISION PAGE ─────────────────────────────────── */}
      <div className="w-full space-y-8 animate-fade-in-up">
        <ExecutiveHeader
          dealType="second-hand"
          reportNumber="SD-2026-002"
          generatedDate="16.08.2026"
          address="רחוב הרימון 8, הוד השרון"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <PropertyDetailsCard details={propertyDetails} />
          <SafeScoreCard
            score={71}
            riskText="רמת סיכון: בינונית"
            recommendationText="ניתן להתקדם בזהירות"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <Top5KeyFindings findings={top5Findings} />
          <QuickRiskMap categories={quickRiskMap} />
        </div>

        <ValuationCard
          valuation={{
            estimatedValue: 2980000,
            minValue: 2850000,
            maxValue: 3120000,
            askingPrice: 3050000,
            priceDiffPercent: 2,
            dealFairness: "fair",
            fairnessLabel: "מחיר המוכר (3,050,000 ₪) תואם את שווי השוק המשוער בסביבה",
            confidenceLevel: "high",
            confidenceReason: "מבוסס על 12 עסקאות אמת מרשות המסים ברחוב הרימון ב-12 חודשים אחרונים",
            comparableDeals: [
              { dealDate: "12/05/2026", address: "רחוב הרימון 10, הוד השרון", rooms: "4 חדרים", sqm: 110, price: 2950000, pricePerSqm: 26818 },
              { dealDate: "03/03/2026", address: "רחוב הרימון 6, הוד השרון", rooms: "4 חדרים", sqm: 115, price: 3100000, pricePerSqm: 26956 },
              { dealDate: "14/11/2025", address: "רחוב הרימון 12, הוד השרון", rooms: "4 חדרים", sqm: 108, price: 2900000, pricePerSqm: 26851 },
            ]
          }}
        />

        <MadlanInsightsCard />
      </div>

      <div className="w-full h-[1px] bg-white/10 my-8 print:page-break-before" />

      {/* ── PAGE 2: DETAILED BREAKDOWN & ACTION PLAN ────────────────────────── */}
      <div className="w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <ScoreBreakdownBars items={scoreBreakdown} />
          <ActionableContextCard
            title="מה המשמעות של חובות אישיים?"
            items={actionableItems}
          />
        </div>

        <RecommendedActionBanner
          text="לעצור את העברת הכספים עד במקרה של ממצא חדש, ולבצע בדיקה חוזרת סמוך לחתימה ולפני העברת התשלום האחרון, להגדיר נאמנות לסילוק חובות, לבקש מעורך הדין לבצע בדיקת עיקולים עדכנית להסדרה."
          score={71}
        />

        <DataHubPillars />
        <OperativeNextSteps />
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
