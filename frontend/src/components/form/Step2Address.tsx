"use client";

import { useState, useEffect } from "react";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import type { Step2PropertyId } from "@/types/property";
import { GovAutocomplete } from "./GovAutocomplete";

interface Props {
  data: Step2PropertyId;
  onChange: (d: Step2PropertyId) => void;
  showErrors: boolean;
  hideHeading?: boolean;
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

export function Step2Address({ data, onChange, showErrors, hideHeading = false }: Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<"address-not-found" | "parcel-not-found" | "parcel-fields-missing" | "ambiguous" | "timeout" | "unavailable" | null>(null);
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

    let cancelled = false;
    let requestTimeout: number | undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      requestTimeout = window.setTimeout(() => controller.abort(), 24_000);
      try {
        // Use the server-side cadastral endpoint instead of booting a full map
        // in the customer's browser.
        const response = await fetch("/api/cadastral-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            city: normalizedCity,
            street: normalizedStreet,
            houseNumber: normalizedHouseNumber,
          }),
          signal: controller.signal,
          cache: "no-store",
        });
        const result = await response.json().catch(() => null) as
          | { block?: unknown; parcel?: unknown; error?: unknown }
          | null;
        if (cancelled) return;

        if (!response.ok) {
          console.error(
            "Cadastral lookup failed",
            response.status,
            typeof result?.code === "string" ? result.code : "NO_UPSTREAM_CODE",
            typeof result?.error === "string" ? result.error : "No error details",
          );
          if (response.status === 404) throw new Error("address-not-found");
          if (response.status === 409) throw new Error("ambiguous");
          if (response.status === 504) throw new Error("timeout");
          throw new Error("unavailable");
        }

        const foundBlock = result?.block == null ? "" : String(result.block).trim();
        const foundParcel = result?.parcel == null ? "" : String(result.parcel).trim();
        if (!foundBlock || !foundParcel) throw new Error("parcel-fields-missing");
        onChange({ ...data, block: foundBlock, parcel: foundParcel });
        setLookupSuccess(true);
      } catch (error) {
        if (cancelled) return;
        const code = error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : error instanceof Error
            ? error.message
            : "unavailable";
        setLookupError(
          code === "address-not-found" ||
          code === "parcel-fields-missing" ||
          code === "ambiguous" ||
          code === "timeout"
            ? code
            : "unavailable",
        );
      } finally {
        if (requestTimeout) window.clearTimeout(requestTimeout);
        if (!cancelled) setIsLookingUp(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (requestTimeout) window.clearTimeout(requestTimeout);
      controller.abort();
      setIsLookingUp(false);
    };
  }, [data.city, data.street, data.houseNumber, data.block, data.parcel]);

  const errors: Partial<Record<keyof Step2PropertyId, string>> = showErrors
    ? {
        city: !data.city.trim() ? "שם העיר הוא שדה חובה" : undefined,
        street: !data.street.trim() ? "שם הרחוב הוא שדה חובה" : undefined,
        houseNumber: !data.houseNumber.trim() ? "מספר הבית הוא שדה חובה" : undefined,
        block: !data.block.trim() ? "יש להזין גוש כדי להמשיך" : undefined,
        parcel: !data.parcel.trim() ? "יש להזין חלקה כדי להמשיך" : undefined,
      }
    : {};

  const addressLookupMessage = lookupError === "address-not-found"
    ? "לא הצלחנו לאתר את הגוש והחלקה לפי הכתובת. אפשר להוציא אותם באתר הממשלתי ולהזין כאן."
    : lookupError === "timeout"
      ? "האיתור האוטומטי לא הושלם בתוך כ־24 שניות. אפשר להזין גוש וחלקה ידנית לפי האתר הממשלתי ולהמשיך."
      : lookupError === "unavailable"
        ? "האיתור האוטומטי לא זמין כרגע. אפשר למצוא את הגוש והחלקה באתר הממשלתי ולהזין אותם כאן."
        : null;
  const parcelLookupMessage = lookupError === "parcel-not-found"
    ? "לא נמצאה התאמה לגוש ולחלקה. היכנסו לאתר הממשלתי לאיתור לפי כתובת, ואז הזינו כאן את המספרים."
    : lookupError === "parcel-fields-missing"
      ? "הכתובת נמצאה, אך מספרי הגוש והחלקה לא התקבלו. אפשר לאתר אותם באתר הממשלתי ולהזין כאן."
      : lookupError === "ambiguous"
        ? "לכתובת נמצאו כמה חלקות אפשריות. בדקו את נסח הטאבו והזינו את הגוש והחלקה המתאימים."
        : null;

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {!hideHeading && <div className="mb-4 sm:mb-10 text-right">
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
      </div>}

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

        {(isLookingUp || addressLookupMessage) && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${addressLookupMessage ? "text-amber-300" : "text-[#00C896]"}`}
            role={addressLookupMessage ? "status" : "status"}
            aria-live="polite"
          >
            {isLookingUp ? <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" /> : <Info size={14} className="mt-0.5 shrink-0" />}
            <span>{isLookingUp ? "אנחנו מאתרים את הגוש והחלקה לפי הכתובת. כדאי להמתין לסיום האיתור לפני שממשיכים…" : addressLookupMessage}</span>
          </div>
        )}

        {/* Cadastral divider */}
        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-4 mt-2 sm:mt-6">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
            <Info size={11} />
            זיהוי קדסטרלי
          </span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
        </div>

        {/* Block / Parcel / Sub-parcel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {(
            [
              { key: "block",     label: "גוש *",      placeholder: "מס׳ גוש" },
              { key: "parcel",    label: "חלקה *",     placeholder: "מס׳ חלקה" },
              { key: "subParcel", label: "תת-חלקה",  placeholder: "מס׳" },
            ] as { key: keyof Step2PropertyId; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} id={key} label={label} optional={key === "subParcel"} error={errors[key as "block" | "parcel"]}>
              <EditorialInput
                id={key}
                inputMode="numeric"
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                hasError={!!errors[key as "block" | "parcel"]}
              />
            </Field>
          ))}
        </div>

        {(parcelLookupMessage || lookupSuccess) && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${lookupSuccess ? "text-[#00C896]" : "text-amber-300"}`}
            role="status"
            aria-live="polite"
          >
            {lookupSuccess ? <Info size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            <span>{lookupSuccess ? "הגוש והחלקה אותרו. מומלץ לוודא את הנתונים מול נסח הטאבו." : parcelLookupMessage}</span>
          </div>
        )}

        <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
          גוש וחלקה נדרשים להמשך. אנחנו מנסים לאתר אותם אוטומטית — המתינו להשלמת החיפוש. אם לא נמצאה התאמה, אפשר{" "}
          <a
            href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00C896] underline underline-offset-4 hover:text-white transition-colors"
          >
להיכנס לאתר הממשלתי ולאתר את הגוש והחלקה לפי כתובת הנכס
          </a>
          , ואז להזין את הנתונים בשדות למעלה ולהמשיך.
        </p>

      </div>
    </div>
  );
}
