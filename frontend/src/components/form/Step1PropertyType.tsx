"use client";

import type { DealType } from "@/types/property";

interface Props {
  data: { dealType: DealType | "" };
  onChange: (dealType: DealType) => void;
  onAutoAdvance: () => void;
}

export function Step1PropertyType({ data, onChange, onAutoAdvance }: Props) {
  const handleSelect = (dealType: DealType) => {
    onChange(dealType);
    onAutoAdvance();
  };

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-4"></div>
        <span className="text-[#00C896] text-[10px] font-bold uppercase tracking-widest mb-3 block">
          שלב 01
        </span>
        <h2 className="text-2xl font-normal text-white mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          בחרו סוג נכס
        </h2>
        <p className="text-slate-400 text-sm tracking-wider">
          מה מעניין אתכם לבדוק?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => handleSelect("second-hand")}
          className={`flex flex-col items-center justify-center gap-6 p-8 rounded-xl border transition-all duration-300 text-center ${
            data.dealType === "second-hand"
              ? "border-[#00C896]/50 bg-[#00C896]/10"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <span className="text-5xl opacity-80 mb-2">🏠</span>
          <div>
            <h3 className={`text-xl mb-3 ${data.dealType === "second-hand" ? "text-white" : "text-slate-200"}`} style={{ fontFamily: "var(--font-serif)" }}>דירה יד שנייה</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[200px] mx-auto">בדיקת הנכס, הרישומים, המוכר, העסקאות באזור והסביבה.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("developer")}
          className={`flex flex-col items-center justify-center gap-6 p-8 rounded-xl border transition-all duration-300 text-center ${
            data.dealType === "developer"
              ? "border-[#00C896]/50 bg-[#00C896]/10"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
          }`}
        >
          <span className="text-5xl opacity-80 mb-2">🏗️</span>
          <div>
            <h3 className={`text-xl mb-3 ${data.dealType === "developer" ? "text-white" : "text-slate-200"}`} style={{ fontFamily: "var(--font-serif)" }}>דירה חדשה מקבלן</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[200px] mx-auto">בדיקת הפרויקט, הקבלן, המפרט, התוכניות והסביבה.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
