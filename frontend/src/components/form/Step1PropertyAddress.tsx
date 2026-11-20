"use client";

import { Plus, Trash2, UserRound } from "lucide-react";
import type { DealType, SellerDetails, Step2PropertyId } from "@/types/property";
import { Step2Address } from "./Step2Address";

interface Props {
  address: Step2PropertyId;
  sellers: SellerDetails[];
  dealType?: DealType | "";
  onAddressChange: (address: Step2PropertyId) => void;
  onSellersChange: (sellers: SellerDetails[]) => void;
  showErrors: boolean;
}

export function Step1PropertyAddress({ address, sellers, dealType, onAddressChange, onSellersChange, showErrors }: Props) {
  const isDeveloper = dealType === "developer" || dealType === "new-developer";
  const updateSeller = (index: number, field: keyof SellerDetails, value: string) => {
    onSellersChange(sellers.map((seller, i) => i === index ? { ...seller, [field]: value } : seller));
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-fade-in-up">
      <div className="text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
        <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">שלב 02</span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          {isDeveloper ? "כתובת הפרויקט ופרטי היזם / הקבלן" : "כתובת הנכס ופרטי המוכר"}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm">נאתר את פרטי הנכס ונכין את בדיקת הרקע המשפטית והחובות.</p>
      </div>

      <Step2Address data={address} onChange={onAddressChange} showErrors={showErrors} hideHeading />

      <section className="p-4 sm:p-6 rounded-2xl border border-teal-500/20 bg-teal-500/[0.02] space-y-4 sm:space-y-6" aria-labelledby="seller-details-title">
        <div className="flex items-center gap-2 border-b border-teal-500/10 pb-3">
          <UserRound className="text-teal-400" size={17} />
          <div>
            <h3 id="seller-details-title" className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>בדיקת רקע משפטית וחובות</h3>
            <p className="text-xs text-slate-400 mt-1">
              {isDeveloper ? "פרטי היזם או החברה הקבלנית עוזרים לנו לאמת סטטוס תאגידי ברשם החברות." : "פרטי בעל הנכס עוזרים לנו לבצע את הבדיקה."}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {sellers.map((seller, index) => (
            <div key={index} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300 font-medium">
                  {isDeveloper
                    ? (sellers.length > 1 ? `יזם / קבלן ${index + 1}` : "פרטי היזם / קבלן")
                    : (sellers.length > 1 ? `בעלים ${index + 1}` : "פרטי המוכר")}
                </p>
                {sellers.length > 1 && (
                  <button type="button" onClick={() => onSellersChange(sellers.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-300">
                    <Trash2 size={14} /> הסרה
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor={`seller-name-${index}`} className="block text-xs text-slate-300">
                    {isDeveloper ? "שם היזם / קבלן *" : "שם מלא של המוכר *"}
                  </label>
                  <input id={`seller-name-${index}`} type="text" value={seller.name}
                    onChange={(e) => updateSeller(index, "name", e.target.value)}
                    placeholder={isDeveloper ? "לדוגמה: אאורה השקעות בע״מ" : "לדוגמה: ישראל ישראלי"}
                    className="w-full bg-transparent border-b border-white/[0.15] py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896]" />
                  {showErrors && !seller.name.trim() && (
                    <p className="text-xs text-red-400">
                      {isDeveloper ? "יש להזין שם יזם או קבלן" : "יש להזין שם של בעל הנכס"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor={`seller-id-${index}`} className="flex items-center gap-2 text-xs text-slate-300">
                    {isDeveloper ? "מספר חברה / ח.פ." : "תעודת זהות"}{" "}
                    <span className="text-[10px] text-[#00C896] border border-[#00C896]/30 bg-[#00C896]/5 px-1.5 py-0.5 rounded">אימות רשמי</span>
                  </label>
                  <input id={`seller-id-${index}`} type="text" inputMode="numeric" value={seller.idNumber}
                    onChange={(e) => updateSeller(index, "idNumber", e.target.value)}
                    placeholder={isDeveloper ? "לדוגמה: 514231234" : "לדוגמה: 012345678"}
                    className="w-full bg-transparent border-b border-white/[0.15] py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896]" />
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400 leading-relaxed">
            {isDeveloper
              ? "אנחנו יודעים לאתר את מספר הח.פ., אך אם יש בידיכם מומלץ למלא לזירוז האימות."
              : "אנחנו יודעים לאתר את תעודות הזהות, אך אם יש בידיכם מומלץ למלא."}
          </p>
          <button type="button" onClick={() => onSellersChange([...sellers, { name: "", idNumber: "" }])}
            className="inline-flex items-center gap-2 text-sm text-[#00C896] hover:text-white transition-colors">
            <Plus size={16} /> {isDeveloper ? "הוספת חברה / קבלן נוסף" : "הוספת בעלים נוסף"}
          </button>
        </div>
      </section>
    </div>
  );
}
