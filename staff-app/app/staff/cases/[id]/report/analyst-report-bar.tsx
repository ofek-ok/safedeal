"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Pencil, Save, Send, SlidersHorizontal, X } from "lucide-react";

interface Props {
  caseId: string;
  caseNumber: string;
  clientEmail: string;
  status: string;
  version: number;
  initialScore: number;
  initialRiskText: string;
  initialRecommendation: string;
  hasSavedReport: boolean;
}

export function AnalystReportBar({
  caseId,
  caseNumber,
  clientEmail,
  status,
  version,
  initialScore,
  initialRiskText,
  initialRecommendation,
  hasSavedReport,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(String(initialScore));
  const [riskText, setRiskText] = useState(initialRiskText);
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff/cases/${caseId}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          safeScore: score.trim() === "" ? null : Number(score),
          riskTextOverride: riskText,
          recommendationOverride: recommendation,
        }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error || "שמירת העריכה נכשלה.");
      setEditing(false);
      setMessage({ type: "ok", text: "הדוח עודכן ונשמר בהצלחה." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "שגיאה בשמירה." });
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    if (!window.confirm(`לשלוח את הדוח הרשמי (גרסה ${version}) אל ${clientEmail || "הלקוח"}?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff/cases/${caseId}/send-report`, { method: "POST" });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error || "שליחת המייל נכשלה.");
      setMessage({ type: "ok", text: `הדוח נשלח בהצלחה לכתובת ${clientEmail}!` });
      router.refresh();
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "שגיאה בשליחת הדוח." });
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/report/${encodeURIComponent(caseNumber || caseId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage({ type: "err", text: "לא ניתן להעתיק את הקישור ללוח." });
    }
  };

  const isSent = status === "דוח נשלח";

  return (
    <section className="w-full rounded-2xl border border-[#00C896]/30 bg-[#0A1628]/90 p-4 sm:p-5 print:hidden space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00C896]/15 text-[#2DD4BF]">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">לוח בקרת אנליסט לדוח</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isSent
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {isSent ? "דוח נשלח ללקוח" : `טיוטה · גרסה ${version}`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {hasSavedReport
                ? "ניתן לערוך ציון והמלצה ישירות כאן, להעתיק קישור ללקוח או לשלוח את הדוח במייל."
                : "טיוטת תצוגה מקדימה — יש להפיק גרסת דוח בתיק כדי לשמור עריכות ולשלוח."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasSavedReport && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:border-[#00C896]/60 hover:bg-[#00C896]/10 transition-colors"
            >
              {editing ? <X size={14} /> : <Pencil size={14} />}
              {editing ? "סגירת עריכה" : "עריכת ציון והמלצה"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white hover:border-white/30 transition-colors"
          >
            {copied ? <Check size={14} className="text-[#00C896]" /> : <Copy size={14} />}
            {copied ? "הקישור הועתק!" : "העתק קישור דוח"}
          </button>
          {hasSavedReport && !isSent && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSend()}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#145348] px-4 py-2 text-xs font-medium text-[#FAF9F6] hover:bg-[#0F4037] disabled:opacity-50 transition-colors duration-200 ease-out"
            >
              <Send size={14} />
              {busy ? "שולח..." : "שלח דוח ללקוח"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">ציון SafeScore (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060E1C] px-3 py-2 text-sm font-bold text-white focus:border-[#00C896] focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">כותרת רמת סיכון</label>
            <input
              type="text"
              maxLength={240}
              value={riskText}
              onChange={(e) => setRiskText(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060E1C] px-3 py-2 text-sm text-white focus:border-[#00C896] focus:outline-none"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold">המלצת שורה תחתונה ללקוח</label>
            <textarea
              rows={2}
              maxLength={600}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#060E1C] px-3 py-2 text-sm text-white focus:border-[#00C896] focus:outline-none"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              ביטול
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#145348] px-5 py-2 text-xs font-medium text-[#FAF9F6] hover:bg-[#0F4037] disabled:opacity-50 transition-colors duration-200 ease-out"
            >
              <Save size={14} />
              {busy ? "שומר..." : "שמירת שינויים בדוח"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-bold ${
            message.type === "ok"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/15 text-red-300 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}
    </section>
  );
}
