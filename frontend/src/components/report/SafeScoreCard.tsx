"use client";

import { ShieldCheck, MapPin, Layers, Tag } from "lucide-react";

interface SafeScoreCardProps {
  score?: number;
  address?: string;
  cadastral?: string;
  askingPrice?: string;
  riskText?: string;
}

export function SafeScoreCard({
  score = 84,
  address = "דיזנגוף 142, תל אביב-יפו",
  cadastral = "גוש 6902 · חלקה 44 · תת-חלקה 12",
  askingPrice = "3,450,000 ₪",
  riskText = "רמת תקינות גבוהה — נמצאו 2 דגשים לבירור תכנוני",
}: SafeScoreCardProps) {
  // Determine color theme based on score threshold
  const isHigh = score >= 80;
  const isMedium = score >= 60 && score < 80;
  
  const strokeColor = isHigh ? "#00C896" : isMedium ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-navy-900 rounded-2xl border border-white/10 relative overflow-hidden mb-8 shadow-2xl">
      <div className="p-8 sm:p-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10 relative z-10">
        
        {/* Left / Main Info */}
        <div className="flex-1 space-y-6 text-center lg:text-right">
          <div className="space-y-2">
            <div className="w-8 h-[1px] bg-teal-500 mx-auto lg:mx-0"></div>
            <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold flex items-center justify-center lg:justify-start gap-2">
              <ShieldCheck size={16} />
              דוח בדיקת נאותות רשמי
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl text-white font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {address}
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-slate-200 font-medium tracking-wide">
              <MapPin size={16} className="text-teal-400 shrink-0" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200 font-medium tracking-wide">
              <Layers size={16} className="text-teal-400 shrink-0" />
              <span className="dir-ltr">{cadastral}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-200 font-medium tracking-wide">
              <Tag size={16} className="text-teal-400 shrink-0" />
              <span className="text-white font-bold">{askingPrice}</span>
            </div>
          </div>
        </div>

        {/* Visual SafeScore Gauge */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Ring Gauge */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-800"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke={strokeColor}
                strokeWidth="6"
                strokeDasharray={276}
                strokeDashoffset={276 - (276 * score) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>

            {/* Score Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl text-white font-bold leading-none" style={{ fontFamily: "var(--font-serif)" }}>
                {score}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 mt-1">
                / 100
              </span>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mt-0.5">
                SafeScore
              </span>
            </div>
          </div>

          {/* Risk Level Marker */}
          <div className="mt-4 text-center">
            <p className="text-xs font-bold tracking-wide text-slate-200 max-w-[220px] leading-relaxed bg-white/5 py-1.5 px-3 rounded-full border border-white/10">
              {riskText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
