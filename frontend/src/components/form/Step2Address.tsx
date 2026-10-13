"use client";

import { AlertCircle } from "lucide-react";
import type { Step2PropertyId } from "@/types/property";
import { GovAutocomplete } from "./GovAutocomplete";

interface Props {
  data: Step2PropertyId;
  onChange: (d: Step2PropertyId) => void;
  showErrors: boolean;
  hideHeading?: boolean;
}

function Field({ id, label, error, children }: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
        {label}
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
  inputMode,
  value,
  onChange,
  placeholder,
  hasError,
}: {
  id: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
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
  const set = <K extends keyof Step2PropertyId>(key: K, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const cityError = showErrors && !data.city.trim() ? "יש להזין עיר כדי להמשיך" : undefined;
  const streetError = showErrors && !data.street.trim() ? "שם הרחוב הוא שדה חובה" : undefined;
  const houseNumberError = showErrors && !data.houseNumber.trim() ? "מספר הבית הוא שדה חובה" : undefined;

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {!hideHeading && (
        <div className="mb-4 sm:mb-10 text-right">
          <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
          <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">
            שלב 02
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            כתובת הנכס
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm tracking-wider">
            הכניסו את כתובת הנכס ונאתר את פרטי הרישום עבורכם
          </p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-8">
        <Field id="city" label="עיר / יישוב *" error={cityError}>
          <GovAutocomplete
            id="city"
            type="city"
            value={data.city}
            onChange={(value) => set("city", value)}
            placeholder="לדוגמה: תל אביב-יפו"
            hasError={!!cityError}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div className="col-span-2">
            <Field id="street" label="רחוב *" error={streetError}>
              <GovAutocomplete
                id="street"
                type="street"
                cityFilter={data.city}
                value={data.street}
                onChange={(value) => set("street", value)}
                placeholder="שם הרחוב"
                hasError={!!streetError}
              />
            </Field>
          </div>
          <Field id="houseNumber" label='מס׳ בית *' error={houseNumberError}>
            <EditorialInput
              id="houseNumber"
              inputMode="numeric"
              value={data.houseNumber}
              onChange={(event) => set("houseNumber", event.target.value)}
              placeholder="45"
              hasError={!!houseNumberError}
            />
          </Field>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
          אין צורך לחפש גוש וחלקה או להעלות נסח לפני שליחת הבקשה. האנליסט יאתר ויאמת את פרטי הרישום ויפיק את המסמכים הדרושים לפי הכתובת ופרטי המוכרים.
        </p>
      </div>
    </div>
  );
}
