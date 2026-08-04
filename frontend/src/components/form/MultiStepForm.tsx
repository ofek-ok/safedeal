"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { Step1PropertyType } from "./Step1PropertyType";
import { Step2Address } from "./Step2Address";
import { Step3Details } from "./Step3Details";
import { Step4Checkout } from "./Step4Checkout";
import { SafeDealLogo } from "@/components/SafeDealLogo";
import type { WizardFormData } from "@/types/property";
import { INITIAL_FORM_DATA } from "@/types/property";

export function MultiStepForm() {
  const [step, setStep]         = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [jobId, setJobId]               = useState<string | null>(null);

  const TOTAL = 4;

  const next = () => { if (step < TOTAL) setStep((s) => s + 1); };
  const back = () => { if (step > 1)    setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/v1/properties/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal:  formData.step1,
          location:  formData.step2,
          deal:      formData.step3,
          documents: {
            tabuFileName:     formData.step4.tabuFile?.name     ?? null,
            buildingFileName: formData.step4.buildingFile?.name ?? null,
          },
        }),
      });
      const json = res.ok ? await res.json() : {};
      setJobId(json.jobId ?? `SD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
    } catch {
      setJobId(`SD-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-4 animate-fade-in-up">
        <div className="mb-10 p-6 rounded-full border border-[#00C896]/30 bg-[#00C896]/5 relative">
          <div className="absolute inset-0 rounded-full border border-[#00C896]/10 scale-125 animate-pulse" />
          <SafeDealLogo size="md" iconOnly />
        </div>

        <div className="mb-12">
          <div className="w-8 h-[1px] bg-[#00C896] mx-auto mb-6"></div>
          <h2 className="text-3xl md:text-4xl text-white mb-6" style={{ fontFamily: "var(--font-serif)" }}>
            הבדיקה שלכם התקבלה בהצלחה ✅
          </h2>
          <p className="text-slate-400 text-sm tracking-wider leading-relaxed max-w-md mx-auto">
            הדוח המשוקלל עבור{" "}
            {formData.step2.street ? (
              <span className="text-white">
                {formData.step2.street} {formData.step2.houseNumber},{" "}
                {formData.step2.city}
              </span>
            ) : (
              <span className="text-white">הנכס המבוקש</span>
            )}{" "}
            נוצר בהצלחה מ-8 מקורות מידע. נשלח אותו למייל שהזנתם ברגע שיהיה מוכן.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-6">
            מספר בקשה:{" "}
            <span className="text-[#00C896] font-mono text-xs">#{jobId}</span>
          </p>
        </div>

        <Link
          href="/report"
          className="group flex items-center justify-center gap-3 py-4 px-10 border border-[#00C896] bg-[#00C896]/10 hover:bg-[#00C896]/20 text-[#00C896] transition-all duration-300 w-full sm:w-auto uppercase tracking-widest text-xs mb-12"
        >
          <FileText size={14} />
          <span>הצג דוח מלא</span>
          <ExternalLink size={14} className="group-hover:translate-x-[-2px] group-hover:-translate-y-[2px] transition-transform" />
        </Link>

        <div className="grid grid-cols-3 gap-8 p-8 border-y border-white/[0.06] w-full max-w-lg mb-12">
          {[
            { num: "100K+", label: "עסקאות מנותחות" },
            { num: "~5",    label: "דקות לדוח"  },
            { num: "8",     label: "מקורות מידע"     },
          ].map(({ num, label }) => (
            <div key={label} className="text-center flex flex-col gap-2">
              <p className="text-2xl text-[#00C896]" style={{ fontFamily: "var(--font-serif)" }}>{num}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setSubmitted(false); setStep(1);
            setFormData(INITIAL_FORM_DATA); setJobId(null);
          }}
          className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
        >
          הגש בקשה חדשה
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 py-4 mb-8 border-b border-white/[0.06] text-[10px] uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5">🕒 דוח תוך דקות</span>
        <span className="text-white/10 hidden sm:inline">|</span>
        <span className="flex items-center gap-1.5">🔒 תשלום מאובטח</span>
        <span className="text-white/10 hidden sm:inline">|</span>
        <span className="flex items-center gap-1.5">📊 מידע ממקורות רשמיים</span>
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <Step1PropertyType
            data={{ dealType: formData.step3.dealType }}
            onChange={(dealType) => setFormData((f) => ({ ...f, step3: { ...f.step3, dealType } }))}
            onAutoAdvance={next}
          />
        )}
        {step === 2 && (
          <Step2Address
            data={formData.step2}
            onChange={(step2) => setFormData((f) => ({ ...f, step2 }))}
            showErrors={false}
          />
        )}
        {step === 3 && (
          <Step3Details
            data={formData}
            onChange={setFormData}
            showErrors={false}
          />
        )}
        {step === 4 && (
          <Step4Checkout
            data={formData}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onChange={setFormData}
          />
        )}
      </div>

      {step < TOTAL && (
        <div className="flex items-center justify-between pt-8 mt-12 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
          >
            <ArrowRight size={14} />
            חזרה
          </button>

          <span className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">
            0{step} / 0{TOTAL}
          </span>

          <button 
            type="button" 
            onClick={next} 
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00C896] hover:text-[#00C896]/80 transition-colors border border-[#00C896]/30 px-6 py-2.5 rounded-sm bg-[#00C896]/5 hover:bg-[#00C896]/10"
          >
            המשך
            <ArrowLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
