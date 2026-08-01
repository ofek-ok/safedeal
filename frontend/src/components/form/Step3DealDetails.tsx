"use client";

import { TrendingUp, AlertCircle } from "lucide-react";
import type { Step3DealDetails, DealType } from "@/types/property";
import { DEAL_TYPE_LABELS, ROOMS_OPTIONS } from "@/types/property";
import { formatThousands, stripFormatting, calcYield } from "@/lib/utils";

interface Props {
  data: Step3DealDetails;
  onChange: (d: Step3DealDetails) => void;
  showErrors: boolean;
}

const AMENITIES: { key: keyof Pick<Step3DealDetails, "hasParking" | "hasStorage" | "hasMamad" | "hasElevator">; label: string; icon: string }[] = [
  { key: "hasParking",  label: "חניה צמודה",    icon: "🚗" },
  { key: "hasStorage",  label: "מחסן צמוד",      icon: "📦" },
  { key: "hasMamad",    label: 'ממ"ד',            icon: "🛡️" },
  { key: "hasElevator", label: "מעלית",           icon: "🔼" },
];

export function Step3DealDetails({ data, onChange, showErrors }: Props) {
  const set = <K extends keyof Step3DealDetails>(k: K, v: Step3DealDetails[K]) =>
    onChange({ ...data, [k]: v });

  const handlePrice = (raw: string) => set("askingPrice", formatThousands(stripFormatting(raw)));
  const handleRent  = (raw: string) => set("monthlyRent",  formatThousands(stripFormatting(raw)));

  const yieldPct = calcYield(data.askingPrice, data.monthlyRent);

  const errors = showErrors
    ? {
        dealType:     !data.dealType       ? "יש לבחור סוג עסקה"  : undefined,
        askingPrice:  !data.askingPrice    ? "מחיר הוא שדה חובה"  : undefined,
        propertyArea: !data.propertyArea   ? "שטח הוא שדה חובה"   : undefined,
        roomsCount:   !data.roomsCount     ? "יש לבחור מס׳ חדרים" : undefined,
        floorNumber:  !data.floorNumber    ? "קומה היא שדה חובה"  : undefined,
      }
    : {};

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* Editorial Header */}
      <div className="mb-8">
        <div className="w-8 h-[1px] bg-teal-500 mb-4" />
        <p className="text-[11px] tracking-[0.2em] text-teal-400 uppercase font-medium mb-2">שלב 3</p>
        <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>פרטי העסקה</h2>
        <p className="text-sm text-slate-400">פרטים אלה יאפשרו ניתוח שוק, תשואה והשוואת מחיר</p>
      </div>

      <div className="space-y-10">
        {/* Deal type */}
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">סוג עסקה *</p>
          <div className="flex gap-4">
            {(["second-hand", "developer"] as DealType[]).map((val) => {
              const active = data.dealType === val;
              return (
                <label
                  key={val}
                  htmlFor={`deal-${val}`}
                  className={`flex-1 flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                    active ? "border-[#00C896] bg-[#00C896]/5" : "border-white/[0.08] bg-transparent hover:border-white/[0.2]"
                  }`}
                >
                  <input
                    id={`deal-${val}`}
                    type="radio"
                    name="dealType"
                    value={val}
                    checked={active}
                    onChange={() => set("dealType", val)}
                    className="sr-only"
                  />
                  <span className={`text-sm tracking-wider ${active ? "text-white font-medium" : "text-slate-400"}`}>
                    {DEAL_TYPE_LABELS[val]}
                  </span>
                  <div className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                    active ? "border-[3px] border-[#00C896] bg-transparent" : "border-slate-600 bg-transparent"
                  }`} />
                </label>
              );
            })}
          </div>
          {errors.dealType && (
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400">
              <AlertCircle size={12} /> {errors.dealType}
            </p>
          )}
        </div>

        {/* Price + Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label htmlFor="askingPrice" className="block text-[11px] uppercase tracking-widest text-slate-400 font-medium">מחיר מבוקש *</label>
            <div className="relative">
              <input
                id="askingPrice"
                type="text"
                inputMode="numeric"
                value={data.askingPrice}
                onChange={(e) => handlePrice(e.target.value)}
                placeholder="2,500,000"
                className="w-full bg-transparent border-b border-white/[0.15] py-3 pr-12 pl-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
                style={{ ...(errors.askingPrice ? { borderColor: "rgba(248,113,113,0.6)" } : {}) }}
              />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-lg text-[#00C896]">₪</span>
            </div>
            {errors.askingPrice && (
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400">
                <AlertCircle size={12} /> {errors.askingPrice}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label htmlFor="propertyArea" className="block text-[11px] uppercase tracking-widest text-slate-400 font-medium">שטח הדירה *</label>
            <div className="relative">
              <input
                id="propertyArea"
                type="number"
                min={10}
                max={1000}
                value={data.propertyArea}
                onChange={(e) => set("propertyArea", e.target.value)}
                placeholder="85"
                className="w-full bg-transparent border-b border-white/[0.15] py-3 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
                style={{ ...(errors.propertyArea ? { borderColor: "rgba(248,113,113,0.6)" } : {}) }}
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 text-[11px] uppercase tracking-widest">מ״ר</span>
            </div>
            {errors.propertyArea && (
              <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400">
                <AlertCircle size={12} /> {errors.propertyArea}
              </p>
            )}
          </div>
        </div>

        {/* Rooms selector */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
            מספר חדרים * 
            <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">כולל חצאי חדרים</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {ROOMS_OPTIONS.map((r) => {
              const active = data.roomsCount === r;
              return (
                <button
                  key={r}
                  type="button"
                  id={`rooms-${r}`}
                  onClick={() => set("roomsCount", r)}
                  className={`px-4 py-2 text-sm transition-all duration-300 border-b-2 ${
                    active 
                      ? "border-[#00C896] text-[#00C896] bg-[#00C896]/5" 
                      : "border-white/[0.08] text-slate-500 hover:border-white/[0.2] hover:text-slate-300"
                  }`}
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {errors.roomsCount && (
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400">
              <AlertCircle size={12} /> {errors.roomsCount}
            </p>
          )}
        </div>

        {/* Floor */}
        <div className="space-y-3">
          <label htmlFor="floorNumber" className="block text-[11px] uppercase tracking-widest text-slate-400 font-medium">קומה *</label>
          <input
            id="floorNumber"
            type="number"
            min={0}
            max={80}
            value={data.floorNumber}
            onChange={(e) => set("floorNumber", e.target.value)}
            placeholder="4"
            className="w-32 bg-transparent border-b border-white/[0.15] py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
            style={{ ...(errors.floorNumber ? { borderColor: "rgba(248,113,113,0.6)" } : {}) }}
          />
          {errors.floorNumber && (
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400">
              <AlertCircle size={12} /> {errors.floorNumber}
            </p>
          )}
        </div>

        {/* Amenities */}
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">תוספות ואביזרים</p>
          <div className="grid grid-cols-2 gap-4">
            {AMENITIES.map(({ key, label, icon }) => {
              const checked = data[key];
              return (
                <label
                  key={key}
                  htmlFor={key}
                  className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-300 ${
                    checked ? "border-[#00C896]/50 bg-[#00C896]/5" : "border-white/[0.06] bg-transparent hover:border-white/[0.15]"
                  }`}
                >
                  <input id={key} type="checkbox" checked={checked} onChange={(e) => set(key, e.target.checked as never)} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80">{icon}</span>
                    <span className={`text-[11px] uppercase tracking-widest ${checked ? "text-white" : "text-slate-400"}`}>{label}</span>
                  </div>
                  <div className={`w-3 h-3 border transition-all duration-300 flex items-center justify-center ${
                    checked ? "border-[#00C896] bg-[#00C896]" : "border-slate-600 bg-transparent"
                  }`}>
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#060E1C" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Monthly rent */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06]">
          <label htmlFor="monthlyRent" className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
            שכר דירה חודשי
            <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">לחישוב תשואה — אופציונלי</span>
          </label>
          <div className="relative max-w-xs">
            <input
              id="monthlyRent"
              type="text"
              inputMode="numeric"
              value={data.monthlyRent}
              onChange={(e) => handleRent(e.target.value)}
              placeholder="7,500"
              className="w-full bg-transparent border-b border-white/[0.15] py-3 pr-12 pl-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
            />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-lg text-[#00C896]">₪</span>
          </div>
          {yieldPct && (
            <div className="inline-flex items-center gap-3 mt-4 border-b border-[#00C896]/30 pb-2">
              <TrendingUp size={14} className="text-[#00C896]" />
              <span className="text-[10px] uppercase tracking-widest text-slate-400">תשואה גולמית:</span>
              <span className="text-lg text-[#00C896] font-serif">{yieldPct}% לשנה</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
