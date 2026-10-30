"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

interface ExecutiveSummaryData {
  title?: string;
  badgeText?: string;
  overview?: string;
  strengths?: string[];
  riskPoints?: string[];
}

// Demo defaults shown on the static /report page
const DEMO: Required<ExecutiveSummaryData> = {
  title: "תמצית בדיקת נאותות",
  badgeText: "נכס תקין — בכפוף לבדיקה תכנונית",
  overview:
    "נכס המגורים ברחוב דיזנגוף 142 בתל אביב מציג רמת תקינות משפטית גבוהה. הזכויות רשומות כהלכה בפנקסי המקרקעין ללא עיקולים, צווים שיפוטיים או שיעבודים סותרים. אותרו שתי נקודות תכנוניות הדורשות התייחסות עורך דין ושמאי בטרם חתימה על חוזה המכר.",
  strengths: [
    "בעלות פרטית נקייה ורשומה בטאבו ללא צווים או מניעות.",
    "מחיר מבוקש (₪40,500/מ״ר) תואם מחירי עסקאות השוואה בתיקי רשות המסים.",
    "קיים טופס 4 מאושר ותעודת גמר מקורית בארכיב ההנדסה העירוני.",
  ],
  riskPoints: [
    "הצמדת המחסן (6 מ״ר) מופיעה בטיוטת החוזה אך מחייבת אימות מול תשריט הבית המשותף.",
    "סגירת מרפסת משנת 2008 אינה כוללת תיעוד מפורש בהיתר הבנייה המקורי.",
    "עבודות תשתית מתוכננות ברחוב הסמוך עשויות ליצור מטרד זמני.",
  ],
};

export function AiExecutiveSummary({ data }: { data?: ExecutiveSummaryData }) {
  const d = { ...DEMO, ...data };

  return (
    <div className="bg-navy-900 rounded-2xl border border-white/10 relative overflow-hidden mb-12 shadow-xl">
      <div className="p-8 sm:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="w-8 h-[1px] bg-teal-500" />
            <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold">
              תקציר מנהלים וממצאים עיקריים
            </span>
            <h2
              className="text-2xl sm:text-3xl text-white font-bold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {d.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider border border-teal-500/40 text-teal-300 rounded-lg bg-teal-500/10 font-bold shrink-0">
            <ShieldCheck size={16} />
            <span>{d.badgeText}</span>
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-8 text-sm leading-relaxed">
          <p
            className="text-slate-100 text-base sm:text-lg leading-loose font-normal max-w-4xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {d.overview}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Strengths */}
            <div className="p-5 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-4">
              <h4 className="text-xs font-bold text-teal-300 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-teal-500/30">
                <CheckCircle2 size={16} className="text-teal-400" />
                ממצאים חיוביים מרכזיים
              </h4>
              <ul className="text-sm space-y-3 text-slate-200 leading-relaxed font-medium">
                {d.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-teal-400 font-bold shrink-0">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Points */}
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-amber-500/30">
                <AlertTriangle size={16} className="text-amber-400" />
                דגשים לבדיקת עורך דין ושמאי
              </h4>
              <ul className="text-sm space-y-3 text-slate-200 leading-relaxed font-medium">
                {d.riskPoints.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-amber-400 font-bold shrink-0">!</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
