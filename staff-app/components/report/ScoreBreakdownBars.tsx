"use client";

import {
  Scale,
  Landmark,
  FileCheck,
  Shield,
  Building,
  TrendingUp,
  UserX,
  Wrench,
  Clock,
  Compass,
} from "lucide-react";
import type { ScoreBreakdownItem } from "@/types/property";

interface ScoreBreakdownProps {
  items?: ScoreBreakdownItem[];
}

const DEFAULT_ITEMS: ScoreBreakdownItem[] = [
  { id: "ownership", label: "בעלות וזכויות", score: 95, status: "green", iconKey: "Scale" },
  { id: "debts", label: "חובות על הנכס", score: 100, status: "green", iconKey: "Landmark" },
  { id: "violations", label: "חריגות בנייה", score: 90, status: "green", iconKey: "FileCheck" },
  { id: "legal-state", label: "מצב משפטי", score: 85, status: "green", iconKey: "Shield" },
  { id: "building-state", label: "מצב הבניין", score: 70, status: "yellow", iconKey: "Building" },
  { id: "market-price", label: "מחיר מול שוק", score: 75, status: "yellow", iconKey: "TrendingUp" },
  { id: "seller-risk", label: "סיכון פיננסי של המוכר", score: 30, status: "red", iconKey: "UserX" },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  Landmark,
  FileCheck,
  Shield,
  Building,
  TrendingUp,
  UserX,
  Wrench,
  Clock,
  Compass,
};

export function ScoreBreakdownBars({ items = DEFAULT_ITEMS }: ScoreBreakdownProps) {
  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-5">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span>פירוט הציון הסופי</span>
        <span className="text-xs text-slate-400 font-mono">ציוני תחום 0–100</span>
      </h3>

      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.iconKey && ICON_MAP[item.iconKey] ? ICON_MAP[item.iconKey] : Scale;
          const barColor =
            item.status === "green"
              ? "bg-emerald-500"
              : item.status === "yellow"
              ? "bg-amber-400"
              : "bg-red-500";

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2 text-slate-200">
                  <Icon size={16} className="text-teal-400" />
                  <span>{item.label}</span>
                </div>
                <span
                  className="font-serif text-white font-bold"
                  style={{ color: item.score >= 80 ? "#34D399" : item.score >= 60 ? "#FBBF24" : "#F87171" }}
                >
                  {item.score}
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
