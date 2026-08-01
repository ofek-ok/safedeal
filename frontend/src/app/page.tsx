"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
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
  { num: "01", title: "נסח טאבו", desc: "אימות בעלות, שעבודים, הערות אזהרה וצווי בית משפט" },
  { num: "02", title: "GovMap", desc: "זיהוי קדסטרלי, מיפוי גושים, חלקות ותשריטי עירייה" },
  { num: "03", title: "רשות המסים", desc: "מחירי עסקאות אמת בסביבה ושומת מקרקעין עדכנית" },
  { num: "04", title: "מדד הנדל״ן", desc: "תשואות שכירות, מחירי ממוצע למ״ר ומגמות אזוריות" },
  { num: "05", title: "XPLAN", desc: "תוכניות בניין עיר, תב״ע, ייעודי קרקע ומגבלות תכנון" },
  { num: "06", title: "התחדשות עירונית", desc: "סטטוס פינוי-בינוי, תמ״א 38 ומתחמים מועדפים" },
  { num: "07", title: "ארכיב ההנדסה", desc: "תיק בניין עירוני, היתרי בנייה וחריגות מתוכנית" },
  { num: "08", title: "רישוי ומבנים", desc: "טופס 4, תעודת גמר ואכלוס חוקי בנכס" },
];

