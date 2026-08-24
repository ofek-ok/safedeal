"use client";

import { ShieldCheck, Lock } from "lucide-react";
import type { WizardFormData } from "@/types/property";
import { DEAL_TYPE_LABELS } from "@/types/property";

interface Props {
  data: WizardFormData;
  isSubmitting: boolean;
  onSubmit: () => void;
  onChange: (d: WizardFormData) => void;
}

export function Step4Checkout({ data, isSubmitting, onSubmit, onChange }: Props) {
  const addressString = [data.step2.street, data.step2.houseNumber, data.step2.city]
    .filter(Boolean)
    .join(" ");

  const propertyType = data.step3.dealType ? DEAL_TYPE_LABELS[data.step3.dealType] : "";
  const askingPrice = data.step3.askingPrice;
  const rooms = data.step3.roomsCount;

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="mb-4 sm:mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
        <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">
          שלב 04
        </span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          סיכום הזמנה ותשלום
        </h2>
      </div>

      {/* Summary Card */}
      <div className="border border-white/[0.08] bg-white/[0.01] rounded-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
        <div className="space-y-1">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500">כתובת הנכס</p>
          <p className="text-base sm:text-lg text-white" style={{ fontFamily: "var(--font-serif)" }}>
            {addressString || "לא הוזן"}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t border-white/[0.06]">
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500">סוג נכס</p>
            <p className="text-xs sm:text-sm text-slate-200">{propertyType || "-"}</p>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500">חדרים</p>
            <p className="text-xs sm:text-sm text-slate-200">{rooms || "-"}</p>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500">מחיר מבוקש</p>
            <p className="text-xs sm:text-sm text-slate-200">{askingPrice ? `₪${askingPrice}` : "-"}</p>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="text-center py-2 sm:py-6">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1 sm:mb-2">מחיר הדוח</p>
        <p className="text-3xl sm:text-5xl font-bold text-[#00C896] mb-1 sm:mb-2" style={{ fontFamily: "var(--font-serif)" }}>₪230</p>
        <p className="text-[11px] sm:text-xs text-slate-500">כולל מע״מ</p>
      </div>

      {/* Terms */}
      <label
        htmlFor="agreeToTermsCheckout"
        className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl cursor-pointer transition-all duration-300 border border-white/[0.06] hover:border-white/[0.15] bg-white/[0.01]"
      >
        <div className="relative mt-0.5 shrink-0">
          <input
            id="agreeToTermsCheckout"
            type="checkbox"
            checked={data.step1.agreeToTerms}
            onChange={(e) => {
              onChange({ ...data, step1: { ...data.step1, agreeToTerms: e.target.checked } });
            }}
            className="sr-only"
          />
          <div
            className="w-4 h-4 rounded-sm border transition-all duration-300 flex items-center justify-center"
            style={{
              borderColor: data.step1.agreeToTerms ? "#00C896" : "rgba(255,255,255,0.2)",
              backgroundColor: data.step1.agreeToTerms ? "#00C896" : "transparent"
            }}
          >
            {data.step1.agreeToTerms && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#060E1C" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
            אני מאשר/ת את{" "}
            <span className="text-[#00C896] hover:text-[#00C896]/80 underline underline-offset-4 transition-colors">
              תנאי השימוש ומדיניות הפרטיות
            </span>{" "}
            של SafeDeal
          </p>
        </div>
      </label>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting || !data.step1.agreeToTerms}
        className="w-full py-3.5 sm:py-4 px-6 flex items-center justify-center gap-3 bg-[#00C896] hover:bg-[#00C896]/90 text-navy-950 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base sm:text-lg"
      >
        {isSubmitting ? "מעבד תשלום..." : <>{"מעבר לתשלום מאובטח"} <Lock size={16} /></>}
      </button>

      {/* Security note */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest text-center">
        <ShieldCheck size={13} className="text-[#00C896] shrink-0" />
        <span>SafeDeal — מוצפן מקצה לקצה · הנתונים שלכם לא ישותפו עם צד שלישי</span>
      </div>
    </div>
  );
}
