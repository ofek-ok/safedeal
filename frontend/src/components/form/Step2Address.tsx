"use client";

import { useState, useEffect } from "react";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import type { Step2PropertyId } from "@/types/property";
import { GovAutocomplete } from "./GovAutocomplete";

interface Props {
  data: Step2PropertyId;
  onChange: (d: Step2PropertyId) => void;
  showErrors: boolean;
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
        {label}
        {optional && <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">אופציונלי</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400 mt-2">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function EditorialInput({
  id,
  type = "text",
  inputMode,
  value,
  onChange,
  placeholder,
  hasError,
}: {
  id: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-white/[0.15] py-3 px-0 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
      style={hasError ? { borderColor: "rgba(248,113,113,0.6)" } : undefined}
    />
  );
}

export function Step2Address({ data, onChange, showErrors }: Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  const set = <K extends keyof Step2PropertyId>(k: K, v: string) => {
    setLookupError(null);
    setLookupSuccess(false);
    onChange({ ...data, [k]: v });
  };

  useEffect(() => {
    const { city, street, houseNumber, block, parcel } = data;
    const normalizedCity = city.trim();
    const normalizedStreet = street.trim();
    const normalizedHouseNumber = houseNumber.trim();

    if (!normalizedCity || !normalizedStreet || !normalizedHouseNumber || block || parcel) {
      setIsLookingUp(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/properties/cadastral-lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: normalizedCity,
            street: normalizedStreet,
            houseNumber: normalizedHouseNumber,
          }),
          signal: controller.signal,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "not-found" : "unavailable");
        }

        const blockValue = result?.block == null ? "" : String(result.block).trim();
        const parcelValue = result?.parcel == null ? "" : String(result.parcel).trim();
        if (!blockValue || !parcelValue) throw new Error("not-found");
        if (cancelled) return;

        onChange({ ...data, block: blockValue, parcel: parcelValue });
        setLookupSuccess(true);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setLookupError(error instanceof Error && error.message === "not-found"
          ? "לא נמצאו גוש וחלקה לכתובת. אפשר להזין אותם ידנית."
          : "לא ניתן להתחבר כרגע למאגר. אפשר להזין את הנתונים ידנית.");
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
      setIsLookingUp(false);
    };
  }, [data.city, data.street, data.houseNumber, data.block, data.parcel]);

  const errors = showErrors
    ? {
        city:        !data.city.trim()        ? "שם העיר הוא שדה חובה" : undefined,
        street:      !data.street.trim()      ? "שם הרחוב הוא שדה חובה" : undefined,
        houseNumber: !data.houseNumber.trim() ? "מספר הבית הוא שדה חובה" : undefined,
      }
    : {};

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {/* Heading */}
      <div className="mb-4 sm:mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
        <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">
          שלב 02
        </span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          כתובת הנכס
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm tracking-wider">
          הכניסו את כתובת הנכס לאיתור במאגרי הרישום
        </p>
      </div>

      <div className="space-y-4 sm:space-y-8">
        {/* City */}
        <Field id="city" label="עיר / יישוב *">
          <GovAutocomplete
            id="city"
            type="city"
            value={data.city}
            onChange={(val) => set("city", val)}
            placeholder="לדוגמה: תל אביב-יפו"
            hasError={showErrors && !data.city.trim()}
          />
          {showErrors && !data.city.trim() && (
            <p className="text-red-400 text-xs mt-1">יש להזין עיר כדי להמשיך</p>
          )}
        </Field>

        {/* Street + House number */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div className="col-span-2">
            <Field id="street" label="רחוב *" error={errors.street}>
              <GovAutocomplete
                id="street"
                type="street"
                cityFilter={data.city}
                value={data.street}
                onChange={(val) => set("street", val)}
                placeholder="שם הרחוב"
                hasError={!!errors.street}
              />
            </Field>
          </div>
          <Field id="houseNumber" label='מס׳ בית *' error={errors.houseNumber}>
            <EditorialInput
              id="houseNumber"
              inputMode="numeric"
              value={data.houseNumber}
              onChange={(e) => set("houseNumber", e.target.value)}
              placeholder="45"
              hasError={!!errors.houseNumber}
            />
          </Field>
        </div>

        {/* Cadastral divider */}
        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-4 mt-2 sm:mt-6">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
            <Info size={11} />
            זיהוי קדסטרלי
          </span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
        </div>

        {/* Auto Lookup Status */}
        <div className="flex flex-col items-center min-h-[24px] sm:min-h-[30px] justify-center">
          {isLookingUp && (
            <div className="flex items-center gap-2 text-[10px] text-[#00C896] uppercase tracking-widest bg-[#00C896]/10 px-3 py-1 rounded-full">
              <Loader2 size={12} className="animate-spin" />
              מאתר גוש וחלקה...
            </div>
          )}
          {!isLookingUp && lookupError && (
            <span className="text-red-400 text-[10px] bg-red-400/10 px-3 py-1 rounded">{lookupError}</span>
          )}
          {!isLookingUp && lookupSuccess && (
            <span className="text-[#00C896] text-[10px] bg-[#00C896]/10 px-3 py-1 rounded">הושלם בהצלחה! אנא ודאו את הנתונים מול הטאבו.</span>
          )}
        </div>

        {/* Block / Parcel / Sub-parcel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {(
            [
              { key: "block",     label: "גוש",      placeholder: "מס׳ גוש" },
              { key: "parcel",    label: "חלקה",     placeholder: "מס׳ חלקה" },
              { key: "subParcel", label: "תת-חלקה",  placeholder: "מס׳" },
            ] as { key: keyof Step2PropertyId; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} id={key} label={label} optional>
              <EditorialInput
                id={key}
                inputMode="numeric"
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
              />
            </Field>
          ))}
        </div>

        {/* Hint */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-start gap-3 sm:gap-4">
          <Info size={13} className="shrink-0 mt-0.5 text-[#00C896]" />
          <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
            המערכת תנסה לאתר את הגוש והחלקה לפי הכתובת. מומלץ לוודא את הנתונים מול נסח הטאבו, ואפשר להזינם ידנית.
          </p>
        </div>
      </div>
    </div>
  );
}
