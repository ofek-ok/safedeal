import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MultiStepForm } from "@/components/form/MultiStepForm";
import { SafeDealLogo } from "@/components/SafeDealLogo";

export const metadata: Metadata = {
  title: "בדיקת נאותות לדירה | SafeDeal",
  description:
    "מלאו את הפרטים ותקבלו דוח בדיקת נאותות מקיף לדירה שאתם שוקלים לרכוש.",
};

export default function AnalyzePage() {
  return (
    <main className="relative min-h-screen z-10 flex flex-col items-center px-3 sm:px-6 py-4 sm:py-10 pb-16 sm:pb-24 overflow-hidden selection:bg-[#00C896]/30 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,200,150,0.1)_0%,rgba(30,68,120,0.06)_40%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Top nav */}
      <nav className="w-full max-w-2xl flex items-center justify-between mb-4 sm:mb-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs sm:text-sm font-semibold group"
        >
          <ArrowRight size={15} className="group-hover:-translate-x-1 transition-transform" />
          חזרה
        </Link>
        <SafeDealLogo size="sm" />
      </nav>

      {/* Multi-step form with step indicator above header */}
      <div className="w-full max-w-2xl">
        <MultiStepForm />
      </div>

      {/* Footer note */}
      <p className="mt-4 sm:mt-8 text-[11px] sm:text-xs text-slate-500 text-center tracking-wider font-medium">
        SafeDeal — מוצפן מקצה לקצה · הנתונים שלכם לא ישותפו עם צד שלישי
      </p>
    </main>
  );
}
