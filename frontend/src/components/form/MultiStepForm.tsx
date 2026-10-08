"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
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
  const [intakeCaseNumber, setIntakeCaseNumber] = useState<string | null>(null);
  const [showErrors, setShowErrors]     = useState(false);

  const TOTAL = 4;

  const next = () => {
    if (step === 2 && !formData.step2.city.trim()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < TOTAL) setStep((s) => s + 1);
  };
  const back = () => { if (step > 1)    setStep((s) => s - 1); };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const staffApiUrl = (process.env.NEXT_PUBLIC_SAFEDEAL_STAFF_API_URL ?? "https://nadlan-risk-platform.ofek-okonski-7581.chatgpt.site").replace(/\/+$/, "");
      const intakeForm = new FormData();
      intakeForm.append("intake", JSON.stringify({
        personal: formData.step1,
        location: formData.step2,
        deal: formData.step3,
      }));
      if (formData.step4.tabuFile) intakeForm.append("files", formData.step4.tabuFile);

      const intakeResponse = await fetch(`${staffApiUrl}/api/intake`, { method: "POST", body: intakeForm });
      const intakeResult = await intakeResponse.json().catch(() => ({})) as { caseNumber?: string; error?: string };
      if (!intakeResponse.ok || !intakeResult.caseNumber) {
        throw new Error(intakeResult.error ?? "לא הצלחנו לשלוח את הבקשה. הפרטים נשארו בטופס — נסו שוב.");
      }

      setIntakeCaseNumber(intakeResult.caseNumber);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error", err);
      alert(err instanceof Error ? err.message : "לא הצלחנו לשלוח את הבקשה. הפרטים נשארו בטופס — נסו שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-16 px-4 animate-fade-in-up">
        <div className="mb-10 p-6 rounded-full border border-[#00C896]/30 bg-[#00C896]/5 relative">
          <div className="absolute inset-0 rounded-full border border-[#00C896]/10 scale-125 animate-pulse" />
          <CheckCircle2 size={30} className="text-[#00C896]" aria-hidden="true" />
        </div>

        <div className="mb-12">
          <div className="w-8 h-[1px] bg-[#00C896] mx-auto mb-6"></div>
          <h2 className="text-3xl md:text-4xl text-white mb-6" style={{ fontFamily: "var(--font-serif)" }}>
            קיבלנו את הבקשה שלכם
          </h2>
          <p className="text-slate-400 text-sm tracking-wider leading-relaxed max-w-md mx-auto">
            אנחנו עובדים על בדיקת הנכס{" "}
            {formData.step2.street ? (
              <span className="text-white">
                {formData.step2.street} {formData.step2.houseNumber},{" "}
                {formData.step2.city}
              </span>
            ) : (
              <span className="text-white">הנכס המבוקש</span>
            )}{" "}
            הצוות קיבל את כל הפרטים והמסמכים. הדוח יישלח אליכם בתוך כ־24 שעות.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-6">
            מספר פנייה:{" "}
            <span className="text-[#00C896] font-mono text-xs">{intakeCaseNumber}</span>
          </p>
        </div>

        <button
          onClick={() => {
            setSubmitted(false); setStep(1);
            setFormData(INITIAL_FORM_DATA); setIntakeCaseNumber(null);
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
      {/* Step Indicator above header */}
      <StepIndicator current={step} />

      {/* Editorial page header */}
      <div className="text-center mb-4 sm:mb-8 max-w-xl mx-auto">
        <div className="w-8 sm:w-10 h-[2px] bg-[#00C896] mx-auto mb-2 sm:mb-4" />
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase mb-1 sm:mb-2">
          בדיקת נאותות
        </p>
        <h1
          className="text-xl sm:text-3xl md:text-4xl font-serif font-extrabold text-white mb-1.5 sm:mb-2 leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          כמה פרטים על הנכס - ואנחנו מתחילים לבדוק
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          מלאו את הפרטים שברשותכם ונשלח לכם את הדוח בתוך כ־24 שעות.
        </p>
      </div>

      {/* Form card — high-end glass container */}
      <div className="w-full rounded-2xl border border-white/14 bg-[#0A1628]/85 backdrop-blur-2xl p-4 sm:p-6 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]">
        <div className="min-h-[260px] sm:min-h-[360px]">
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
              showErrors={showErrors}
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
          <div className="flex items-center justify-between pt-4 sm:pt-8 mt-6 sm:mt-10 border-t border-white/[0.08]">
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
              className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#00C896] hover:text-[#00C896]/80 transition-colors border border-[#00C896]/30 px-5 sm:px-6 py-2.5 sm:py-2.5 rounded-sm bg-[#00C896]/5 hover:bg-[#00C896]/10"
            >
              המשך
              <ArrowLeft size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
