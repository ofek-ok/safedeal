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
  Database,
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
    title: "חדלות פירעון וכינוס נכסים של המוכר או היזם",
    desc: "מוכר פרטי או קבלן המצויים בהליכי חדלות פירעון או פשיטת רגל. חתימה ללא אישור נאמן ובית משפט עלולה להוביל לעיכוב העסקה, הקפאת כספי הקונה וביטול העברה בדיעבד.",
    source: "הממונה על הליכי חדלות פירעון (משרד המשפטים)",
    severity: "high",
  },
  {
    num: "02",
    tag: "שעבוד נסתר",
    title: "משכונות צד ג׳ והלוואות חוץ-בנקאיות",
    desc: "רוב הרוכשים בודקים רק נסח טאבו, אך הלוואות פרטיות, חובות לחברות מימון ומשכונות חוזיים רשומים ברשם המשכונות. דירה עם משכון פתוח לא ניתנת להעברת בעלות נקייה.",
    source: "רשם המשכונות והבטוחות (רשות התאגידים)",
    severity: "high",
  },
  {
    num: "03",
    tag: "תמחור ושוק",
    title: "תמחור יתר חריג ללא התאמת קומה ומעלית",
    desc: "פער מחיר משמעותי מול עסקאות אמת ברחוב. מודל SafeDeal מבצע התאמת שווי לפי קומת הדירה, קיום מעלית ומיקום יחסי בבניין, כדי שלא תשלמו מעל השווי הריאלי.",
    source: "רשות המסים ומאגר נדל״ן ממשלתי",
    severity: "medium",
  },
  {
    num: "04",
    tag: "זכויות ובעלות",
    title: "הערות אזהרה סותרות, יורשים וזכויות צד ג׳",
    desc: "הערות לפי סעיף 126 לטובת רוכשים קודמים, סכסוכי גירושין, יורשים שלא הסדירו צוואות או עיקולים לפי פקודת המסים. כל אלו עלולים למנוע רישום משכנתה והעברת בעלות.",
    source: "לשכת רישום המקרקעין (טאבו)",
    severity: "high",
  },
  {
    num: "05",
    tag: "תכנון והנדסה",
    title: "הפקעות מתוכננות, חריגות ושינויי תב״ע בסביבה",
    desc: "תוכניות מתאר מופקדות המייעדות חלק מהמגרש להפקעה, סלילת כביש סמוך או בנייה גבוהה בסמוך לדירה. מידע תכנוני שכדאי לבדוק לפני שנכנסים לעסקה.",
    source: "מינהל התכנון (XPLAN) והנדסה עירונית",
    severity: "medium",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — The 11 Government & Legal Intelligence Sources
───────────────────────────────────────────────────────────── */
const SOURCES_11 = [
  { name: "GovMap", label: "המרכז למיפוי ישראל", desc: "זיהוי קדסטרלי חד-ערכי, גוש וחלקה, קואורדינטות ושכבות GIS ממשלתיות" },
  { name: "טאבו", label: "לשכת רישום המקרקעין", desc: "בעלי זכויות, חלקים בנכס, משכנתאות, עיקולים, צווי בית משפט והערות אזהרה" },
  { name: "חדלות פירעון", label: "משרד המשפטים", desc: "איתור הליכי פשיטת רגל, כינוס נכסים וחדלות פירעון של מוכרים ויזמים", highlight: true },
  { name: "רשם המשכונות", label: "רשות התאגידים", desc: "בדיקת שעבודים אישיים, הלוואות חוץ-בנקאיות ובטוחות לפי ת״ז וח״פ" },
  { name: "רשות המסים", label: "מידע נדל״ן רשמי", desc: "עסקאות אמת שבוצעו בפועל ברחוב ובשכונה, מחירי מ״ר היסטוריים ומגמות" },
  { name: "נדל״ן ממשלתי", label: "משרד הבינוי והשיכון", desc: "מדדי מחירי עסקאות, פילוח שכונתי ומאגר עסקאות משלים" },
  { name: "XPLAN", label: "מינהל התכנון", desc: "תוכניות בניין עיר (תב״ע), תוכניות מופקדות ומאושרות, ייעודי קרקע והפקעות" },
  { name: "רשם החברות", label: "אימות קבלן / יזם", desc: "סטטוס פעילות, חברה מפרת חוק, גיל החברה, מנהלים וצווי פירוק" },
  { name: "התחדשות עירונית", label: "הרשות הממשלתית", desc: "בדיקה האם הנכס נכלל במתחם פינוי-בינוי מוכרז וסטטוס התקדמות הפרויקט" },
  { name: "הלמ״ס", label: "הלשכה המרכזית לסטטיסטיקה", desc: "דירוג סוציו-אקונומי שכונתי, נתוני אוכלוסייה ומדדי פיתוח אזוריים" },
  { name: "בתי המשפט / נבו", label: "מערכת המשפט", desc: "סריקת תביעות דיירים, סכסוכי גבולות, תביעות ליקויי בנייה ואיחורי מסירה" },
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
    safedeal: "מילוי טופס תוך כ-3 דקות והעברה ישירה לתיק אנליסט לאימות",
  },
  {
    feature: "בדיקת חדלות פירעון ורשם המשכונות",
    traditional: "לעתים קרובות נבדק רק סמוך לחתימה או מתפספס בדירות יד שנייה",
    safedeal: "משולב כחלק מובנה ממודל הסיכונים עם התרעת עצירה מוקדמת",
  },
  {
    feature: "התאמת מחיר לפי קומה ומעלית",
    traditional: "הסתמכות על הערכת מתווך או מודעות יד2 (מחירי ביקוש)",
    safedeal: "חישוב לפי עסקאות אמת ברשות המסים + התאמת קומה ומיקום יחסי",
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
    a: "לא. הבדיקה דיסקרטית. השאילתות מתבצעות מול מאגרי המידע הרשמיים והפומביים של מדינת ישראל, ללא פנייה למוכר, ליזם או לגורם תיווך.",
  },
  {
    q: "מה קורה אם אין לי את מספר הגוש והחלקה או את קומת הדירה?",
    a: "המערכת כוללת איתור קדסטרלי מ-GovMap שמאתר את הגוש והחלקה ישירות מהכתובת. בנוסף, נתון חסר אינו מוריד ציון ואינו מייצר התרעת שווא — המערכת מתאימה את ניתוח השווי למידע הזמין.",
  },
  {
    q: "מהי בדיקת חדלות הפירעון ומדוע היא קריטית?",
    a: "בדיקת חדלות פירעון במשרד המשפטים בודקת האם המוכר או היזם מצויים בהליכי פשיטת רגל או חדלות פירעון פעילים. חתימה עם מוכר בהליך כזה ללא צו מפורש מבית משפט עלולה להוביל לאובדן המקדמה ולביטול עסקת המכר.",
  },
  {
    q: "כמה זמן לוקח לקבל את הדוח המלא?",
    a: "מילוי הטופס אורך כ-3 דקות. הנתונים נקשרים לתיק נאותות במערכת האנליסטים, ובדיקת המאגרים מתבצעת ברציפות להפקת הדוח.",
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
            <a href="#sources" className="hover:text-white transition-colors duration-200 ease-out">
              11 המאגרים
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
            בדיקת נאותות לנדל״ן בישראל · 11 מאגרי מידע רשמיים
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium leading-[1.15] text-white mb-6">
            לא קונים דירה לפני שעושים{" "}
            <span className="text-[#00C896]">SafeDeal</span>.
            <span className="block text-slate-300 font-normal text-2xl sm:text-3xl md:text-4xl mt-4 leading-[1.3]">
              כי יש דברים שאסור לגלות אחרי שחותמים על החוזה.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
            הצלבת נתונים מ-11 מאגרים ממשלתיים ומשפטיים לאיתור שעבודים, עיקולים, הליכי חדלות פירעון, פערי שווי והערות אזהרה — בדוח נאותות אחד עם ציון SafeScore, לפני שמתחייבים לעסקה.
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
              <span>התחילו בדיקה (כ-3 דקות)</span>
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
            רוב הרוכשים בודקים את המטבח ואת הנוף.
            <span className="block text-slate-400 font-normal text-xl sm:text-2xl mt-2">
              מעטים בודקים את המלכודות המשפטיות שעלולות לעלות מאות אלפי שקלים.
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
                  <Database size={14} className="text-[#00C896] shrink-0" />
                  <span>מקור אימות: {trap.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (3 STEPS)
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 py-16 sm:py-24 bg-[#0D1522] border-y border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium text-[#00C896] mb-3">
            תהליך הבדיקה
          </p>

          <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-12 text-white">
            שלושה שלבים מהכתובת ועד לדוח הנאותות
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "ממלאים פרטים בסיסיים על הנכס",
                desc: "כתובת, קומה (או סימון ׳לא ידוע׳), ומחיר מבוקש. ללא שדות חובה מיותרים — ממלאים את מה שידוע לכם תוך כ-3 דקות.",
              },
              {
                step: "02",
                title: "הצלבת 11 מאגרי מידע רשמיים",
                desc: "איסוף והצלבה של נתוני טאבו, רשם המשכונות, תיקי חדלות פירעון, עסקאות רשות המסים, תוכניות XPLAN ותביעות משפטיות.",
              },
              {
                step: "03",
                title: "קבלת דוח נאותות מסודר",
                desc: "ציון SafeScore, מפת סיכונים לפי תחום, 5 ממצאי מפתח והנחיות לבדיקה שניתן להעביר ישירות לעורך הדין.",
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — THE 11 OFFICIAL GOVERNMENT DATA SOURCES
      ═══════════════════════════════════════════════════════ */}
      <section id="sources" className="px-6 py-16 sm:py-24 max-w-6xl mx-auto">
        <p className="text-sm font-medium text-[#00C896] mb-3">
          מקורות המידע
        </p>

        <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-4 text-white">
          11 מאגרי מידע לאומיים — במקום אחד
        </h2>

        <p className="text-base text-slate-300 max-w-2xl mb-12 leading-relaxed font-normal">
          במקום לעבור בין אתרים ממשלתיים שונים, להזין נתונים בנפרד ולשלם אגרות כפולות — SafeDeal מצליבה את כל המאגרים הרשמיים ומציגה תמונת מצב אחידה:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOURCES_11.map((src) => (
            <div
              key={src.name}
              className={`p-6 rounded-xl border transition-colors duration-200 ease-out flex flex-col justify-between ${
                src.highlight
                  ? "bg-[#121C2D] border-[#00C896]/40"
                  : "bg-[#0D1522] border-white/[0.08] hover:border-white/20"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-[#00C896]">
                    {src.name}
                  </span>
                  {src.highlight && (
                    <span className="text-xs text-[#00C896] bg-[#00C896]/10 border border-[#00C896]/30 px-2 py-1 rounded-lg font-medium">
                      חדש במודל 2026
                    </span>
                  )}
                </div>
                <h4 className="text-base font-medium text-white mb-2">{src.label}</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {src.desc}
                </p>
              </div>
            </div>
          ))}
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
              שירות SafeDeal הינו כלי אנליטי-טכנולוגי לסינון מוקדם של נכסים המרכז ומנתח נתונים ממאגרי מידע ממשלתיים וציבוריים. המידע, הניתוחים והציונים המוצגים אינם מהווים חוות דעת משפטית מחייבת, חוות דעת שמאית או בדיקה הנדסית, ואינם תחליף לייעוץ של עורך דין, שמאי מקרקעין או מהנדס מוסמך.
            </div>

            <div>
              <span className="font-medium text-white block mb-2">
                הגנת הפרטיות ואבטחת מידע
              </span>
              המערכת פועלת בהתאם לתקנות הגנת הפרטיות (אבטחת מידע) תשע״ז-2017. המידע המוזן במערכת מוצפן בפרוטוקול SSL/TLS (256-bit). SafeDeal שומרת על דיסקרטיות ואינה מעבירה את פרטי המשתמש או הנכס הנבדק למוכרים, מתווכים או גורמים בלתי מורשים.
            </div>

            <div>
              <span className="font-medium text-white block mb-2">
                שימוש במאגרים ממשלתיים פתוחים
              </span>
              איסוף המידע מתבצע בהתאם לתנאי השימוש במאגרי המידע הממשלתיים הפתוחים של מדינת ישראל (GovMap, משרד המשפטים, רשות המסים, מינהל התכנון והלמ״ס). הנתונים נכונים למועד הפקת הדוח ומשקפים את הרשומות הציבוריות בלבד.
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 sm:py-24 border-t border-white/[0.08]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl text-right">
            <h2 className="text-3xl sm:text-4xl font-medium leading-[1.2] mb-4 text-white">
              בדקו את העסקה לפני שמתחייבים למיליונים.
            </h2>
            <p className="text-base text-slate-300 leading-relaxed font-normal">
              SafeDeal מצליבה את הממצאים המשפטיים, התכנוניים והשמאיים בדוח אחד ברור, כדי שתגיעו לשולחן החתימות עם כל הנתונים.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#0D1522] border border-[#00C896]/50 text-[#00C896] hover:bg-[#121C2D] text-sm font-medium transition-colors duration-200 ease-out"
            >
              <span>התחילו בדיקה (ללא שדות חובה)</span>
              <ArrowLeft size={16} />
            </Link>
            <Link href="/report" className="sd-btn-ghost">
              ראו דוח לדוגמה
            </Link>
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
