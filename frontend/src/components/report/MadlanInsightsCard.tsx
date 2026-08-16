"use client";

import { MapPin, TrendingUp, GraduationCap, Volume2, Bus, Sparkles, CheckCircle2 } from "lucide-react";
import type { MadlanInsights } from "@/types/property";

interface MadlanInsightsProps {
  insights?: MadlanInsights;
}

const DEFAULT_INSIGHTS: MadlanInsights = {
  overallScore: 8.6,
  neighborhoodName: "מרכז העיר / הדרים",
  priceTrend5Years: "+18.4% ב-5 שנים אחרונות",
  demandIndex: "high",
  demandLabel: "ביקוש גבוה מאוד (34 ימים ממוצע על המדף)",
  avgDaysOnMarket: 34,
  estimatedMonthlyRent: 7200,
  estimatedYieldPercent: 3.1,
  ratings: {
    schools: 8.8,
    quietness: 8.4,
    accessibility: 8.5,
    renewalPotential: 9.0,
  },
  highlights: [
    "שכונה מבוקשת בעלת מדד חברתי-כלכלי גבוה (אשכול 8)",
    "קרבה לבתי ספר מובילים וגני ילדים במרחק הליכה",
    "פוטנציאל השבחה גבוה עקב תוכניות התחדשות עירונית בסביבה",
    "נגישות קלה לציר עורקי ותחבורה ציבורית מרכזית",
  ],
};

export function MadlanInsightsCard({ insights = DEFAULT_INSIGHTS }: MadlanInsightsProps) {
  const {
    overallScore,
    neighborhoodName,
    priceTrend5Years,
    demandLabel,
    estimatedMonthlyRent,
    estimatedYieldPercent,
    ratings,
    highlights,
  } = insights;

  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <MapPin size={18} />
          </div>
          <div>
            <h3
              className="text-lg font-bold text-white flex items-center gap-2"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <span>מדד סביבתי ותובנות השכונה</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {neighborhoodName} · ניתוח סביבתי ונתוני שוק ממשלתיים
            </p>
          </div>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30 px-3.5 py-1.5 rounded-xl">
          <span className="text-xs text-slate-300 font-medium">ציון שכונה:</span>
          <span className="text-lg font-bold text-teal-400 font-serif">{overallScore}</span>
          <span className="text-xs text-slate-400 font-mono">/10</span>
        </div>
      </div>

      {/* Sub-Ratings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "חינוך ובתי ספר", score: ratings.schools, Icon: GraduationCap },
          { label: "שקט ואיכות חיים", score: ratings.quietness, Icon: Volume2 },
          { label: "תחבורה ונגישות", score: ratings.accessibility, Icon: Bus },
          { label: "פוטנציאל התחדשות", score: ratings.renewalPotential, Icon: Sparkles },
        ].map(({ label, score: subScore, Icon }) => (
          <div
            key={label}
            className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between text-slate-400">
              <Icon size={16} className="text-teal-400" />
              <span className="text-xs font-bold text-white font-serif">{subScore}/10</span>
            </div>
            <span className="text-xs font-medium text-slate-300">{label}</span>
          </div>
        ))}
      </div>

      {/* Key Market Indicators Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 block font-medium">
            מגמת מחירים בשכונה
          </span>
          <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 font-serif">
            <TrendingUp size={16} />
            <span>{priceTrend5Years}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 block font-medium">
            מדד ביקוש וימי מדף
          </span>
          <p className="text-sm font-bold text-white tracking-wide">
            {demandLabel}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
          <span className="text-[11px] uppercase tracking-widest text-slate-400 block font-medium">
            שכירות ותשואה משוערת
          </span>
          <p className="text-sm font-bold text-teal-400 font-serif">
            ₪{estimatedMonthlyRent.toLocaleString("he-IL")} / חודש ({estimatedYieldPercent}% תשואה)
          </p>
        </div>
      </div>

      {/* Highlights Checklist */}
      <div className="space-y-2.5 pt-2 border-t border-white/5">
        <h4 className="text-xs uppercase font-mono tracking-widest text-slate-400 font-bold">
          דגשי סביבה ושכונה מנצחים:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
              <CheckCircle2 size={15} className="text-teal-400 shrink-0 mt-0.5" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
