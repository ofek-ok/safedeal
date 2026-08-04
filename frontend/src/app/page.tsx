"use client";

import Link from "next/link";
import { ArrowLeft, Search, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";
import { useReveal } from "@/hooks/useReveal";

/* ─────────────────────────────────────────────────────────────
   Scroll-reveal wrapper — animates children into view on scroll
───────────────────────────────────────────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, visible] = useReveal<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Data — 8 official intelligence sources
───────────────────────────────────────────────────────────── */
const SOURCES = [
  { num: "01", title: "בדיקת זכויות ורישומים", desc: "אימות בעלות, שעבודים, הערות אזהרה וצווי בית משפט", highlight: true },
  { num: "02", title: "חריגות בנייה וסיכונים תכנוניים", desc: "בדיקת היתרי בנייה, חריגות ומגבלות תכנוניות בנכס" },
  { num: "03", title: "תוכניות עתידיות באזור", desc: "תוכניות תשתיות, התחדשות עירונית והשפעות על ערך הנכס" },
  { num: "04", title: "מחירי עסקאות דומות", desc: "השוואת מחירים ותשואות מעסקאות אמת שבוצעו בסביבה" },
  { num: "05", title: "מידע על המוכר / הקבלן", desc: "בדיקת רקע, פרויקטים קודמים ומצב משפטי של הצד השני" },
  { num: "06", title: "נתונים על הסביבה", desc: "תחבורה, חינוך, מסחר ואיכות חיים באזור הנכס" },
  { num: "07", title: "SafeScore", desc: "ציון כולל שמסכם את רמת הסיכון והאיכות של העסקה", highlight: true },
  { num: "08", title: "המלצות והערות", desc: "תובנות מקצועיות וסיכום ממוקד לפני חתימה" },
];

const PAIN_POINTS = [
  {
    num: "א",
    title: "האם אתם משלמים מחיר הוגן?",
    desc: "ניתוח עסקאות דומות באזור מול המחיר המבוקש, כדי שתדעו אם מדובר בעסקה סבירה.",
    featured: true,
  },
  {
    num: "ב",
    title: "האם קיימים סיכונים משפטיים או תכנוניים?",
    desc: "בדיקת שעבודים, הערות אזהרה, חריגות בנייה ומגבלות תכנוניות שעלולות להשפיע על הנכס.",
    featured: false,
  },
  {
    num: "ג",
    title: "האם יש מידע שעלול להשפיע על ערך הנכס?",
    desc: "תוכניות תשתיות עתידיות, היטלי השבחה צפויים, ומצב רישום הזכויות — כל מה שחייבים לדעת.",
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "הדוח חשף הערת אזהרה ישנה שלא הוזכרה בטיוטת החוזה. הבדיקה אפשרה לנו לנהל משא ומתן מבוסס עובדות ולהימנע מסיכון.",
    name: "רונית ואלי כהן",
    role: "רוכשי דירת 4 חדרים בתל אביב",
  },
  {
    quote: "כמשקיע נדל״ן, SafeDeal מקצרת לי את שלב הבדיקות הראשוני משבועות למספר דקות. הנתונים מדויקים ונגישים בצורה יוצאת מן הכלל.",
    name: "עמית דורון",
    role: "משקיע נדל״ן",
  },
  {
    quote: "בדיקת התיק ההנדסי הראתה שסגירת המרפסת אינה כוללת היתר מפורש. המידע הזה היה קריטי עבור השמאי ועורך הדין שלנו.",
    name: "ד״ר מיכל ברק",
    role: "רוכשת דירה ראשונה",
  },
];

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="relative bg-[#060E1C] text-white min-h-screen overflow-hidden selection:bg-[#00C896]/30 selection:text-white">
      
      {/* ═══════════════════════════════════════════════════════
          FLOATING NAVIGATION BAR
      ═══════════════════════════════════════════════════════ */}
      <header className="fixed top-4 left-4 right-4 sm:left-8 sm:right-8 z-50 max-w-6xl mx-auto">
        <nav className="flex items-center justify-between px-5 sm:px-8 py-3.5 rounded-2xl bg-[#060E1C]/80 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <SafeDealLogo size="sm" />
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/analyze"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200"
            >
              ראו דוח לדוגמה
            </Link>
            <Link
              href="/analyze"
              className="sd-btn-primary text-xs py-2.5 px-5 font-bold shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:shadow-[0_6px_28px_rgba(0,200,150,0.5)]"
            >
              בדקו את הדירה עכשיו
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO — Dynamic typography & mesh ambient background
      ═══════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-36 pb-24 overflow-hidden">
        
        {/* Ambient mesh radial glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,200,150,0.12)_0%,rgba(30,68,120,0.08)_40%,transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-[#1E4478]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-[#00C896]/10 blur-3xl pointer-events-none" />

        {/* Editorial grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Tagline Badge */}
        <Reveal delay={0}>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#00C896]/35 bg-[#00C896]/10 backdrop-blur-md mb-8 shadow-[0_0_25px_rgba(0,200,150,0.15)]">
            <Sparkles size={14} className="text-[#00C896]" />
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#2DD4BF] uppercase">
              בדיקת נאותות חכמה לנדל״ן בישראל
            </span>
          </div>
        </Reveal>

        {/* Dynamic Display Header */}
        <Reveal delay={0.15}>
          <h1
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.12] max-w-4xl mb-8 tracking-tight text-white drop-shadow-md"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            לא קונים דירה לפני שעושים{" "}
            <span className="text-[#00C896] underline decoration-[#00C896]/40 underline-offset-8">
              SafeDeal.
            </span>
            <br className="hidden sm:block" />
            <span className="text-[#FAF8F5] block mt-2 opacity-95">
              כי יש דברים שפשוט אסור לגלות אחרי שחותמים.
            </span>
          </h1>
        </Reveal>

        {/* Subtitle & Value Proposition */}
        <Reveal delay={0.3}>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-10 font-normal">
            SafeDeal בודקת עבורכם את הנכס, המוכר, התכנון, הרישומים, העסקאות באזור ועוד — ומרכזת את כל המידע הקריטי לדוח אחד ברור, לפני שאתם מתחייבים לעסקה.
          </p>
          
          {/* Key Checkmark Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mb-12 text-xs sm:text-sm font-semibold text-[#5EEAD4] bg-[#0A1628]/60 backdrop-blur-xl px-6 py-3.5 rounded-2xl border border-white/10 shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#00C896]" /> תוך דקות
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#00C896]" /> מידע ממקורות רשמיים
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#00C896]" /> ציון סיכון ברור — SafeScore
            </span>
          </div>
        </Reveal>

        {/* Action Buttons */}
        <Reveal delay={0.45}>
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Link
              href="/analyze"
              className="sd-btn-primary text-base px-9 py-4.5 font-extrabold shadow-[0_8px_30px_rgba(0,200,150,0.4)]"
            >
              <Search size={18} />
              בדקו את הדירה עכשיו
            </Link>
            <Link
              href="/analyze"
              className="sd-btn-ghost text-sm font-bold px-7 py-4"
            >
              ראו דוח לדוגמה
            </Link>
          </div>
        </Reveal>

        {/* Scroll indicator */}
        <Reveal delay={0.65}>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold">
              גלול למטה
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-[#00C896] to-transparent animate-pulse" />
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE PROBLEM — Asymmetric Bento Grid Layout
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              למה זה חשוב?
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-6 max-w-3xl text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            עסקת נדל״ן היא אחת ההחלטות היקרות בחיים.{" "}
            <span className="text-slate-400 block mt-2 text-2xl sm:text-3xl font-sans font-normal">
              רוב האנשים בודקים את המטבח ואת הנוף. מעטים בודקים את מה שבאמת יכול להשפיע על שווי העסקה.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-16 leading-relaxed font-normal">
            SafeDeal מרכזת את כל המידע החשוב בדוח אחד ברור — לפני שאתם מתחייבים.
          </p>
        </Reveal>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ num, title, desc, featured }, i) => (
            <Reveal key={num} delay={0.15 + i * 0.1} className={featured ? "md:col-span-3 lg:col-span-2" : "md:col-span-1"}>
              <div
                className={`group relative h-full rounded-2xl p-8 sm:p-10 transition-all duration-300 ${
                  featured
                    ? "bg-gradient-to-br from-[#0A1628] via-[#0D2037] to-[#0A1628] border border-[#00C896]/35 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-[#00C896]/60 hover:shadow-[0_25px_60px_rgba(0,200,150,0.15)]"
                    : "bg-[#0A1628]/80 backdrop-blur-xl border border-white/12 shadow-xl hover:border-white/25 hover:bg-[#0A1628] hover:-translate-y-1"
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <span
                    className="font-serif text-5xl font-extrabold text-[#00C896]/30 group-hover:text-[#00C896]/60 transition-colors"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {num}׳
                  </span>
                  {featured && (
                    <span className="sd-badge-teal">
                      <ShieldCheck size={14} /> שאלה קריטית
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-snug group-hover:text-[#2DD4BF] transition-colors">
                  {title}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DIVIDER
      ═══════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00C896]/30 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════════════════
          THE SOLUTION — 8 Intelligence Sources (Bento Grid)
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              מה תקבלו בדוח?
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-6 max-w-3xl text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            כל מה שצריך לדעת לפני שחותמים —{" "}
            <span className="text-[#00C896]">בדוח אחד ברור ומקצועי.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-16 leading-relaxed font-normal">
            SafeDeal מאגדת ומצליבה נתונים ממקורות רשמיים, ומציגה אותם בצורה נגישה ומובנת — כדי שתוכלו לקבל החלטה מושכלת.
          </p>
        </Reveal>

        {/* Bento Grid with highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SOURCES.map((src, i) => (
            <Reveal
              key={src.num}
              delay={0.05 + i * 0.05}
              className={src.highlight ? "sm:col-span-2 lg:col-span-2" : "col-span-1"}
            >
              <div
                className={`group relative h-full rounded-2xl p-7 transition-all duration-300 ${
                  src.highlight
                    ? "bg-gradient-to-br from-[#0D2037] via-[#0A1628] to-[#112849] border border-[#00C896]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] hover:border-[#00C896]/60 hover:-translate-y-1"
                    : "bg-[#0A1628]/70 backdrop-blur-xl border border-white/12 shadow-lg hover:border-white/25 hover:bg-[#0A1628] hover:-translate-y-1"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="font-serif text-3xl sm:text-4xl font-extrabold text-[#00C896]/40 group-hover:text-[#00C896] transition-colors"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {src.num}
                  </span>
                  {src.highlight && (
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#00C896] px-2.5 py-1 rounded-full bg-[#00C896]/10 border border-[#00C896]/30">
                      ליבת הבדיקה
                    </span>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-[#2DD4BF] transition-colors">
                  {src.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {src.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRODUCT PREVIEW — Glass Container & High-End Mockup
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-[2px] bg-[#00C896]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
                תוצר הבדיקה
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-16 max-w-3xl text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              דוח נאותות מקצועי —{" "}
              <span className="text-slate-400 font-sans font-normal block mt-2 text-2xl sm:text-3xl">
                שקוף, מפורט ואובייקטיבי.
              </span>
            </h2>
          </Reveal>

          {/* Preview mockup card */}
          <Reveal delay={0.2}>
            <div className="relative rounded-2xl border border-white/20 bg-[#0A1628]/95 p-1 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/12 bg-[#060E1C]/80">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-[#00C896]/80" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-white/10 rounded-lg px-4 py-1.5 text-xs text-slate-300 text-center font-mono font-medium max-w-sm mx-auto border border-white/10">
                    safedeal.co.il/report/SD-84A2
                  </div>
                </div>
              </div>

              {/* Report preview content */}
              <div className="p-6 sm:p-10 space-y-8">
                {/* Score header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-widest font-bold mb-2">
                      מדד תקינות עסקה (SafeScore)
                    </p>
                    <h3
                      className="font-serif text-5xl sm:text-6xl font-extrabold text-white flex items-baseline gap-2"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      <span className="text-[#00C896]">84</span>
                      <span className="text-2xl text-slate-400 font-normal">/100</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { label: "קדסטרלי", color: "#00C896" },
                      { label: "כלכלי", color: "#00C896" },
                      { label: "תכנוני", color: "#F59E0B" },
                      { label: "הנדסי", color: "#00C896" },
                    ].map(({ label, color }) => (
                      <span
                        key={label}
                        className="text-xs px-4 py-1.5 rounded-full border font-bold shadow-sm"
                        style={{
                          borderColor: `${color}55`,
                          color,
                          backgroundColor: `${color}18`,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data rows */}
                <div className="border border-white/15 rounded-xl overflow-hidden divide-y divide-white/10 shadow-md">
                  {[
                    { label: "סטטוס רישום זכויות", value: "בעלות פרטית נקייה", ok: true },
                    { label: "מחיר ממוצע למ״ר", value: "₪40,500 (סטייה +1.8%)", ok: false },
                    { label: "תוכנית התחדשות", value: "מתחם מועדף – תב״ע תא/5000", ok: true },
                    { label: "טופס 4 ותעודת גמר", value: "קיים ומאושר", ok: true },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between px-6 py-4 bg-[#0A1628]/60 hover:bg-[#0A1628] transition-colors">
                      <span className="text-xs sm:text-sm text-slate-200 font-bold">{label}</span>
                      <span className={`text-xs sm:text-sm font-bold ${ok ? "text-[#5EEAD4]" : "text-amber-300"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Blurred "rest of report" teaser */}
                <div className="relative pt-4">
                  <div className="space-y-3 blur-[5px] select-none pointer-events-none opacity-40">
                    <div className="h-4 w-3/4 bg-white/20 rounded" />
                    <div className="h-4 w-2/3 bg-white/20 rounded" />
                    <div className="h-4 w-4/5 bg-white/20 rounded" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/report"
                      className="text-sm font-bold text-[#5EEAD4] bg-[#060E1C]/90 backdrop-blur-md px-6 py-3 rounded-xl border border-[#00C896]/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#00C896] hover:scale-105 transition-all duration-200"
                    >
                      צפייה בדוח מלא לדוגמה ←
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL PROOF — Magazine Quotes
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-6xl mx-auto">
        <div className="max-w-6xl mx-auto mb-16">
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00C896]/30 to-transparent" />
        </div>

        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              מה אומרים הלקוחות?
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {TESTIMONIALS.map(({ quote, name, role }, i) => (
            <Reveal key={name} delay={0.1 + i * 0.12}>
              <blockquote className="h-full flex flex-col justify-between p-8 rounded-2xl border border-white/15 bg-[#0A1628]/80 backdrop-blur-xl shadow-xl hover:border-[#00C896]/40 hover:-translate-y-1 transition-all duration-300">
                <div>
                  <span
                    className="font-serif text-6xl leading-none text-[#00C896]/40 block mb-4"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    ״
                  </span>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">{quote}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm font-bold text-white">{name}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{role}</p>
                </div>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA — High Impact Close
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-32 sm:py-44 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#00C896]/10 blur-3xl pointer-events-none" />

        <Reveal>
          <div className="w-12 h-[2px] bg-[#00C896] mx-auto mb-10" />
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.12] max-w-3xl mx-auto mb-8 text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            אל תשאלו רק 'כמה עולה הדירה.'{" "}
            <br className="hidden sm:block" />
            <span className="text-[#00C896] block mt-2">תשאלו גם 'כמה היא באמת שווה.'</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base sm:text-lg text-slate-300 max-w-lg mx-auto mb-12 leading-relaxed font-normal">
            המטרה של SafeDeal היא לעזור לכם לגלות את הדברים האלה — לפני שאתם מתחייבים למליונים.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/analyze"
              className="sd-btn-primary text-base px-10 py-5 font-extrabold shadow-[0_10px_35px_rgba(0,200,150,0.45)]"
            >
              <Search size={18} />
              בדקו את הדירה עכשיו
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/analyze"
              className="sd-btn-ghost text-sm font-bold px-8 py-4.5"
            >
              ראו דוח לדוגמה
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/12 px-6 sm:px-10 py-10 text-center bg-[#060E1C]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <SafeDealLogo size="xs" />
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} SafeDeal PropTech Ltd. כל הזכויות שמורות.
          </p>
          <div className="flex gap-6 text-xs text-slate-300 font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">תנאי שימוש</span>
            <span className="hover:text-white transition-colors cursor-pointer">פרטיות</span>
            <span className="hover:text-white transition-colors cursor-pointer">צור קשר</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
