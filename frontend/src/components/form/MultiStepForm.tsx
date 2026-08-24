"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, ExternalLink, FileText, Clock, Lock, BarChart3 } from "lucide-react";
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
    setIsSubmitting(true);
    try {
      let apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      
      let savedTabuName = formData.step4.tabuFile?.name ?? null;

      // 1. Upload file if it exists
      if (formData.step4.tabuFile) {
        const uploadData = new FormData();
        uploadData.append("file", formData.step4.tabuFile);
        
        try {
          const upRes = await fetch(`${apiUrl}/api/v1/properties/upload-doc`, {
            method: "POST",
            body: uploadData,
          });
          if (upRes.ok) {
            const upJson = await upRes.json();
            savedTabuName = upJson.filename; // Use the unique server-generated name
          } else {
            console.error("Upload failed with status", upRes.status);
            alert(`Upload failed: ${upRes.status}`);
          }
        } catch (e) {
          console.error("File upload failed", e);
          alert("File upload connection error");
        }
      }

      // 2. Start analysis
      const res = await fetch(`${apiUrl}/api/v1/properties/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal:  {
            ...formData.step1,
            email: formData.step1.email || undefined,
          },
          location:  formData.step2,
          deal:      formData.step3,
          documents: {
            tabuFileName:     savedTabuName,
            buildingFileName: formData.step4.buildingFile?.name ?? null,
          },
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Analysis failed:", res.status, errorText);
        alert(`Analysis API failed: ${res.status}\nCheck console for details.\nURL: ${apiUrl}/api/v1/properties/analyze`);
        setIsSubmitting(false);
        return;
      }
      
      const json = await res.json();
      setJobId(json.jobId);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error", err);
      alert("Submission connection error");
    } finally {
      setIsSubmitting(false);
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
            הבדיקה שלכם התקבלה בהצלחה
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
          href={`/report/${jobId}`}
          className="group flex items-center justify-center gap-3 py-4 px-10 border border-[#00C896] bg-[#00C896]/10 hover:bg-[#00C896]/20 text-[#00C896] transition-all duration-300 w-full sm:w-auto uppercase tracking-widest text-xs mb-12"
        >
          <FileText size={14} />
          <span>הצג דוח מלא</span>
          <ExternalLink size={14} className="group-hover:translate-x-[-2px] group-hover:-translate-y-[2px] transition-transform" />
        </Link>

        <div className="grid grid-cols-3 gap-3 sm:gap-8 p-4 sm:p-8 border-y border-white/[0.06] w-full max-w-lg mb-12">
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
          ללא שדות חובה — מלאו את מה שנוח לכם וקבלו דוח תוך דקות.
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
