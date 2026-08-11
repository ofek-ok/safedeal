"use client";

import {
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import type { WizardFormData } from "@/types/property";
import {
  USER_PURPOSE_LABELS,
  DEAL_TYPE_LABELS,
} from "@/types/property";
import { calcYield } from "@/lib/utils";

interface Props {
  data: WizardFormData;
  isSubmitting: boolean;
  onSubmit: () => void;
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-8 border-b border-white/[0.06] last:border-0">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-4 h-[1px] bg-[#00C896]"></div>
        <h3 className="text-lg text-white font-normal" style={{ fontFamily: "var(--font-serif)" }}>
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        {children}
      </div>
    </div>
  );
}

function ReportRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className={`text-sm tracking-wider ${highlight ? "text-[#00C896] font-serif text-base" : "text-slate-200"}`}>
        {value}
      </span>
    </div>
  );
}

export function Step5Summary({ data, isSubmitting, onSubmit }: Props) {
  const { step1, step2, step3, step4 } = data;

  const amenities = [
    step3.hasParking  && "חניה צמודה",
    step3.hasStorage  && "מחסן צמוד",
    step3.hasMamad    && 'ממ"ד',
    step3.hasElevator && "מעלית",
  ]
    .filter(Boolean)
    .join(" · ") || "אין תוספות מצוינות";

  const yieldPct = calcYield(step3.askingPrice, step3.monthlyRent);
  const dealTypeLabel = step3.dealType ? DEAL_TYPE_LABELS[step3.dealType] : "לא צוין";
  const purposeLabel  = step1.purpose  ? USER_PURPOSE_LABELS[step1.purpose] : "לא צוין";
  const fullAddress = [step2.street, step2.houseNumber, step2.city].filter(Boolean).join(" ") || "כתובת לא הוזנה";

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Official Web Document Header / Report Box */}
      <div className="border border-white/[0.08] bg-white/[0.01] rounded-xl overflow-hidden p-8">
        {/* Document Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck size={16} className="text-[#00C896]" />
              <span className="text-[10px] uppercase tracking-widest text-[#00C896]">
                סיכום נתוני בדיקה מוקדמת
              </span>
            </div>
            <h2 className="text-3xl text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
              דוח בדיקת נאותות לנכס
            </h2>
            <p className="text-xs text-slate-400 tracking-wider mt-4">
              נכס: <span className="text-slate-200">{fullAddress}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-[9px] uppercase tracking-widest text-[#00C896] border border-[#00C896]/30 px-3 py-1.5 rounded">
              מוכן להפקה מיידית
            </span>
            <span className="text-[9px] uppercase tracking-widest text-slate-600 font-mono">
              REF: SD-PREVIEW
            </span>
          </div>
        </div>

        {/* Highlight Stats Bar */}
        {(step3.askingPrice || yieldPct) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-8 border-b border-white/[0.06]">
            {step3.askingPrice && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">
                  מחיר מבוקש
                </span>
                <span className="text-xl md:text-2xl text-white font-serif">
                  ₪{step3.askingPrice}
                </span>
              </div>
            )}
            {step3.propertyArea && (
              <div>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">
                  שטח הנכס
                </span>
                <span className="text-xl md:text-2xl text-white font-serif">
                  {step3.propertyArea} מ״ר
                </span>
              </div>
            )}
            {yieldPct ? (
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">
                  תשואה גולמית משוערת
                </span>
                <span className="text-xl md:text-2xl text-[#00C896] font-serif">
                  {yieldPct}%
                </span>
              </div>
            ) : (
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">
                  חדרים / קומה
                </span>
                <span className="text-xl md:text-2xl text-white font-serif">
                  {step3.roomsCount ? `${step3.roomsCount} ח׳` : "—"} / קומה {step3.floorNumber || "—"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Document Body Sections */}
        <div className="py-4">
          <ReportSection title="פרטי מגיש הבקשה">
            <ReportRow label="שם מלא" value={step1.fullName || "לא הוזן"} />
            <ReportRow label='דוא"ל' value={step1.email || "לא הוזן"} />
            <ReportRow label="טלפון" value={step1.phone || "לא הוזן"} />
            <ReportRow label="מטרת הרכישה" value={purposeLabel} />
          </ReportSection>

          <ReportSection title="מיקום וזיהוי קדסטרלי">
            <ReportRow label="עיר / יישוב" value={step2.city || "לא הוזנה"} />
            <ReportRow label="רחוב ומספר" value={[step2.street, step2.houseNumber].filter(Boolean).join(" ") || "לא הוזן"} />
            <ReportRow label="גוש / חלקה / תת-חלקה" value={[step2.block && `גוש ${step2.block}`, step2.parcel && `חלקה ${step2.parcel}`, step2.subParcel && `תת-חלקה ${step2.subParcel}`].filter(Boolean).join(" · ") || "איתור אוטומטי בהפקה"} />
          </ReportSection>

          <ReportSection title="מפרט הנכס והעסקה">
            <ReportRow label="סוג עסקה" value={dealTypeLabel} />
            <ReportRow label="מפרט פיזי" value={[step3.roomsCount && `${step3.roomsCount} חדרים`, step3.propertyArea && `${step3.propertyArea} מ״ר`, step3.floorNumber && `קומה ${step3.floorNumber}`].filter(Boolean).join(" · ") || "לא הוזן"} />
            <ReportRow label="מאפיינים ותוספות" value={amenities} />
            {step3.monthlyRent && (
              <ReportRow label="שכר דירה משוער" value={`₪${step3.monthlyRent} בחודש`} />
            )}
          </ReportSection>

          <ReportSection title="מסמכים מצורפים">
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.04]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500">נסח טאבו</span>
                  <span className="text-sm tracking-wider text-slate-200">{step4.tabuFile ? step4.tabuFile.name : "לא צורף"}</span>
                </div>
                <span className={`text-[9px] uppercase tracking-widest px-2 py-1 rounded border ${step4.tabuFile ? "border-[#00C896]/30 text-[#00C896]" : "border-slate-700 text-slate-400"}`}>
                  {step4.tabuFile ? "מאומת" : "בדיקה לפי כתובת בלבד"}
                </span>
              </div>
              {step4.buildingFile && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">תיק בניין</span>
                    <span className="text-sm tracking-wider text-slate-200">{step4.buildingFile.name}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest px-2 py-1 rounded border border-[#00C896]/30 text-[#00C896]">
                    צורף
                  </span>
                </div>
              )}
            </div>
          </ReportSection>
        </div>

        {/* Official Disclaimer Footer */}
        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 leading-relaxed text-center">
            מסמך סיכום זה מיועד לבחינה ראשונית בלבד. הדוח המלא שיופק יכלול שילוב נתונים מ-8 מאגרים רשמיים, ניתוח חריגות בנייה וציון Safe Score משוקלל.
          </p>
        </div>
      </div>

      {/* Submit Action CTA */}
      <button
        type="button"
        id="submit-analysis"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-5 border border-[#00C896] bg-[#00C896]/10 hover:bg-[#00C896]/20 text-[#00C896] transition-all duration-300 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin text-[#00C896] block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
            מפיק דוח מלא...
          </>
        ) : (
          <>
            <TrendingUp size={16} />
            הפק דוח SafeDeal מלא
          </>
        )}
      </button>
    </div>
  );
}
