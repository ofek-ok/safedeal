"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/staff";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setError(data.error || "דוא״ל או סיסמה שגויים.");
        return;
      }
      const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/staff";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("שגיאת תקשורת. נסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(circle at 50% 0%, #0E2542 0%, #071122 55%, #050B16 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0A1628]/90 p-7 sm:p-9 shadow-2xl space-y-6 text-right">
        <div className="flex flex-col items-center text-center space-y-3">
          <SafeDealLogo size="md" />
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00C896]/30 bg-[#00C896]/10 px-3 py-1 text-xs font-bold text-[#5EEAD4]">
            <ShieldCheck size={14} />
            מערכת האנליסטים — כניסה מאובטחת
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            הזינו את כתובת הדוא״ל והסיסמה שלכם כדי להיכנס לסביבת העבודה
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300">
              כתובת דוא״ל
            </label>
            <div className="relative">
              <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@safedeal.co.il"
                dir="ltr"
                className="w-full rounded-xl border border-white/15 bg-[#060E1C] py-3 pr-10 pl-4 text-sm text-white placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none text-left"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300">
              סיסמה
            </label>
            <div className="relative">
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-xl border border-white/15 bg-[#060E1C] py-3 pr-10 pl-4 text-sm text-white placeholder:text-slate-600 focus:border-[#00C896] focus:outline-none text-left"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#00C896] py-3 text-sm font-black text-[#060E1C] hover:bg-[#2DD4BF] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? "מאמת פרטים..." : "כניסה למערכת"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#060E1C]" />}>
      <LoginForm />
    </Suspense>
  );
}
