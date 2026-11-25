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
    title: "קשיים כלכליים והליכי פשיטת רגל של המוכר או היזם",
    desc: "מוכר פרטי או קבלן המצויים בהליכים משפטיים או חדלות פירעון. חתימה על עסקה במצב כזה עלולה להוביל לעיכוב העסקה, הקפאת כספי הקונה ואף לביטול העברה בדיעבד.",
    solution: "איתור מוקדם של סיכוני מוכר והתרעת עצירה לפני העברת מקדמה",
    severity: "high",
  },
  {
    num: "02",
    tag: "שעבוד נסתר",
    title: "שעבודים נסתרים והלוואות חוץ-בנקאיות",
    desc: "רוב הרוכשים מסתפקים בבדיקה שטחית, אך הלוואות פרטיות, חובות לחברות מימון ושעבודים חוזיים עלולים להיות רשומים על המוכר או הנכס ולמנוע העברת בעלות נקייה.",
    solution: "בדיקה יסודית של שעבודים גלויים ונסתרים לפני החתימה",
    severity: "high",
  },
  {
    num: "03",
    tag: "תמחור ושוק",
    title: "תמחור יתר חריג ללא התאמת קומה ומעלית",
    desc: "פער מחיר משמעותי מול עסקאות אמת ברחוב. מודל SafeDeal מבצע התאמת שווי לפי קומת הדירה, קיום מעלית ומיקום יחסי בבניין, כדי שלא תשלמו מעל השווי הריאלי.",
    solution: "חישוב שווי ריאלי מותאם מאפייני דירה מול עסקאות אמת",
    severity: "medium",
  },
  {
    num: "04",
    tag: "זכויות ובעלות",
    title: "הערות סותרות, יורשים וזכויות צד ג׳",
    desc: "התחייבויות לטובת רוכשים קודמים, סכסוכי גירושין, יורשים שלא הסדירו צוואות או עיקולים פתוחים. כל אלו עלולים למנוע קבלת משכנתה והעברת בעלות.",
    solution: "אימות שרשרת הזכויות וזיהוי חסמים משפטיים מראש",
    severity: "high",
  },
  {
    num: "05",
    tag: "תכנון והנדסה",
    title: "הפקעות מתוכננות, חריגות ושינויי סביבה",
    desc: "תוכניות מתאר המייעדות חלק מהמגרש להפקעה, סלילת כביש סמוך או בנייה גבוהה שתחסום את האור והנוף. מידע קריטי שכדאי לגלות לפני שנכנסים לעסקה.",
    solution: "בדיקת השפעות תכנוניות וסביבתיות על הנכס וסביבתו",
    severity: "medium",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — Comparison Table (SafeDeal vs Traditional Check)
───────────────────────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    feature: "מועד הבדיקה",
    traditional: "מאוחר — לאחר משא ומתן, הסכמה על מחיר והתחייבות רגשית לדירה",
    safedeal: "מוקדם — לפני שמוציאים תקציב על אנשי מקצוע ולפני שמתחייבים",
  },
  {
    feature: "זמן עד לקבלת תוצאות",
    traditional: "ימים עד שבועות (ממתינים להפקת מסמכים ולבדיקות שונות)",
    safedeal: "מילוי טופס תוך כ-2–3 דקות והעברה ישירה לתיק אנליסט לאימות",
  },
  {
    feature: "זיהוי שעבודים וכשירות מוכר",
    traditional: "לעתים קרובות נבדק רק סמוך לחתימה או מתפספס בדירות יד שנייה",
    safedeal: "משולב כחלק מובנה ממודל הסיכונים עם התרעת עצירה מוקדמת",
  },
  {
    feature: "התאמת מחיר לפי קומה ומעלית",
    traditional: "הסתמכות על הערכת מתווך או מודעות יד2 (מחירי ביקוש)",
    safedeal: "חישוב לפי עסקאות אמת בסביבה + התאמת קומה ומיקום יחסי",
  },
  {
    feature: "מדד סיכון מספרי",
    traditional: "אין ציון — ערימת מסמכים וחוות דעת מלל מבוזרות",
    safedeal: "ציון SafeScore מ-0 עד 100 עם מפת סיכונים מובנית",
  },
  {
    feature: "עלות הבדיקה",
    traditional: "אלפי שקלים (עו״ד, שמאי מקרקעין ובדק בית) עוד לפני שיודעים אם העסקה תקינה",
    safedeal: "סינון מוקדם בעלות נגישה לפני השקעה בבעלי מקצוע",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — Frequently Asked Questions
───────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "האם דוח SafeDeal מחליף עורך דין או שמאי מקרקעין?",
    a: "לא. SafeDeal הוא כלי סינון מוקדם (Early Pre-screening) שנועד לסייע לכם ולעורך הדין שלכם. במקום לגלות דגלים אדומים ברגע האחרון כשהשקעתם כבר אלפי שקלים על שמאי ומהנדס, SafeDeal מרכזת את הממצאים הראשוניים כבר בשלב ההתעניינות ומספקת לעורך הדין מפת סיכונים ממוקדת.",
  },
  {
    q: "האם המוכר או המתווך יודעים שביצעתי בדיקה על הנכס?",
    a: "לא. הבדיקה דיסקרטית לחלוטין ואינה כוללת פנייה למוכר, ליזם או לגורם תיווך.",
  },
  {
    q: "מה קורה אם אין לי את מספר הגוש והחלקה או את קומת הדירה?",
    a: "המערכת מאתרת את פרטי הנכס המלאים ישירות מהכתובת שהזנתם. בנוסף, נתון חסר אינו מוריד ציון ואינו מייצר התרעת שווא — הניתוח מותאם למידע הזמין.",
  },
  {
    q: "מה בודקים לגבי המוכר או היזם ומדוע זה קריטי?",
    a: "הבדיקה בוחנת האם המוכר או היזם מצויים בקשיים משפטיים, שעבודים חריגים או הליכי פשיטת רגל פעילים. חתימה עם מוכר במצב כזה ללא הגנות מתאימות עלולה להוביל לאובדן המקדמה ולביטול העסקה.",
  },
  {
    q: "כמה זמן לוקח לקבל את הדוח המלא?",
    a: "מילוי הטופס אורך כ-2–3 דקות. הנתונים נקשרים לתיק נאותות במערכת האנליסטים, והבדיקה המלאה ובקרת האנליסט מתבצעות ברציפות להפקת הדוח.",
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
              className="text-sm font-medium text-slate-100 border border-white/10 bg-[#0D1522] hover:border-white/20 hover:bg-[#121C2D] px-4 py-2 rounded-lg transition-colors duration-200 ease-out"
            >
              התחילו בדיקה
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
            בדיקת נכס לפני רכישה · שקט נפשי לפני החתימה
          </p>

          <p className="text-xl sm:text-2xl font-normal text-slate-300 mb-3">
            לפני שחותמים על דירה, בודקים מה באמת קונים
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.15] text-white mb-6">
            לא קונים דירה לפני שעושים{" "}
            <span className="text-[#00C896]">SafeDeal</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-4 font-normal">
            בדיקת נאותות מקיפה לאיתור שעבודים נסתרים, עיקולים, בעיות משפטיות, פערי שווי והערות אזהרה — בדוח אחד ברור עם ציון SafeScore, לפני שמתחייבים לעסקה.
          </p>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
            SafeDeal משלבת טכנולוגיה לאיסוף ולהצלבת מידע על הנכס עם בדיקה ידנית של אנליסט שעובר על כל טופס. אתם מקבלים דוח אחד שמרכז את הממצאים ואת הנקודות שכדאי לברר לפני החתימה.
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
                placeholder="הזינו כתובת (למשל: רוטשילד 45, תל אביב) או גוש וחלקה..."
                className="w-full bg-transparent py-3 pr-1 pl-3 text-white text-sm placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="sd-btn-primary w-full sm:w-auto shrink-0"
            >
              <Search size={16} />
              <span>בדקו את הנכס עכשיו (2 דקות)</span>
              <ArrowLeft size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-3">
            בדיקה דיסקרטית · ללא שדות חובה · המוכר או המתווך אינם מיודעים
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
          SECTION 3 — HOW IT WORKS (4 STEPS)
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 py-16 sm:py-24 bg-[#0D1522] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[#00C896] mb-3">
            איך זה עובד
          </p>

          <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-4 text-white">
            ארבעה שלבים לדעת מה באמת אתם קונים.
          </h2>

          <p className="text-base text-slate-300 max-w-3xl mb-12 leading-relaxed font-normal">
            טכנולוגיה מתקדמת, בדיקת נתונים מעמיקה ובקרה אישית של אנליסט מקצועי — הכל בדוח אחד, לפני שאתם מקבלים את אחת ההחלטות הכלכליות הגדולות בחייכם.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "ממלאים פרטים בסיסיים על הנכס",
                desc: "כתובת, קומה ומחיר מבוקש. ללא שדות חובה מיותרים — ממלאים את מה שידוע לכם תוך כ־2–3 דקות.",
              },
              {
                step: "02",
                title: "בדיקה ואימות מעמיק של הנכס",
                desc: "הטכנולוגיה שלנו אוספת, מצליבה ומנתחת את כל המידע הרלוונטי על הנכס, הזכויות, השעבודים, המוכר והשווי — במקום אחד.",
              },
              {
                step: "03",
                title: "בדיקה ובקרה של אנליסט מקצועי",
                desc: "אנליסט אנושי עובר באופן אישי על כלל הממצאים, בוחן את הנתונים, מזהה אי־התאמות וסיכונים פוטנציאליים ומבצע בקרה מקצועית לפני מסירת הדוח.",
              },
              {
                step: "04",
                title: "מקבלים את התמונה המלאה על הנכס",
                desc: "דוח מקיף הכולל ציון SafeScore, מפת סיכונים, ממצאים מרכזיים והמלצות להמשך בדיקה לפני הרכישה.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="p-6 rounded-2xl bg-[#080D16] border border-white/[0.08] hover:border-white/20 transition-colors duration-200 ease-out"
              >
                <span className="text-sm font-medium tabular-nums text-[#00C896] block mb-4">
                  שלב {step}
                </span>
                <h3 className="text-lg font-medium text-white mb-3">{title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-[#080D16] border border-white/[0.08] text-xs sm:text-sm text-slate-300 text-center">
            ממלאים את פרטי הדירה ← המערכת מנתחת ומצליבה את נתוני העסקה ← אנליסט בודק את הטופס ידנית ← מקבלים דוח מסודר
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
          <div className="max-w-3xl text-right space-y-4">
            <p className="text-base text-slate-300 leading-relaxed font-normal">
              כי כשמדובר באחת העסקאות הגדולות בחיים שלכם, אנחנו לא מסתמכים על טכנולוגיה בלבד.{" "}
              <span className="text-white font-medium underline decoration-[#00C896]/60 underline-offset-4">
                כל דוח עובר גם בדיקה אנושית ומקצועית של אנליסט מומחה.
              </span>
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00C896] shrink-0" />
                <span>ניתוח נתונים באמצעות טכנולוגיה מתקדמת</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00C896] shrink-0" />
                <span>כל בדיקה עוברת ניתוח ידני של אנליסט מקצועי</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00C896] shrink-0" />
                <span>דוח מותאם אישית לנכס שלכם</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#0D1522] border border-white/10 p-8 sm:p-10 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-medium text-white">
              לפני שקונים דירה, יודעים מה באמת קונים.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              טכנולוגיה מתקדמת ובדיקה אישית של אנליסט מקצועי. כל המידע החשוב על הנכס בדוח אחד.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xl mx-auto pt-2">
              <Link
                href="/analyze"
                className="sd-btn-primary w-full sm:w-auto justify-center"
              >
                <span>בדקו את הדירה שלי</span>
                <ArrowLeft size={16} />
              </Link>
              <Link href="/report" className="sd-btn-ghost w-full sm:w-auto justify-center">
                צפו בדוח לדוגמה
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              ללא מנוי · בדיקת אנליסט אנושי · תשלום חד־פעמי
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
            <Link href="/staff" className="hover:text-white transition-colors duration-200 ease-out">
              פורטל עובדים (Staff)
            </Link>
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
