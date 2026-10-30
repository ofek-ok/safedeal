"use client";

import { ShieldAlert } from "lucide-react";

interface RecommendedActionProps {
  text?: string;
  score?: number;
}

export function RecommendedActionBanner({
  text = "לעצור את העברת הכספים עד במקרה של ממצא חדש, ולבצע בדיקה חוזרת סמוך לחתימה ולפני העברת התשלום האחרון, להגדיר נאמנות לסילוק חובות, לבקש מעורך הדין לבצע בדיקת עיקולים עדכנית להסדרה.",
  score = 71,
}: RecommendedActionProps) {
  return (
    <div className="w-full bg-[#060E1C] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-right space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <h3
          className="text-base sm:text-lg font-bold text-white flex items-center gap-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          <ShieldAlert size={20} className="text-amber-400 shrink-0" />
          <span>תוכנית פעולה מומלצת / שורה תחתונה ללקוח</span>
        </h3>

        <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-xs font-mono font-bold text-teal-400">
            SAFE SCORE {score}/100
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-200 leading-relaxed max-w-4xl">
        {text}
      </p>
    </div>
  );
}
