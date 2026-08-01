"use client";

import { useState } from "react";
import { CheckSquare, Square, ShieldAlert, FileText, Scale, Home } from "lucide-react";

interface StepItem {
  id: string;
  target: "עורך דין" | "שמאי" | "מוכר" | "בנק";
  title: string;
  description: string;
  icon: React.ElementType;
}

const NEXT_STEPS: StepItem[] = [
  {
    id: "lawyer-tabu",
    target: "עורך דין",
    title: "אימות תשריט הבית המשותף מול הצמדת המחסן",
    description: "בקש מעורך הדין לבדוק את התשריט המקורי בטאבו ולוודא שהמחסן (6 מ״ר) משויך לתת-החלקה באופן רשמי.",
    icon: Scale,
  },
  {
    id: "appraiser",
    title: "ביצוע שמאות מוקדמת לפני חתימה על זיכרון דברים",
    target: "שמאי",
    description: "מומלץ להזמין שמאי מקרקעין לבדיקת שווי ולוודא שאין פערים בשומה של הבנק למשכנתאות.",
    icon: Home,
  },
  {
    id: "seller-arnona",
    title: "קבלת אישור עירייה להיעדר חובות והיטל השבחה",
    target: "מוכר",
    description: "דרוש מהמוכר להציג אישור עירייה עדכני לטאבו שאין חובות ארנונה או היטל השבחה פתוח.",
    icon: FileText,
  },
  {
    id: "bank-mortgage",
    title: "וידוא מנגנון הסרת המשכנתה הקיימת של המוכר",
    target: "בנק",
    description: "ודא כי בחוזה המכר מעוגן מכתב כוונות (Letter of Intent) מהבנק של המוכר להסרת המשכנתה.",
    icon: ShieldAlert,
  },
];

export function OperativeNextSteps() {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedIds).filter(Boolean).length;

  return (
    <div className="bg-navy-900 p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl mb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="w-8 h-[1px] bg-teal-500"></div>
          <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold">
            צעדים מומלצים לפעולה
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            המלצות אופרטיביות
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            צ׳ק-ליסט מומלץ לפעולה מול עורך הדין, השמאי והמוכר לפני חתימת חוזה
          </p>
        </div>

        <span className="sd-badge-teal text-xs py-1.5 px-3.5 font-bold shrink-0">
          {completedCount} מתוך {NEXT_STEPS.length} הושלמו
        </span>
      </div>

      <div className="space-y-4">
        {NEXT_STEPS.map((item) => {
          const isDone = !!checkedIds[item.id];
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                isDone
                  ? "bg-teal-500/10 border-teal-500/40 opacity-80"
                  : "bg-slate-900/80 border-white/10 hover:border-white/25 hover:bg-slate-900"
              }`}
            >
              {/* Checkbox button */}
              <button
                type="button"
                className="mt-0.5 text-teal-400 shrink-0 focus:outline-none"
              >
                {isDone ? (
                  <CheckSquare size={20} className="text-teal-400" />
                ) : (
                  <Square size={20} className="text-slate-400" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-white/10 border border-white/15 text-teal-300">
                    מול: {item.target}
                  </span>
                  <h3
                    className={`text-sm sm:text-base font-bold ${
                      isDone ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {item.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {item.description}
                </p>
              </div>

              <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 hidden sm:flex">
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