const PAIN_POINTS = [
  {
    num: "א",
    title: "מידע מבוזר ומורכב",
    desc: "הנתונים פזורים בין 8 רשויות שונות. כל אחת עם ממשק נפרד, מונחים משפטיים סבוכים ותורים ממושכים.",
  },
  {
    num: "ב",
    title: "הפתעות ברישום הזכויות",
    desc: "שיעבוד פעיל שלא צוין, הערת אזהרה ישנה מ-2003, או חובות פתוחים שהמוכר לא גילה בטרם המכירה.",
  },
  {
    num: "ג",
    title: "מגבלות תכנוניות נסתרות",
    desc: "תוכניות תשתיות עתידיות ליד הבניין, היטלי השבחה צפויים, או סגירת מרפסת שבוצעה ללא היתר בנייה.",
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
    <div className="relative bg-navy-950 text-white min-h-screen overflow-hidden">
      {/* ═══════════════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5 bg-navy-950/85 backdrop-blur-xl border-b border-white/10">
        <SafeDealLogo size="sm" />
        <div className="flex items-center gap-5">
          <Link
            href="/analyze"
            className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-colors"
          >
            סיור ללא התחייבות
          </Link>
          <Link
            href="/analyze"
            className="sd-btn-primary text-xs py-2.5 px-5 font-bold"
          >
            התחל בדיקת נכס
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO — Authoritative, editorial, high-contrast headline
      ═══════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-32 pb-24">
        {/* Editorial grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Teal accent line */}
        <Reveal delay={0}>
          <div className="w-12 h-[2px] bg-teal-500 mb-8" />
        </Reveal>

        <Reveal delay={0.1}>
          <p
            className="text-xs sm:text-sm font-bold tracking-[0.2em] text-teal-400 mb-6 uppercase"
          >
            בדיקת נאותות מקיפה לדירות יד שנייה בישראל
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <h1
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.15] max-w-4xl mb-8 tracking-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            לקנות דירה בלי לבדוק מה מופיע בטאבו ובתב״ע —{" "}
            <span className="text-teal-400">זה סיכון מיותר.</span>
            <br className="hidden md:block" />
            <span className="text-cream-50">
              SafeDeal מרכזת בדיקת נאותות יסודית תוך דקות.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.35}>
          <p className="text-base sm:text-lg text-slate-200 max-w-2xl leading-relaxed mb-12 font-normal">
            8 מקורות מידע רשמיים. דוח משפטי ותכנוני מקיף.
            <br />
            כי ההחלטה הפיננסית הכי גדולה בחייכם דורשת שקיפות וביטחון מלא.
          </p>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/analyze"
              className="sd-btn-primary text-sm sm:text-base px-8 py-4 font-bold"
            >
              <Search size={18} />
              התחל בדיקת נכס עכשיו
            </Link>
            <Link
              href="/analyze"
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300"
            >
              סיור ללא התחייבות
            </Link>
          </div>
        </Reveal>

        {/* Scroll indicator */}
        <Reveal delay={0.7}>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-bold">
              גלול למטה
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-slate-400 to-transparent" />
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THE PROBLEM — Pain points
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-5xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-teal-500" />
            <span className="text-xs font-bold tracking-[0.2em] text-teal-400 uppercase">
              האתגר ברכישת דירה
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-6 max-w-3xl text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            מדי שנה, אלפי רוכשים חותמים על חוזה במליוני שקלים —{" "}
            <span className="text-slate-300">ללא בדיקה מלאה של המצב המשפטי והתכנוני.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base text-slate-200 max-w-2xl mb-16 leading-relaxed font-normal">
            נתוני המקרקעין פזורים בין גופים רשמיים שונים. ללא מצב נתונים מרכזי, קשה לקבל תמונה מלאה של הזכויות והסיכונים בטרם חתימה.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/15 rounded-2xl overflow-hidden shadow-2xl">
          {PAIN_POINTS.map(({ num, title, desc }, i) => (
            <Reveal key={num} delay={0.15 + i * 0.1}>
              <div className="bg-navy-900 p-8 sm:p-10 h-full border border-white/10">
                <span
                  className="font-serif text-5xl font-bold text-teal-500/25 block mb-4"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {num}׳
                </span>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          THIN DIVIDER
      ═══════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10">
        <div className="h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent" />
      </div>

      {/* ═══════════════════════════════════════════════════════
          THE SOLUTION — 8 Intelligence Sources
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-5xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-teal-500" />
            <span className="text-xs font-bold tracking-[0.2em] text-teal-400 uppercase">
              הפתרון המקיף
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.15] mb-6 max-w-3xl text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            8 מקורות מידע רשמיים.{" "}
            <span className="text-teal-400">דוח בדיקה יסודי אחד.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base text-slate-200 max-w-2xl mb-16 leading-relaxed font-normal">
            SafeDeal מאגדת ומצליבה נתונים מ-8 מאגרים רשמיים לכדי דוח נאותות שקוף, מפורט ומבוסס עובדות — לקבלת החלטה מושכלת בביטחון מלא.
          </p>
        </Reveal>

        {/* Architectural grid with numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/15 rounded-2xl overflow-hidden shadow-2xl">
          {SOURCES.map((src, i) => (
            <Reveal key={src.num} delay={0.05 + i * 0.06}>
              <div className="bg-navy-900 p-6 sm:p-7 h-full border border-white/10 group hover:bg-navy-800 transition-colors duration-300">
                <span
                  className="font-serif text-4xl font-bold text-teal-400/35 group-hover:text-teal-400 transition-colors duration-300 block mb-3"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {src.num}
                </span>
                <h4 className="text-sm font-bold text-white mb-2">{src.title}</h4>
                <p className="text-xs text-slate-200 leading-relaxed font-normal">{src.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRODUCT PREVIEW — What you get
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-[1px] bg-teal-500" />
              <span className="text-xs font-bold tracking-[0.2em] text-teal-400 uppercase">
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
              <span className="text-slate-300">שקוף, מפורט ואובייקטיבי.</span>
            </h2>
          </Reveal>

          {/* Preview mockup card */}
          <Reveal delay={0.2}>
            <div className="relative rounded-2xl border border-white/20 bg-navy-900 p-1 shadow-2xl overflow-hidden">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-950/60">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400/80" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-white/10 rounded-lg px-4 py-1.5 text-xs text-slate-300 text-center font-mono font-medium">
                    safedeal.co.il/report/SD-84A2
                  </div>
                </div>
              </div>

              {/* Report preview content */}
              <div className="p-6 sm:p-10 space-y-8">
                {/* Score header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-widest font-bold mb-2">
                      מדד תקינות עסקה (SafeScore)
                    </p>
                    <h3
                      className="font-serif text-5xl sm:text-6xl font-bold text-white"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      84<span className="text-2xl text-slate-400 font-normal">/100</span>
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "קדסטרלי", color: "#00C896" },
                      { label: "כלכלי", color: "#00C896" },
                      { label: "תכנוני", color: "#F59E0B" },
                      { label: "הנדסי", color: "#00C896" },
                    ].map(({ label, color }) => (
                      <span
                        key={label}
                        className="text-xs px-3.5 py-1.5 rounded-full border font-bold"
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
                <div className="border border-white/15 rounded-xl overflow-hidden divide-y divide-white/10">
                  {[
                    { label: "סטטוס רישום זכויות", value: "בעלות פרטית נקייה", ok: true },
                    { label: "מחיר ממוצע למ״ר", value: "₪40,500 (סטייה +1.8%)", ok: false },
                    { label: "תוכנית התחדשות", value: "מתחם מועדף – תב״ע תא/5000", ok: true },
                    { label: "טופס 4 ותעודת גמר", value: "קיים ומאושר", ok: true },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-4 bg-slate-900/60">
                      <span className="text-xs sm:text-sm text-slate-200 font-bold">{label}</span>
                      <span className={`text-xs sm:text-sm font-bold ${ok ? "text-teal-300" : "text-amber-300"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Blurred "rest of report" teaser */}
                <div className="relative">
                  <div className="space-y-3 blur-[5px] select-none pointer-events-none opacity-40">
                    <div className="h-3.5 w-3/4 bg-white/20 rounded" />
                    <div className="h-3.5 w-2/3 bg-white/20 rounded" />
                    <div className="h-3.5 w-4/5 bg-white/20 rounded" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/report"
                      className="text-sm text-teal-300 font-bold underline underline-offset-4 hover:text-teal-200 transition-colors bg-navy-950/90 px-4 py-2 rounded-lg border border-teal-500/40"
                    >
                      צפייה בדוח מלא לדוגמה →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL PROOF — Magazine-style quotes
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 max-w-5xl mx-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 mb-16">
          <div className="h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent" />
        </div>

        <Reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-[1px] bg-teal-500" />
            <span className="text-xs font-bold tracking-[0.2em] text-teal-400 uppercase">
              חוויות משתמשים
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {TESTIMONIALS.map(({ quote, name, role }, i) => (
            <Reveal key={name} delay={0.1 + i * 0.12}>
              <blockquote className="h-full flex flex-col justify-between p-7 sm:p-8 rounded-2xl border border-white/15 bg-navy-900/80 shadow-lg">
                <div>
                  <span
                    className="font-serif text-5xl leading-none text-teal-400/40 block mb-4"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    ״
                  </span>
                  <p className="text-sm text-slate-100 leading-relaxed font-normal">{quote}</p>
                </div>

                <div className="mt-8 pt-5 border-t border-white/10">
                  <p className="text-sm font-bold text-white">{name}</p>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">{role}</p>
                </div>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA — Dramatic close
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-40 text-center">
        {/* Accent glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-teal-500/[0.05] blur-3xl pointer-events-none" />

        <Reveal>
          <div className="w-12 h-[2px] bg-teal-500 mx-auto mb-10" />
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] max-w-3xl mx-auto mb-8 text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            העסקה הכי גדולה בחייכם?{" "}
            <br className="hidden sm:block" />
            <span className="text-teal-400">תקבלו אותה מתוך ביטחון מלא.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base text-slate-200 max-w-md mx-auto mb-12 leading-relaxed font-normal">
            בדיקה מקיפה מ-8 מקורות מידע רשמיים, מרוכזת בדוח אחד ברור.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              href="/analyze"
              className="sd-btn-primary text-base px-10 py-5 font-bold shadow-lg shadow-teal-500/25"
            >
              <Search size={18} />
              התחל בדיקת נכס עכשיו
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/analyze"
              className="text-sm font-bold text-slate-300 hover:text-white transition-colors underline underline-offset-4 decoration-slate-600 hover:decoration-slate-300"
            >
              סיור ללא התחייבות
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 px-6 sm:px-10 py-8 text-center bg-navy-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
