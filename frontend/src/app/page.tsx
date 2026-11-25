"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Scale,
  FileText,
  ChevronDown,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { SafeDealLogo } from "@/components/SafeDealLogo";

/* ─────────────────────────────────────────────────────────────
   Data — The 5 Critical Traps SafeDeal Uncovers
───────────────────────────────────────────────────────────── */
const CRITICAL_TRAPS = [
  {
    num: "01",
    tag: "סיכון כספי גבוה",
    title: "מוכר או יזם שנמצאים בהליכי פשיטת רגל",
    desc: "הדירה נראית מושלמת, אבל חתימה מול מוכר או קבלן בהליכי חדלות פירעון עלולה להקפיא את הכסף שלכם ולעכב או לבטל את העסקה כולה.",
    solution: "גלו מראש אם המוכר כשיר למכור — לפני שמוציאים שקל",
    severity: "high",
  },
  {
    num: "02",
    tag: "שעבוד נסתר",
    title: "שעבודים נסתרים והלוואות חוץ-בנקאיות",
    desc: "מעבר למשכנתה הרגילה, על הדירה או המוכר עלולים לרבוץ חובות ושעבודים שלא מספרים לכם עליהם — כאלה שמונעים העברת בעלות נקייה.",
    solution: "וודאו שהדירה נקייה משעבודים נסתרים לפני שמתחייבים",
    severity: "high",
  },
  {
    num: "03",
    tag: "תמחור ושוק",
    title: "לשלם מאות אלפי שקלים מעל השווי האמיתי",
    desc: "מחיר ביקוש במודעה הוא לא מחיר סגירה. אנחנו בודקים אם המחיר שמבקשים מכם באמת מוצדק ביחס לעסקאות אמיתיות בבניין וברחוב.",
    solution: "הימנעו מתשלום יתר ובואו למשא ומתן עם מספרים אמיתיים",
    severity: "medium",
  },
  {
    num: "04",
    tag: "זכויות ובעלות",
    title: "הערות אזהרה, יורשים וזכויות צד ג׳",
    desc: "התחייבויות לרוכשים קודמים, סכסוכי ירושה או עיקולים פתוחים עלולים לתקוע את המשכנתה ולחסום את רישום הדירה על שמכם.",
    solution: "בדקו שאין שום חסם משפטי שיתקע לכם את המשכנתה",
    severity: "high",
  },
  {
    num: "05",
    tag: "תכנון והנדסה",
    title: "הפקעות או בנייה מתוכננת מול החלון",
    desc: "תוכניות מתאר עתידיות, סלילת כביש או בנייה גבוהה בסמוך לדירה עלולות לפגוע באיכות החיים ובערך הנכס ביום שאחרי.",
    solution: "דעו מה מתוכנן מסביב לדירה לפני שאתם סוגרים חוזה",
    severity: "medium",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — Comparison Table (SafeDeal vs Traditional Check)
───────────────────────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    feature: "מתי מגלים בעיות?",
    traditional: "מאוחר — אחרי שהתאהבתם בדירה, לחצתם יד והוצאתם כסף על אנשי מקצוע",
    safedeal: "מוקדם — עוד לפני שמבזבזים אלפי שקלים על שמאי ועו״ד",
  },
  {
    feature: "כמה זמן מחכים?",
    traditional: "ימים עד שבועות של ריצות, טלפונים והמתנה",
    safedeal: "2 דקות מילוי — ואתם בדרך לדוח ברור ומוכן",
  },
  {
    feature: "הגנה מהפתעות נסתרות",
    traditional: "בדיקה חלקית שלפעמים מפספסת שעבודים או בעיות רקע של המוכר",
    safedeal: "כיסוי מקיף של כל הסיכונים הקריטיים בעסקה עם התרעות ברורות",
  },
  {
    feature: "בדיקת מחיר הוגן",
    traditional: "ניחושים לפי מודעות יד2 והערכה של מתווך",
    safedeal: "תמונת שווי אמיתית שמחזקת אתכם במשא ומתן",
  },
  {
    feature: "שורה תחתונה ברורה",
    traditional: "ערימת מסמכים מבלבלת בלי ציון ובלי המלצה חד־משמעית",
    safedeal: "ציון SafeScore מ-0 עד 100 שמראה מיד אם העסקה בטוחה",
  },
  {
    feature: "עלות",
    traditional: "אלפי שקלים על עו״ד ושמאי עוד לפני שיודעים אם כדאי להתקדם",
    safedeal: "בדיקה נגישה שחוסכת טעויות של מאות אלפי שקלים",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — Frequently Asked Questions
───────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "יש לי כבר עורך דין — למה לי לבדוק גם ב-SafeDeal?",
    a: "עורך הדין נכנס בדרך כלל רק בשלב החוזה, אחרי שכבר התחייבתם רגשית והוצאתם כסף. SafeDeal נותנת לכם תמונת מצב מוקדמת וציון ברור עוד בשלב ההתלבטות — כדי שתדעו אם בכלל שווה להתקדם, ותגיעו לעו״ד עם כל הדגלים האדומים כבר על השולחן.",
  },
  {
    q: "האם המוכר או המתווך יודעים שבדקתי את הדירה?",
    a: "לא. הבדיקה דיסקרטית לחלוטין. המוכר, היזם והמתווך אינם מקבלים שום הודעה ואינם יודעים שביצעתם בדיקה.",
  },
  {
    q: "אין לי את כל הפרטים על הדירה — אפשר בכל זאת לבדוק?",
    a: "בוודאי. מספיק להזין כתובת בסיסית. אין שדות חובה מסובכים, וכל נתון שחסר מושלם אוטומטית או מותאם כדי שתקבלו תשובה ברורה.",
  },
  {
    q: "מתי הכי נכון לעשות את הבדיקה?",
    a: "ברגע שמצאתם דירה שנראית רצינית — לפני זיכרון דברים, לפני העברת מקדמה ולפני שמוציאים כסף על שמאי ומהנדס. בדיקה של 2 דקות עכשיו יכולה לחסוך לכם מאות אלפי שקלים.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [fastAddress, setFastAddress] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleFastSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fastAddress.trim();
    if (trimmed) {
      router.push(`/analyze?address=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/analyze");
    }
  };

  return (
    <div
      className="relative bg-[#080D16] text-slate-50 min-h-screen font-sans selection:bg-[#00C896]/25 selection:text-white"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════
          NAVIGATION BAR
      ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#080D16]/95 border-b border-white/[0.08]">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <SafeDealLogo size="sm" />

          <div className="hidden md:flex items-center gap-6 text-sm font-normal text-slate-300">
            <a href="#traps" className="hover:text-white transition-colors duration-200 ease-out">
              הסיכונים הנסתרים
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-200 ease-out">
              איך זה עובד
            </a>
            <a href="#comparison" className="hover:text-white transition-colors duration-200 ease-out">
              השוואה
            </a>
            <a href="#legal" className="hover:text-white transition-colors duration-200 ease-out">
              גילוי נאות
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/report"
              className="hidden sm:inline text-sm font-normal text-slate-300 hover:text-white transition-colors duration-200 ease-out"
            >
              דוח לדוגמה
            </Link>
            <Link
              href="/analyze"
              className="text-sm font-medium text-[#080D16] bg-[#00C896] hover:bg-[#00b386] px-4 py-2 rounded-lg transition-colors duration-200 ease-out"
            >
              בדקו דירה עכשיו
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO & INTERACTIVE ADDRESS SEARCH
      ═══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 max-w-6xl mx-auto">
        <div className="max-w-3xl text-right">
          <p className="text-sm font-medium text-[#00C896] mb-4">
            לפני שחותמים על דירה, בודקים מה באמת קונים
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.15] text-white mb-6">
            לא קונים דירה לפני שעושים{" "}
            <span className="text-[#00C896]">SafeDeal</span>.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
            לפני שאתם מתחייבים למיליונים — גלו שעבודים נסתרים, בעיות משפטיות, הפתעות בתכנון ופערי מחיר. מקבלים דוח ברור עם ציון SafeScore שמראה אם העסקה בטוחה, תוך 2 דקות מילוי.
          </p>

          {/* Fast Address Search Box — Single Primary CTA on Page */}
          <form
            onSubmit={handleFastSearch}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2 rounded-xl bg-[#0D1522] border border-white/10 max-w-2xl"
          >
            <div className="flex-1 flex items-center pr-3">
              <MapPin size={18} className="text-[#00C896] ml-3 shrink-0" />
              <input
                type="text"
                value={fastAddress}
                onChange={(e) => setFastAddress(e.target.value)}
                placeholder="הזינו כתובת דירה (למשל: רוטשילד 45, תל אביב)..."
                className="w-full bg-transparent py-3 pr-1 pl-3 text-white text-sm placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="sd-btn-primary w-full sm:w-auto shrink-0"
            >
              <Search size={16} />
              <span>בדקו את הדירה עכשיו (2 דקות)</span>
              <ArrowLeft size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-3">
            דיסקרטי לחלוטין · ללא התחייבות · המוכר והמתווך אינם יודעים
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — THE 5 CRITICAL TRAPS
      ═══════════════════════════════════════════════════════ */}
      <section id="traps" className="px-6 py-16 sm:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[#00C896] mb-3">
            מה מסתתר מאחורי הדירה?
          </p>

          <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-4 max-w-3xl text-white">
            הסיכונים שאתם לא רוצים לגלות מאוחר מדי
            <span className="block text-slate-400 font-normal text-xl sm:text-2xl mt-2">
              רוב הרוכשים בודקים את המטבח ואת הנוף — מעטים בודקים את המלכודות המשפטיות שעלולות לעלות מאות אלפי שקלים.
            </span>
          </h2>

          <p className="text-base text-slate-300 max-w-2xl mb-12 leading-relaxed font-normal">
            עסקת מקרקעין היא לרוב ההשקעה הגדולה ביותר של משק בית בישראל. אלו 5 הסיכונים השכיחים ש-SafeDeal בודקת עוד לפני הפנייה לשמאי או לעורך דין:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CRITICAL_TRAPS.map((trap, i) => (
              <div
                key={trap.num}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-colors duration-200 ease-out ${
                  i === 0
                    ? "md:col-span-2 lg:col-span-2 bg-[#121C2D] border border-[#00C896]/35"
                    : "bg-[#0D1522] border border-white/[0.08] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-medium tabular-nums text-[#00C896]">
                      {trap.num}
                    </span>
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-lg border ${
                        trap.severity === "high"
                          ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                          : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                      }`}
                    >
                      {trap.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-medium text-white mb-3">
                    {trap.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">
                    {trap.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 size={14} className="text-[#00C896] shrink-0" />
                  <span>הפתרון של SafeDeal: {trap.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — SIMPLE 3-STEP EXPERIENCE
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 py-16 sm:py-24 bg-[#0D1522] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[#00C896] mb-3">
            פשוט, מהיר וברור
          </p>

          <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-4 text-white">
            3 צעדים פשוטים לשקט נפשי לפני חתימה
          </h2>

          <p className="text-base text-slate-300 max-w-3xl mb-12 leading-relaxed font-normal">
            בלי בירוקרטיה, בלי להוציא אלפי שקלים מראש, ובלי לנחש — תוך דקות ספורות יש לכם תמונה ברורה של העסקה.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "מזינים כתובת ופרטי דירה (2 דקות)",
                desc: "כתובת, קומה ומחיר מבוקש — רק מה שאתם כבר יודעים, בלי שדות חובה מיותרים.",
              },
              {
                step: "02",
                title: "אנחנו בודקים את כל מה שמסוכן בעסקה",
                desc: "בדיקה מקיפה של סיכונים משפטיים, שעבודים, כשירות המוכר ושווי השוק הריאלי של הדירה.",
              },
              {
                step: "03",
                title: "מקבלים דוח ברור עם ציון SafeScore",
                desc: "תוצאה חד־משמעית: ציון תקינות מ-0 עד 100, דגלים אדומים והמלצה ברורה האם להתקדם או לבדוק לעומק.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="p-6 rounded-2xl bg-[#080D16] border border-white/[0.08] hover:border-white/20 transition-colors duration-200 ease-out"
              >
                <span className="text-sm font-medium tabular-nums text-[#00C896] block mb-4">
                  צעד {step}
                </span>
                <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/analyze" className="sd-btn-primary">
              <span>התחילו בדיקת נכס עכשיו (2 דקות)</span>
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — THE BRIGHT PRODUCT MOMENT (ACTUAL REPORT)
      ═══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 bg-[#0D1522] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-sm font-medium text-[#00C896] mb-3">
                תוצר הבדיקה
              </p>
              <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] text-white">
                דוח נאותות מנהלים — כפי שהוא מתקבל בפועל
              </h2>
            </div>
            <Link
              href="/report"
              className="sd-btn-ghost self-start md:self-auto shrink-0"
            >
              <FileText size={16} />
              <span>צפייה בדוח מלא לדוגמה</span>
            </Link>
          </div>

          {/* Bright Product Moment — Crisp Light Paper Document Surface */}
          <div className="rounded-2xl bg-[#FAF8F5] text-slate-900 border border-slate-200 overflow-hidden">
            {/* Document Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900 tabular-nums">
                  SafeDeal Report #SD-61582
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-600">
                  דוח בדיקת נאותות מוקדמת
                </span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg font-medium">
                מאושר ע״י אנליסט
              </span>
            </div>

            {/* Document Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Score & Property Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <span className="text-xs text-slate-600 font-medium block mb-2">
                    מדד תקינות עסקה משוקלל (SafeScore)
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-6xl font-medium tabular-nums text-[#008763]">
                      84
                    </span>
                    <span className="text-2xl text-slate-400 tabular-nums">/ 100</span>
                    <span className="text-xs px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium mr-2">
                      רמת סיכון: נמוכה-בינונית
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-medium text-slate-900">
                    רחוב רוטשילד 45, תל אביב-יפו
                  </p>
                  <p className="text-sm text-slate-600 mt-1 tabular-nums">
                    גוש 6158 · חלקה 42 · דירת 4 חדרים (קומה 4 מתוך 8)
                  </p>
                </div>
              </div>

              {/* Risk Map Grid */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-3">
                  מפת סיכונים מהירה
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: "זיהוי קדסטרלי", ok: true },
                    { label: "בעלות בטאבו", ok: true },
                    { label: "רשם המשכונות", ok: true },
                    { label: "חדלות פירעון", ok: true },
                    { label: "תכנון ותב״ע", ok: false, sub: "בירור היתר" },
                    { label: "התאמת שווי", ok: true },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-right ${
                        item.ok
                          ? "bg-white border-emerald-200 text-slate-900"
                          : "bg-amber-50/70 border-amber-300 text-amber-950"
                      }`}
                    >
                      <p className="text-xs font-medium">{item.label}</p>
                      <p
                        className={`text-xs mt-1 ${
                          item.ok ? "text-[#008763]" : "text-amber-800"
                        }`}
                      >
                        {item.sub || (item.ok ? "תקין" : "לבדיקה")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Findings List */}
              <div className="border border-slate-200 rounded-xl p-6 bg-white">
                <p className="text-xs font-medium text-slate-600 mb-4">
                  ממצאי מפתח מרכזיים
                </p>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[#008763] shrink-0 mt-1" />
                    <span>
                      <span className="font-medium text-slate-900">חדלות פירעון:</span>{" "}
                      לא אותרו הליכי חדלות פירעון פעילים על שם המוכר במאגר משרד המשפטים.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-[#008763] shrink-0 mt-1" />
                    <span>
                      <span className="font-medium text-slate-900">התאמת קומה:</span>{" "}
                      נתוני קומה מלאים (קומה 4 מתוך 8 עם מעלית) — המחיר המבוקש תואם את עסקאות הסביבה.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-1" />
                    <span>
                      <span className="font-medium text-slate-900">הערה משפטית:</span>{" "}
                      קיימת משכנתה קיימת לטובת בנק לאומי — מומלץ לוודא מכתב כוונות מסודר.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — COMPARISON MATRIX
      ═══════════════════════════════════════════════════════ */}
      <section id="comparison" className="px-6 py-16 sm:py-24 max-w-6xl mx-auto">
        <p className="text-sm font-medium text-[#00C896] mb-3">
          למה SafeDeal?
        </p>

        <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-12 text-white">
          בדיקה שגרתית מול בדיקת נאותות SafeDeal
        </h2>

        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0D1522]">
          <div className="grid grid-cols-12 bg-[#121C2D] p-4 text-xs sm:text-sm font-medium border-b border-white/10">
            <div className="col-span-4 text-slate-300">מאפיין הבדיקה</div>
            <div className="col-span-4 text-slate-400">בדיקה שגרתית מסורתית</div>
            <div className="col-span-4 text-[#00C896]">SafeDeal</div>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-12 p-4 sm:p-6 text-xs sm:text-sm items-start hover:bg-white/[0.02] transition-colors duration-200 ease-out"
              >
                <div className="col-span-4 font-medium text-white pl-3">{row.feature}</div>
                <div className="col-span-4 text-slate-400 leading-relaxed pl-3">{row.traditional}</div>
                <div className="col-span-4 text-slate-100 leading-relaxed">{row.safedeal}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — FREQUENTLY ASKED QUESTIONS (FAQ)
      ═══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 bg-[#0D1522] border-y border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-[#00C896] mb-3">
            שאלות ותשובות
          </p>

          <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-12 text-white">
            שאלות נפוצות על הבדיקה
          </h2>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="border border-white/[0.08] rounded-xl bg-[#080D16] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-right font-medium text-sm sm:text-base text-white hover:text-[#00C896] transition-colors duration-200 ease-out"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ease-out shrink-0 mr-4 ${
                        isOpen ? "rotate-180 text-[#00C896]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-4 text-sm text-slate-300 leading-relaxed border-t border-white/[0.06]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — MANDATORY LEGAL DISCLAIMER & TRANSPARENCY
      ═══════════════════════════════════════════════════════ */}
      <section id="legal" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="p-8 rounded-2xl border border-white/[0.08] bg-[#0D1522]">
          <div className="flex items-center gap-3 mb-6 text-[#00C896]">
            <Scale size={20} />
            <h3 className="text-base font-medium text-white">
              עניינים משפטיים, רגולציה וגילוי נאות מחייב
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-400 leading-relaxed">
            <div>
              <span className="font-medium text-white block mb-2">
                כלי סינון מוקדם (Early Pre-screening)
              </span>
              שירות SafeDeal הינו כלי אנליטי-טכנולוגי לסינון מוקדם של נכסים המרכז ומנתח נתונים ומידע ציבורי על העסקה. המידע, הניתוחים והציונים המוצגים אינם מהווים חוות דעת משפטית מחייבת, חוות דעת שמאית או בדיקה הנדסית, ואינם תחליף לייעוץ של עורך דין, שמאי מקרקעין או מהנדס מוסמך.
            </div>

            <div>
              <span className="font-medium text-white block mb-2">
                הגנת הפרטיות ואבטחת מידע
              </span>
              המערכת פועלת בהתאם לתקנות הגנת הפרטיות (אבטחת מידע) תשע״ז-2017. המידע המוזן במערכת מוצפן בפרוטוקול SSL/TLS (256-bit). SafeDeal שומרת על דיסקרטיות ואינה מעבירה את פרטי המשתמש או הנכס הנבדק למוכרים, מתווכים או גורמים בלתי מורשים.
            </div>

            <div>
              <span className="font-medium text-white block mb-2">
                גילוי נאות ועדכניות הנתונים
              </span>
              איסוף המידע מתבצע בהתאם לדין ומתוך מקורות מידע ציבוריים פתוחים. הנתונים נכונים למועד הפקת הדוח ומשקפים את המצב העדכני בלבד.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 border-t border-white/[0.08]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="rounded-2xl bg-[#0D1522] border border-white/10 p-8 sm:p-12 text-center space-y-5">
            <p className="text-sm font-medium text-[#00C896]">
              בדיקה של 2 דקות יכולה לחסוך לכם מאות אלפי שקלים
            </p>
            <h2 className="text-2xl sm:text-4xl font-medium text-white">
              לפני שחותמים על דירה — בודקים עם SafeDeal.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              גלו מראש שעבודים נסתרים, בעיות משפטיות ופערי מחיר עוד לפני שמעבירים מקדמה או מוציאים אלפי שקלים על אנשי מקצוע.
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#00C896] shrink-0" />
                <span>תשובה ברורה עם ציון SafeScore</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#00C896] shrink-0" />
                <span>דיסקרטי לחלוטין — המוכר לא יודע</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-[#00C896] shrink-0" />
                <span>ללא מנוי וללא התחייבות</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xl mx-auto pt-3">
              <Link
                href="/analyze"
                className="sd-btn-primary w-full sm:w-auto justify-center"
              >
                <span>בדקו את הדירה שלי עכשיו</span>
                <ArrowLeft size={16} />
              </Link>
              <Link href="/report" className="sd-btn-ghost w-full sm:w-auto justify-center">
                צפו בדוח לדוגמה
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              תשלום חד־פעמי · מילוי מהיר ב־2 דקות
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.08] px-6 py-12 bg-[#080D16]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <SafeDealLogo size="xs" />

          <p className="text-xs text-slate-400 font-normal">
            © {new Date().getFullYear()} SafeDeal PropTech Ltd. כל הזכויות שמורות.
          </p>

          <div className="flex gap-6 text-xs text-slate-400 font-normal">
            <a
              href={`${(process.env.NEXT_PUBLIC_SAFEDEAL_STAFF_API_URL ?? "https://safedeal-staff.vercel.app").replace(/\/+$/, "")}/staff`}
              className="hover:text-white transition-colors duration-200 ease-out"
            >
              פורטל עובדים (Staff)
            </a>
            <a href="#legal" className="hover:text-white transition-colors duration-200 ease-out">
              גילוי נאות משפטי
            </a>
            <a href="#legal" className="hover:text-white transition-colors duration-200 ease-out">
              מדיניות פרטיות
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
