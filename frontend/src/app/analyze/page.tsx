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
    <main className="relative min-h-screen z-10 flex flex-col items-center px-6 py-10 pb-24 overflow-hidden selection:bg-[#00C896]/30 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,200,150,0.1)_0%,rgba(30,68,120,0.06)_40%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Top nav */}
      <nav className="w-full max-w-2xl flex items-center justify-between mb-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold group"
        >
          <ArrowRight size={16} className="group-hover:-translate-x-1 transition-transform" />
          חזרה
        </Link>
        <SafeDealLogo size="sm" />
      </nav>

      {/* Editorial page header */}
      <div className="text-center mb-10 max-w-xl">
        <div className="w-10 h-[2px] bg-[#00C896] mx-auto mb-5" />
        <p
          className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase mb-3"
        >
          בדיקת נאותות
        </p>
        <h1
          className="text-3xl sm:text-4xl font-serif font-extrabold text-white mb-3 leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          הזינו את פרטי הנכס
        </h1>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          ללא שדות חובה — מלאו את מה שנוח לכם וקבלו דוח תוך דקות.
        </p>
      </div>

      {/* Form card — high-end glass container */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/14 bg-[#0A1628]/85 backdrop-blur-2xl p-6 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
        <MultiStepForm />
      </div>

      {/* Footer note */}
      <p className="mt-8 text-xs text-slate-500 text-center tracking-wider font-medium">
        SafeDeal — מוצפן מקצה לקצה · הנתונים שלכם לא ישותפו עם צד שלישי
      </p>
    </main>
  );
}
