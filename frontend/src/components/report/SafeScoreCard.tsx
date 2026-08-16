"use client";

import { ShieldCheck, AlertCircle } from "lucide-react";

interface SafeScoreCardProps {
  score?: number;
  riskText?: string;
  recommendationText?: string;
  dealType?: "second-hand" | "developer" | "new-developer";
}

export function SafeScoreCard({
  score = 71,
  riskText = "רמת סיכון: בינונית",
  recommendationText = "ניתן להתקדם בזהירות",
}: SafeScoreCardProps) {
  const isHigh = score >= 80;
  const isMedium = score >= 65 && score < 80;

  // Arc calculation for SVG Ring
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const colorHex = isHigh ? "#10B981" : isMedium ? "#F59E0B" : "#EF4444";

  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
      {/* Background Accent Blur */}
      <div
        className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: colorHex }}
      />

      <div className="relative z-10 w-full space-y-4">
        {/* Title Badge */}
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck size={18} className="text-teal-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-300">
            SAFE SCORE OFFICIAL INDEX
          </span>
        </div>

        {/* SVG Ring Gauge */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background Ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="currentColor"
              strokeWidth="14"
              className="text-white/10"
              fill="transparent"
            />
            {/* Value Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke={colorHex}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Score Text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span
              className="text-5xl font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {score}
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">/100</span>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-300">{riskText}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mt-2">
            {isHigh ? (
              <ShieldCheck size={16} className="text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="text-amber-400" />
            )}
            <span className="text-xs font-bold text-white">
              המלצת SafeDeal: {recommendationText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
