"use client";

import type { QuickRiskCategory } from "@/types/property";

interface QuickRiskMapProps {
  categories?: QuickRiskCategory[];
}

const DEFAULT_CATEGORIES: QuickRiskCategory[] = [
  { id: "ownership", label: "בעלות וזכויות", status: "green" },
  { id: "debts", label: "חובות על הנכס", status: "green" },
  { id: "violations", label: "חריגות בנייה", status: "green" },
  { id: "building-state", label: "מצב הבניין", status: "yellow" },
  { id: "market-price", label: "מחיר מול שוק", status: "yellow" },
  { id: "seller-risk", label: "חובות המוכר / סיכון פיננסי", status: "red" },
];

export function QuickRiskMap({ categories = DEFAULT_CATEGORIES }: QuickRiskMapProps) {
  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span>מפת סיכונים מהירה</span>
        <span className="text-xs text-slate-400 font-mono">תמונת מצב חזותית</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02]"
          >
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              {cat.label}
            </span>
            <div className="flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-lg ${
                  cat.status === "green"
                    ? "bg-emerald-500 shadow-emerald-500/50"
                    : cat.status === "yellow"
                    ? "bg-amber-400 shadow-amber-400/50"
                    : "bg-red-500 shadow-red-500/50 opacity-90"
                }`}
              />
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                  cat.status === "green"
                    ? "text-emerald-400 bg-emerald-500/10"
                    : cat.status === "yellow"
                    ? "text-amber-300 bg-amber-500/10"
                    : "text-red-400 bg-red-500/10"
                }`}
              >
                {cat.status === "green"
                  ? "תקין"
                  : cat.status === "yellow"
                  ? "לבדיקה"
                  : "טיפול"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-6 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>ירוק = ללא סיכון מהותי</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>צהוב = מומלץ לבדיקה</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>אדום = מחייב טיפול</span>
        </div>
      </div>
    </div>
  );
}
