"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { User, Mail, Phone, TrendingUp, AlertCircle, Upload, FileText, X, Info, Car, Package, Shield, ArrowUp, Sun, Building2, Accessibility, ChevronDown, Check, Dumbbell, Users, Sparkles, Warehouse } from "lucide-react";
import type { WizardFormData, Step3DealDetails, PropertyCondition } from "@/types/property";
import { ROOMS_OPTIONS, PROPERTY_CONDITION_LABELS } from "@/types/property";
import { formatThousands, stripFormatting, calcYield, formatBytes, isValidEmail } from "@/lib/utils";

interface Props {
  data: WizardFormData;
  onChange: (d: WizardFormData) => void;
  showErrors: boolean;
}

const AMENITIES: { key: keyof Pick<Step3DealDetails, "hasUndergroundParking" | "hasAbovegroundParking" | "hasStorage" | "hasMamad" | "hasElevator" | "hasBalcony" | "hasGym" | "hasResidentsLounge" | "hasRooftop" | "isBuildingOnPillars" | "hasAccessibility">; label: string; Icon: React.ElementType }[] = [
  { key: "hasUndergroundParking", label: "חניון תת קרקעי", Icon: Warehouse },
  { key: "hasAbovegroundParking", label: "חניון עליון",     Icon: Car },
  { key: "hasMamad",              label: 'ממ"ד',           Icon: Shield },
  { key: "hasStorage",            label: "מחסן צמוד",     Icon: Package },
  { key: "hasElevator",           label: "מעלית",          Icon: ArrowUp },
  { key: "hasBalcony",            label: "מרפסת",          Icon: Sun },
  { key: "hasGym",                label: "חדר כושר",       Icon: Dumbbell },
  { key: "hasResidentsLounge",    label: "חדר דיירים",     Icon: Users },
  { key: "hasRooftop",            label: "גג דיירים",      Icon: Sparkles },
  { key: "isBuildingOnPillars",   label: "בניין על עמודים", Icon: Building2 },
  { key: "hasAccessibility",      label: "גישה לנכים",     Icon: Accessibility },
];

