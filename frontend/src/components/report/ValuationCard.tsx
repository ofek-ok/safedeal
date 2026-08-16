"use client";

import { TrendingUp, Award, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { PropertyValuation } from "@/types/property";
import { SourceVerificationTooltip } from "@/components/report/SourceVerificationTooltip";

// Fallback interface if types are separate
export interface ValuationCardProps {
  valuation?: {
    estimatedValue: number;
    minValue: number;
    maxValue: number;
    askingPrice: number;
    priceDiffPercent: number;
    dealFairness: "fair" | "underpriced" | "overpriced";
    fairnessLabel: string;
    confidenceLevel: "high" | "medium" | "low";
    confidenceReason: string;
    comparableDeals: Array<{
      dealDate: string;
      address: string;
      rooms: string;
      sqm: number;
      price: number;
      pricePerSqm: number;
    }>;
  };
}

export function ValuationCard({ valuation }: ValuationCardProps) {
  if (!valuation || !valuation.estimatedValue) return null;

  const formatPrice = (val: number) =>
    `₪${val.toLocaleString("he-IL")}`;

  const {
    estimatedValue,
    minValue,
    maxValue,
    askingPrice,
    priceDiffPercent,
    dealFairness,
    fairnessLabel,
    confidenceLevel,
    confidenceReason,
    comparableDeals,
  } = valuation;

  // Calculate percentage offset for asking price on the scale
  const rangeSpan = maxValue - minValue || 1;
  const askingPosPercent = Math.min(
    100,
    Math.max(0, ((askingPrice - minValue) / rangeSpan) * 100)
  );

  const getFairnessStyle = () => {
    switch (dealFairness) {
      case "underpriced":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
          tag: "הזדמנות קנייה",
        };
      case "overpriced":
        return {
          bg: "bg-red-500/10 border-red-500/30 text-red-400",
          icon: <ShieldAlert size={16} className="text-red-400 shrink-0" />,
          tag: "תמחור יתר",
        };
      case "fair":
      default:
        return {
          bg: "bg-teal-500/10 border-teal-500/30 text-teal-400",
          icon: <Award size={16} className="text-teal-400 shrink-0" />,
          tag: "מחיר הוגן",
        };
    }
  };

  const style = getFairnessStyle();

  return (
    <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#060E1C]/80 backdrop-blur-md space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-[1px] bg-[#00C896]" />
            <span className="text-[10px] uppercase tracking-widest text-[#00C896] font-medium">
              ניתוח שווי שוק & כדאיות עסקה
            </span>
          </div>
          <h3
            className="text-2xl font-bold text-white tracking-wide flex items-center"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            <span>הערכת שווי שוק משוערת</span>
            <SourceVerificationTooltip sourceName="רשות המסים — nadlan.gov.il" sourceUrl="https://www.nadlan.gov.il/" details="מבוסס על עסקאות השוואה חתומות בנדל''ן ממשלתי" />
          </h3>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3.5 py-1.5 rounded-full text-xs text-slate-300">
          <TrendingUp size={14} className="text-[#00C896]" />
          <span>אמינות:</span>
          <span className="font-semibold text-white uppercase tracking-wider">
            {confidenceLevel === "high"
              ? "גבוהה"
              : confidenceLevel === "medium"
              ? "בינונית"
              : "בסיסית"}
          </span>
        </div>
      </div>

      {/* Fairness Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${style.bg}`}
      >
        <div className="flex items-center gap-3">
          {style.icon}
          <div>
            <span className="text-xs uppercase tracking-widest font-bold block mb-0.5">
              {style.tag}
            </span>
            <p className="text-sm font-medium">{fairnessLabel}</p>
          </div>
        </div>
        {askingPrice > 0 && (
          <div className="text-left shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase tracking-widest">
              מחיר עסקה מבוקש
            </span>
            <span
              className="text-lg font-bold text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {formatPrice(askingPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Range Scale */}
      <div className="space-y-4 pt-2">
        <div className="flex justify-between text-xs text-slate-400 font-medium tracking-wider">
          <span>טווח שווי נמוך: {formatPrice(minValue)}</span>
          <span className="text-[#00C896] font-bold">
            שווי משוער: {formatPrice(estimatedValue)}
          </span>
          <span>טווח שווי גבוה: {formatPrice(maxValue)}</span>
        </div>

        {/* Visual Bar */}
        <div className="relative h-3 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-visible">
          {/* Recommended Range Highlight */}
          <div className="absolute left-[15%] right-[15%] top-0 bottom-0 bg-[#00C896]/20 rounded-full border border-[#00C896]/40" />

          {/* Center Estimated Pin */}
          <div className="absolute left-1/2 -top-1 -bottom-1 w-1 bg-[#00C896] rounded-full shadow-[0_0_10px_#00C896]" />

          {/* Asking Price Marker */}
          {askingPrice > 0 && (
            <div
              className="absolute -top-2 w-4 h-4 rounded-full bg-amber-400 border-2 border-[#060E1C] shadow-md -ml-2 transition-all duration-500"
              style={{ left: `${askingPosPercent}%` }}
              title={`מחיר מבוקש בעסקה: ${formatPrice(askingPrice)}`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>{confidenceReason}</span>
          {askingPrice > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              סימון מחיר העסקה כעת
            </span>
          )}
        </div>
      </div>

      {/* Comparable Sales Table */}
      {comparableDeals && comparableDeals.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h4 className="text-xs uppercase tracking-widest text-slate-400 font-medium flex items-center gap-2">
            <span>עסקאות השוואה שנרשמו ברשות המסים בסביבה הקרובה</span>
            <span className="text-[10px] text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded">
              {comparableDeals.length} עסקאות
            </span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-medium">תאריך</th>
                  <th className="py-2.5 px-3 font-medium">חדרים</th>
                  <th className="py-2.5 px-3 font-medium">שטח</th>
                  <th className="py-2.5 px-3 font-medium">מחיר עסקה</th>
                  <th className="py-2.5 px-3 font-medium">מחיר למ"ר</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {comparableDeals.map((deal, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-slate-400">{deal.dealDate}</td>
                    <td className="py-3 px-3">{deal.rooms}</td>
                    <td className="py-3 px-3">{deal.sqm} מ"ר</td>
                    <td
                      className="py-3 px-3 font-semibold text-white"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {formatPrice(deal.price)}
                    </td>
                    <td className="py-3 px-3 text-[#00C896]">
                      {formatPrice(deal.pricePerSqm)} / מ"ר
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
