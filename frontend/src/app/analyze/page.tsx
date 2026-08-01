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
    <main className="relative min-h-screen z-10 flex flex-col items-center px-6 py-12 pb-24">
      {/* Top nav */}
      <nav className="w-full max-w-2xl flex items-center justify-between mb-16">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowRight size={15} />
          חזרה
        </Link>
        <SafeDealLogo size="sm" />
      </nav>

      {/* Editorial page header */}
      <div className="text-center mb-12 max-w-xl">
        <div className="w-10 h-[1px] bg-teal-500 mx-auto mb-6" />
        <p
          className="text-xs font-medium tracking-[0.2em] text-teal-400 uppercase mb-4"
        >
          בדיקת נאותות
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          הזינו את פרטי הנכס
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          ללא שדות חובה — מלאו את מה שנוח לכם וקבלו דוח תוך דקות.
        </p>
      </div>

      {/* Form card — editorial border, no glass */}
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-white/[0.01] p-6 md:p-10">
        <MultiStepForm />
      </div>

      {/* Footer note */}
      <p className="mt-8 text-[11px] text-slate-600 text-center tracking-wider">
        SafeDeal — מוצפן מקצה לקצה · הנתונים שלכם לא ישותפו עם צד שלישי
      </p>
    </main>
  );
}
