"use client";

import { User, Mail, Phone, AlertCircle, Home, ClipboardList, TrendingUp } from "lucide-react";
import type { Step1Personal, UserPurpose } from "@/types/property";
import { USER_PURPOSE_LABELS } from "@/types/property";
import { isValidEmail } from "@/lib/utils";

interface Props {
  data: Step1Personal;
  onChange: (d: Step1Personal) => void;
  showErrors: boolean;
}

const PURPOSES: { value: UserPurpose; icon: React.ElementType }[] = [
  { value: "buyer",    icon: Home },
  { value: "seller",   icon: ClipboardList },
  { value: "investor", icon: TrendingUp },
];

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-[11px] uppercase tracking-widest text-slate-400 font-medium">
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

export function Step1Personal({ data, onChange, showErrors }: Props) {
  const set = <K extends keyof Step1Personal>(k: K, v: Step1Personal[K]) =>
    onChange({ ...data, [k]: v });

  const errors = showErrors
    ? {
        fullName:    !data.fullName.trim()         ? "שם מלא (אופציונלי)" : undefined,
        email:       !data.email.trim()            ? undefined
                   : !isValidEmail(data.email)     ? "כתובת הדוא״ל אינה תקינה" : undefined,
        phone:       undefined,
        purpose:     undefined,
        agreeToTerms: undefined,
      }
    : {};

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Header */}
      <div className="mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-4"></div>
        <span className="text-[#00C896] text-[10px] font-bold uppercase tracking-widest mb-3 block">
          שלב 01
        </span>
        <h2 className="text-2xl font-normal text-white mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          פרטים אישיים
        </h2>
        <p className="text-slate-400 text-sm tracking-wider">
          נתחיל עם פרטי יצירת הקשר שלכם
        </p>
      </div>

      <div className="space-y-8">
        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Field id="fullName" label="שם מלא" error={errors.fullName}>
            <IconInput
              id="fullName"
              icon={User}
              placeholder="ישראל ישראלי"
              value={data.fullName}
              onChange={(v) => set("fullName", v)}
              hasError={!!errors.fullName}
            />
          </Field>
          <Field id="email" label='דוא"ל' error={errors.email}>
            <IconInput
              id="email"
              icon={Mail}
              type="email"
              placeholder="example@mail.com"
              value={data.email}
              onChange={(v) => set("email", v)}
              hasError={!!errors.email}
            />
          </Field>
        </div>

        {/* Phone */}
        <Field id="phone" label="טלפון">
          <IconInput
            id="phone"
            icon={Phone}
            type="tel"
            inputMode="tel"
            placeholder="054-0000000"
            value={data.phone}
            onChange={(v) => set("phone", v)}
          />
        </Field>

        {/* Purpose */}
        <Field id="purpose" label="מטרת הבדיקה">
          <div className="grid grid-cols-3 gap-4">
            {PURPOSES.map(({ value, icon: Icon }) => {
              const active = data.purpose === value;
              return (
                <button
                  key={value}
                  type="button"
                  id={`purpose-${value}`}
                  onClick={() => set("purpose", value)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                    active 
                      ? "border-[#00C896]/50 bg-[#00C896]/10" 
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]"
                  }`}
                >
                  <Icon size={20} className={active ? "text-[#00C896]" : "text-slate-400"} />
                  <span className={`text-[11px] uppercase tracking-widest ${active ? "text-[#00C896]" : "text-slate-400"}`}>
                    {USER_PURPOSE_LABELS[value]}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        {/* Terms Checkbox */}
        <label
          htmlFor="agreeToTerms"
          className="flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all duration-300 border border-white/[0.06] hover:border-white/[0.15] bg-white/[0.01]"
        >
          <div className="relative mt-0.5 shrink-0">
            <input
              id="agreeToTerms"
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => set("agreeToTerms", e.target.checked)}
              className="sr-only"
            />
            <div
              className="w-4 h-4 rounded-sm border transition-all duration-300 flex items-center justify-center"
              style={{
                borderColor: data.agreeToTerms ? "#00C896" : "rgba(255,255,255,0.2)",
                backgroundColor: data.agreeToTerms ? "#00C896" : "transparent"
              }}
            >
              {data.agreeToTerms && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#060E1C" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 tracking-wider leading-relaxed">
              אני מאשר/ת את{" "}
              <span className="text-[#00C896] hover:text-[#00C896]/80 underline underline-offset-4 transition-colors">
                תנאי השימוש ומדיניות הפרטיות
              </span>{" "}
              של SafeDeal
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
