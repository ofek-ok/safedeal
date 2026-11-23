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
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F4F2ED]"
    >
      <div className="w-full max-w-md rounded-[16px] border border-[#161B1A]/10 bg-[#FFFFFF] p-8 space-y-6 text-right">
        <div className="flex flex-col items-start space-y-3">
          <div className="rounded-[8px] bg-[#151B1A] px-3 py-2 inline-flex">
            <SafeDealLogo size="sm" />
          </div>
          <h1 className="text-xl font-medium text-[#161B1A]">
            מערכת האנליסטים — כניסה מאובטחת
          </h1>
          <p className="text-sm text-[#4E5856] leading-relaxed">
            הזינו את כתובת הדוא״ל והסיסמה שלכם כדי להיכנס לסביבת העבודה
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-xs font-medium text-[#4E5856]">
              כתובת דוא״ל
            </label>
            <div className="relative">
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E5856] pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@safedeal.co.il"
                dir="ltr"
                className="w-full rounded-[8px] border border-[#161B1A]/10 bg-[#FAF9F6] py-3 pr-10 pl-4 text-sm text-[#161B1A] placeholder:text-[#4E5856]/60 focus:border-[#145348] focus:outline-none text-left transition-colors duration-200 ease-out"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-xs font-medium text-[#4E5856]">
              סיסמה
            </label>
            <div className="relative">
              <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E5856] pointer-events-none" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-[8px] border border-[#161B1A]/10 bg-[#FAF9F6] py-3 pr-10 pl-4 text-sm text-[#161B1A] placeholder:text-[#4E5856]/60 focus:border-[#145348] focus:outline-none text-left transition-colors duration-200 ease-out"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-[8px] border border-red-700/20 bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[8px] bg-[#145348] py-3 text-sm font-medium text-[#FAF9F6] hover:bg-[#0F4037] disabled:opacity-50 transition-colors duration-200 ease-out cursor-pointer"
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
