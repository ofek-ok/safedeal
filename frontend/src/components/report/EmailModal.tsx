"use client";

import { useState } from "react";
import { X, Mail, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { isValidEmail } from "@/lib/utils";

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailModal({ isOpen, onClose }: EmailModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !isValidEmail(email)) {
      setError("אנא הזן כתובת דוא״ל תקינה");
      return;
    }

    setError("");
    setStatus("sending");

    setTimeout(() => {
      setStatus("success");
    }, 1200);
  };

  const handleReset = () => {
    setStatus("idle");
    setEmail("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-md bg-navy-900 p-8 sm:p-10 rounded-2xl border border-white/20 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="סגור"
        >
          <X size={18} />
        </button>

        {status === "success" ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-teal-500/15 border border-teal-500/40 flex items-center justify-center mx-auto text-teal-400">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl sm:text-3xl text-white font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
              הדוח נשלח בהצלחה
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed max-w-xs mx-auto font-medium">
              עותק מלא של דוח SafeDeal נשלח לכתובת:
              <br />
              <span className="text-teal-300 font-bold dir-ltr inline-block mt-2">
                {email}
              </span>
            </p>
            <button
              onClick={handleReset}
              className="sd-btn-primary w-full py-3.5 mt-4 text-sm font-bold"
            >
              סגור חלון
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="w-8 h-[1px] bg-teal-500 mb-1"></div>
              <h3 className="text-2xl text-white font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                שליחת דוח בדוא״ל
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                קבלו קובץ PDF מלא ומפורט ישירות לתיבת הדואר
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="modal-email" className="block text-xs uppercase tracking-wider text-slate-200 font-bold">
                כתובת דוא״ל למשלוח
              </label>
              <input
                id="modal-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all dir-ltr font-medium text-sm"
                autoFocus
              />
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400 font-bold pt-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 text-xs sm:text-sm font-bold border border-white/20 text-slate-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={status === "sending"}
                className="sd-btn-primary flex-1 py-3 text-xs sm:text-sm font-bold"
              >
                {status === "sending" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    שולח...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={15} />
                    שלח דוח
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
