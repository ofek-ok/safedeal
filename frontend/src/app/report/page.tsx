import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";
import { ReportActionBar } from "@/components/report/ReportActionBar";
import { SafeScoreCard } from "@/components/report/SafeScoreCard";
import { ValuationCard } from "@/components/report/ValuationCard";
import { AiExecutiveSummary } from "@/components/report/AiExecutiveSummary";
import { DataHubPillars } from "@/components/report/DataHubPillars";
import { OperativeNextSteps } from "@/components/report/OperativeNextSteps";

export const metadata: Metadata = {
  title: "דוח בדיקת נאותות | SafeDeal",
  description:
    "דוח נאותות מקיף מ-8 מקורות מידע רשמיים לבדיקת דירה יד שנייה בישראל.",
};

export default function ReportPage() {
  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-4 sm:px-6 py-20 pb-32 max-w-5xl mx-auto space-y-10">
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

      {/* Editorial Header Section */}
      <div className="w-full space-y-3 pt-4 pb-2 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-[1px] bg-teal-500 mb-1"></div>
          <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold">
            בדיקה מקיפה מ-8 מקורות מידע רשמיים
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            דוח בדיקת נאותות רשמי
          </h1>
        </div>
      </div>

      {/* Action Bar (Sticky with Print / Email / New Property actions) */}
      <ReportActionBar />

      {/* Print-Only Header Logo */}
      <div className="hidden print:flex items-center justify-between w-full mb-8 pb-6 border-b border-slate-300">
        <SafeDealLogo size="md" />
        <div className="text-left text-xs text-slate-700 font-medium">
          <p className="font-bold">SafeDeal – דוח נאותות רשמי</p>
          <p>תאריך הפקה: {new Date().toLocaleDateString("he-IL")}</p>
        </div>
      </div>

      {/* Main Report Document Sections */}
      <div className="w-full space-y-10">
        <SafeScoreCard />
        <ValuationCard
          valuation={{
            estimatedValue: 3380000,
            minValue: 3210000,
            maxValue: 3550000,
            askingPrice: 3450000,
            priceDiffPercent: 2,
            dealFairness: "fair",
            fairnessLabel: "מחיר המוכר (3,450,000 ₪) תואם את שווי השוק המשוער בסביבה",
            confidenceLevel: "high",
            confidenceReason: "מבוסס על 14 עסקאות רשות המסים ברחוב דיזנגוף ב-12 חודשים אחרונים",
            comparableDeals: [
              { dealDate: "15/06/2026", address: "דיזנגוף 140, תל אביב", rooms: "3.5 חדרים", sqm: 82, price: 3320000, pricePerSqm: 40487 },
              { dealDate: "02/04/2026", address: "דיזנגוף 146, תל אביב", rooms: "4 חדרים", sqm: 88, price: 3580000, pricePerSqm: 40681 },
              { dealDate: "18/01/2026", address: "דיזנגוף 138, תל אביב", rooms: "3 חדרים", sqm: 75, price: 3050000, pricePerSqm: 40666 },
              { dealDate: "11/11/2025", address: "דיזנגוף 150, תל אביב", rooms: "3.5 חדרים", sqm: 85, price: 3420000, pricePerSqm: 40235 },
            ]
          }}
        />
        <AiExecutiveSummary />
        <DataHubPillars />
        <OperativeNextSteps />
      </div>

      {/* Footer Branding Note */}
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
