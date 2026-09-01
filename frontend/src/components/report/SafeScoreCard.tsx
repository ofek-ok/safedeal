"use client";

import { ShieldCheck, AlertCircle } from "lucide-react";

interface SafeScoreCardProps {
  score?: number;
  riskText?: string;
  recommendationText?: string;
  dealType?: "second-hand" | "developer" | "new-developer";
  coveragePercent?: number;
}

export function SafeScoreCard({
  score = 71,
  riskText = "רמת סיכון: בינונית",
  recommendationText = "ניתן להתקדם בזהירות",
  coveragePercent,
}: SafeScoreCardProps) {
  const isHigh = score >= 80;
  const isMedium = score >= 65 && score < 80;

  // Color theme
  const accentColor = isHigh ? "#10B981" : isMedium ? "#F59E0B" : "#EF4444";
  const pillBgClass = isHigh
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    : isMedium
    ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
    : "bg-red-500/20 text-red-300 border-red-500/30";

  // Speedometer Needle Calculation (180 degree semi-circle arc)
  // Score 0 -> Math.PI (180 deg, left)
  // Score 100 -> 0 (0 deg, right)
  const clampedScore = Math.max(0, Math.min(100, score));
  const angleRad = Math.PI - (clampedScore / 100) * Math.PI;

  const needleLength = 58;
  const cx = 100;
  const cy = 105;

  const nx = cx + needleLength * Math.cos(angleRad);
  const ny = cy - needleLength * Math.sin(angleRad);

  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
      {/* Background Glow Accent */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 w-full space-y-3">
        {/* Title Badge & Coverage */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-teal-400" />
            <span className="text-xs uppercase font-mono tracking-widest text-slate-300">
              SAFE SCORE GAUGE
            </span>
          </div>
          {coveragePercent !== undefined && coveragePercent > 0 && (
            <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-full">
              כיסוי: {coveragePercent}%
            </span>
          )}
        </div>

        {/* Speedometer SVG Gauge */}
        <div className="relative w-48 sm:w-56 h-32 sm:h-36 mx-auto flex flex-col items-center justify-end max-w-full overflow-hidden">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 200 120">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EF4444" />
                <stop offset="45%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Background Arc */}
            <path
              d="M 25,105 A 75,75 0 0,1 175,105"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Color Gradient Arc */}
            <path
              d="M 25,105 A 75,75 0 0,1 175,105"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Needle Line */}
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke="#FFFFFF"
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out drop-shadow-md"
            />

            {/* Needle Base Circle */}
            <circle cx={cx} cy={cy} r="7" fill="#FFFFFF" />
            <circle cx={cx} cy={cy} r="4" fill="#0B1528" />
          </svg>

          {/* Big Score Display */}
          <div className="mt-[-10px] space-y-0.5">
            <div
              className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {score}
              <span className="text-lg font-mono text-slate-400 font-normal">/100</span>
            </div>
          </div>
        </div>

        {/* Risk Level & Recommendation Badges */}
        <div className="space-y-2 pt-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold border bg-white/5 border-white/10 text-slate-300">
            {riskText}
          </div>

          <div
            className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border font-bold text-xs sm:text-sm shadow-md transition-all duration-300 text-center flex-wrap ${pillBgClass}`}
          >
            {isHigh ? (
              <ShieldCheck size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span>המלצת SafeDeal: {recommendationText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
