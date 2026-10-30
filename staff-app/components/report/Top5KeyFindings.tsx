"use client";

import { Check, AlertTriangle } from "lucide-react";
import type { TopFindingItem } from "@/types/property";

interface Top5KeyFindingsProps {
  findings?: TopFindingItem[];
}

const DEFAULT_FINDINGS: TopFindingItem[] = [
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

export function Top5KeyFindings({ findings = DEFAULT_FINDINGS }: Top5KeyFindingsProps) {
  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span className="flex items-center gap-2">
          <span>5 הדברים שחייבים לדעת</span>
        </span>
        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
          ממצאים קריטיים
        </span>
      </h3>

      <div className="space-y-3">
        {findings.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-300 ${
              item.isPositive
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                item.isPositive
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-amber-500 text-slate-950"
              }`}
            >
              {item.isPositive ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <AlertTriangle size={16} strokeWidth={3} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              {item.text && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {item.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