function FileCard({
  file,
  tag,
  onRemove,
}: {
  file: File;
  tag?: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="w-10 h-10 rounded border border-white/[0.1] flex items-center justify-center shrink-0 bg-white/[0.01]">
        <FileText size={16} className="text-[#00C896]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate tracking-wider">{file.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{formatBytes(file.size)}</p>
      </div>
      {tag && (
        <span className="shrink-0 text-[9px] uppercase tracking-widest text-[#00C896] border border-[#00C896]/30 px-2 py-1 rounded">
          {tag}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center shrink-0 text-slate-500 hover:text-red-400 transition-colors"
        aria-label="הסר קובץ"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Dropzone({
  id,
  label,
  sublabel,
  accept,
  file,
  onSelect,
  onRemove,
  tag,
  required,
}: {
  id: string;
  label: string;
  sublabel: string;
  accept: string;
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
  tag?: string;
  required?: boolean;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) onSelect(f);
    },
    [onSelect]
  );

  if (file) {
    return <FileCard file={file} tag={tag} onRemove={onRemove} />;
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="block cursor-pointer p-8 border border-dashed border-white/[0.15] rounded-xl hover:border-[#00C896]/50 hover:bg-[#00C896]/5 transition-all duration-300"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Upload size={20} className="text-[#00C896] mb-2 opacity-80" />
        <div>
          <p className="text-white text-sm tracking-wider mb-2">{label}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">{sublabel}</p>
        </div>
        {required && (
          <span className="text-[9px] uppercase tracking-widest text-[#00C896] border border-[#00C896]/30 px-2 py-1 rounded mt-2">
            נדרש לדוח מלא
          </span>
        )}
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function IconInput({
  id,
  icon: Icon,
  type = "text",
  inputMode,
  placeholder,
  value,
  onChange,
  hasError,
}: {
  id: string;
  icon: React.ElementType;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
        style={{ color: hasError ? "#f87171" : "#64748b" }}
      >
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b border-white/[0.15] py-3 pr-12 pl-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
        style={hasError ? { borderColor: "rgba(248,113,113,0.6)" } : undefined}
        dir="rtl"
      />
    </div>
  );
}

export function Step3Details({ data, onChange, showErrors }: Props) {
  const [isRoomsOpen, setIsRoomsOpen] = useState(false);
  const roomsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roomsRef.current && !roomsRef.current.contains(event.target as Node)) {
        setIsRoomsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setStep3 = <K extends keyof WizardFormData["step3"]>(k: K, v: WizardFormData["step3"][K]) =>
    onChange({ ...data, step3: { ...data.step3, [k]: v } });

  const setStep4 = <K extends keyof WizardFormData["step4"]>(k: K, v: WizardFormData["step4"][K]) =>
    onChange({ ...data, step4: { ...data.step4, [k]: v } });

  const setStep1 = <K extends keyof WizardFormData["step1"]>(k: K, v: WizardFormData["step1"][K]) =>
    onChange({ ...data, step1: { ...data.step1, [k]: v } });

  const handlePrice = (raw: string) => setStep3("askingPrice", formatThousands(stripFormatting(raw)));
  const handleRent  = (raw: string) => setStep3("monthlyRent",  formatThousands(stripFormatting(raw)));

  const yieldPct = calcYield(data.step3.askingPrice, data.step3.monthlyRent);

  const errors = showErrors
    ? {
        askingPrice:  !data.step3.askingPrice    ? "מחיר הוא שדה חובה"  : undefined,
        propertyArea: !data.step3.propertyArea   ? "שטח הוא שדה חובה"   : undefined,
        roomsCount:   !data.step3.roomsCount     ? "יש לבחור מס׳ חדרים" : undefined,
        floorNumber:  !data.step3.floorNumber    ? "קומה היא שדה חובה"  : undefined,
        fullName:     !data.step1.fullName.trim() ? "שם מלא הוא שדה חובה" : undefined,
        email:        !data.step1.email.trim()    ? undefined : !isValidEmail(data.step1.email) ? "כתובת הדוא״ל אינה תקינה" : undefined,
      }
    : {};

  return (
    <div className="space-y-6 sm:space-y-12 animate-fade-in-up">
      {/* Editorial Header */}
      <div className="mb-4 sm:mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
        <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">
          שלב 03
        </span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          פרטי הנכס ויצירת קשר
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm tracking-wider">
          מלאו את הפרטים והעלו מסמכים אם יש
        </p>
      </div>

      <div className="space-y-6 sm:space-y-10">
        {/* Deal Details */}
        <div className="space-y-5 sm:space-y-10">
          {/* Property Condition - Hidden for new developer deals */}
          {data.step3.dealType !== "new-developer" && data.step3.dealType !== "developer" && (
            <div className="space-y-2.5 sm:space-y-4">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">מצב הנכס</p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(["preserved-like-new", "preserved", "needs-renovation"] as PropertyCondition[]).map((c) => {
                  const active = data.step3.condition === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStep3("condition", c)}
                      className={`px-2.5 py-2.5 sm:px-3 sm:py-3 rounded-xl border text-xs font-medium transition-all duration-300 ${
                        active
                          ? "border-[#00C896] text-[#00C896] bg-[#00C896]/10"
                          : "border-white/[0.08] text-slate-400 hover:border-white/[0.2] hover:text-white"
                      }`}
                    >
                      {PROPERTY_CONDITION_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price + Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <label htmlFor="askingPrice" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">מחיר מבוקש / מוצע *</label>
              <div className="relative">
                <input
                  id="askingPrice"
                  type="text"
                  inputMode="numeric"
                  value={data.step3.askingPrice}
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
                  value={data.step3.propertyArea}
                  onChange={(e) => setStep3("propertyArea", e.target.value)}
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

          {/* Rooms selector (Dropdown) */}
          <div className="space-y-3" ref={roomsRef}>
            <p className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
              מספר חדרים * 
              <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">כולל חצאי חדרים</span>
            </p>

            <div className="relative">
              <button
                type="button"
                id="rooms-dropdown-btn"
                onClick={() => setIsRoomsOpen(!isRoomsOpen)}
                className={`w-full flex items-center justify-between bg-transparent border-b py-3 px-1 text-right transition-colors duration-300 ${
                  errors.roomsCount
                    ? "border-red-400/60 text-red-300"
                    : isRoomsOpen
                    ? "border-[#00C896] text-white"
                    : "border-white/[0.15] text-white hover:border-white/[0.3]"
                }`}
              >
                <span className={`text-sm ${data.step3.roomsCount ? "text-white font-medium" : "text-slate-500"}`}>
                  {data.step3.roomsCount ? `${data.step3.roomsCount} חדרים` : "בחרו מספר חדרים מהרשימה..."}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-300 ${isRoomsOpen ? "rotate-180 text-[#00C896]" : ""}`}
                />
              </button>

              {isRoomsOpen && (
                <div className="absolute z-30 top-full mt-1.5 w-full bg-[#0A1628] border border-white/15 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden py-1.5 max-h-60 overflow-y-auto animate-fade-in-up">
                  {ROOMS_OPTIONS.map((r) => {
                    const isSelected = data.step3.roomsCount === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setStep3("roomsCount", r);
                          setIsRoomsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-right text-xs sm:text-sm transition-colors ${
                          isSelected
                            ? "bg-[#00C896]/15 text-[#00C896] font-bold"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <span style={{ fontFamily: "var(--font-serif)" }}>{r} חדרים</span>
                        {isSelected && <Check size={14} className="text-[#00C896]" />}
                      </button>
                    );
                  })}
                </div>
              )}
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
              value={data.step3.floorNumber}
              onChange={(e) => setStep3("floorNumber", e.target.value)}
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
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-medium">מאפיינים ותוספות בנכס</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {AMENITIES.map(({ key, label, Icon }) => {
                const checked = data.step3[key];
                return (
                  <label
                    key={key}
                    htmlFor={key}
                    className={`flex items-center justify-between p-3 sm:p-3.5 border rounded-xl cursor-pointer transition-all duration-300 ${
                      checked ? "border-[#00C896]/50 bg-[#00C896]/5" : "border-white/[0.06] bg-transparent hover:border-white/[0.15]"
                    }`}
                  >
                    <input id={key} type="checkbox" checked={checked as boolean} onChange={(e) => setStep3(key, e.target.checked as never)} className="sr-only" />
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={16} className={`shrink-0 ${checked ? "text-[#00C896]" : "text-slate-400"}`} />
                      <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider truncate ${checked ? "text-white" : "text-slate-400"}`}>{label}</span>
                    </div>
                    <div className={`w-3 h-3 border shrink-0 transition-all duration-300 flex items-center justify-center ${
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
          <div className="space-y-4 pt-4">
            <label htmlFor="monthlyRent" className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
              שכר דירה חודשי
              <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">לחישוב תשואה — אופציונלי</span>
            </label>
            <div className="relative max-w-xs">
              <input
                id="monthlyRent"
                type="text"
                inputMode="numeric"
                value={data.step3.monthlyRent}
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

        {/* Legal & Debt Risk Verification Section */}
        <div className="p-4 sm:p-6 rounded-2xl border border-teal-500/20 bg-teal-500/[0.02] space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-teal-500/10 pb-2.5 sm:pb-3">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2" style={{ fontFamily: "var(--font-serif)" }}>
              <Shield className="text-teal-400" size={15} />
              <span>בדיקת רקע משפטית וחובות</span>
            </h4>
            <span className="text-[9px] sm:text-[10px] text-teal-400 border border-teal-500/30 px-1.5 sm:px-2 py-0.5 rounded font-mono">אימות רשמי</span>
          </div>

          {data.step3.dealType === "developer" || data.step3.dealType === "new-developer" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label htmlFor="developerName" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  שם היזם / קבלן
                </label>
                <input
                  id="developerName"
                  type="text"
                  value={data.step3.developerName || ""}
                  onChange={(e) => setStep3("developerName", e.target.value)}
                  placeholder="לדוגמה: נווה פארק יזמות בע״מ"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="developerRegNumber" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  מספר חברה / ח.פ
                  <span className="mr-2 text-teal-400/70 text-[9px] border border-teal-500/30 px-1 py-0.5 rounded">→ רשם החברות</span>
                </label>
                <input
                  id="developerRegNumber"
                  type="text"
                  inputMode="numeric"
                  value={data.step3.developerRegNumber || ""}
                  onChange={(e) => setStep3("developerRegNumber", e.target.value)}
                  placeholder="לדוגמה: 514123456"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="accreditedBank" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  שם הבנק המלווה (ערבויות חוק מכר)
                </label>
                <input
                  id="accreditedBank"
                  type="text"
                  value={data.step3.accreditedBank || ""}
                  onChange={(e) => setStep3("accreditedBank", e.target.value)}
                  placeholder="לדוגמה: בנק הפועלים / לאומי"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="targetDeliveryDate" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  מועד מסירה מובטח בחוזה
                </label>
                <input
                  id="targetDeliveryDate"
                  type="text"
                  value={data.step3.targetDeliveryDate || ""}
                  onChange={(e) => setStep3("targetDeliveryDate", e.target.value)}
                  placeholder="לדוגמה: 12/2027"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div>
                <label htmlFor="sellerName" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  שם מלא של המוכר
                </label>
                <input
                  id="sellerName"
                  type="text"
                  value={data.step3.sellerName || ""}
                  onChange={(e) => setStep3("sellerName", e.target.value)}
                  placeholder="לדוגמה: ישראל ישראלי"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="sellerIdNumber" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 mb-1.5 sm:mb-2 font-medium">
                  תעודת זהות
                </label>
                <input
                  id="sellerIdNumber"
                  type="text"
                  inputMode="numeric"
                  value={data.step3.sellerIdNumber || ""}
                  onChange={(e) => setStep3("sellerIdNumber", e.target.value)}
                  placeholder="לדוגמה: 012345678"
                  className="w-full bg-transparent border-b border-white/15 py-2 sm:py-2.5 text-white text-sm placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full h-[1px] bg-white/[0.08]" />

        {/* Documents */}
        <div className="space-y-4 sm:space-y-8">
          <h3 className="text-lg sm:text-xl font-normal text-white" style={{ fontFamily: "var(--font-serif)" }}>
            מסמכים מצורפים
          </h3>
          <div className="space-y-2 sm:space-y-4">
            <p className="flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
              נסח טאבו
              <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">מומלץ לדוח מלא</span>
            </p>
            <Dropzone
              id="tabu-upload"
              label="גרור לכאן את נסח הטאבו"
              sublabel="או לחצו לבחירת קובץ · PDF, JPG, PNG, WEBP · עד 20MB"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*"
              file={data.step4.tabuFile}
              tag="נסח טאבו"
              required
              onSelect={(f) => setStep4("tabuFile", f)}
              onRemove={() => setStep4("tabuFile", null)}
            />
          </div>
        </div>

        <div className="w-full h-[1px] bg-white/[0.08]" />

        {/* Contact Info */}
        <div className="space-y-4 sm:space-y-8">
          <h3 className="text-lg sm:text-xl font-normal text-white" style={{ fontFamily: "var(--font-serif)" }}>
            למי נשלח את הדוח?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-2 sm:space-y-3">
              <label htmlFor="fullName" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
                שם מלא
              </label>
              <IconInput
                id="fullName"
                icon={User}
                placeholder="ישראל ישראלי"
                value={data.step1.fullName}
                onChange={(v) => setStep1("fullName", v)}
                hasError={!!errors.fullName}
              />
              {errors.fullName && (
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400 mt-1 sm:mt-2">
                  <AlertCircle size={12} /> {errors.fullName}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:space-y-3">
              <label htmlFor="email" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
                דוא&quot;ל
              </label>
              <IconInput
                id="email"
                icon={Mail}
                type="email"
                placeholder="example@mail.com"
                value={data.step1.email}
                onChange={(v) => setStep1("email", v)}
                hasError={!!errors.email}
              />
              {errors.email && (
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400 mt-1 sm:mt-2">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <label htmlFor="phone" className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-slate-400 font-medium">
              טלפון
            </label>
            <IconInput
              id="phone"
              icon={Phone}
              type="tel"
              inputMode="tel"
              placeholder="054-0000000"
              value={data.step1.phone}
              onChange={(v) => setStep1("phone", v)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
