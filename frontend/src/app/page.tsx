"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Lock,
  ExternalLink,
  HelpCircle,
  FileText,
  ChevronDown,
  Building,
  Database,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  TrendingUp,
  MapPin
} from "lucide-react";
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
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Data — The 5 Critical Traps SafeDeal Uncovers
───────────────────────────────────────────────────────────── */
const CRITICAL_TRAPS = [
  {
    num: "01",
    tag: "קריטי · סכנת כספים",
    title: "חדלות פירעון וכינוס נכסים של המוכר או היזם",
    desc: "מוכר פרטי או קבלן המצויים בהליכי חדלות פירעון או פשיטת רגל. חתימה ללא אישור נאמן ובית משפט מובילה לעיכוב מוחלט, הקפאת כספי הקונה וביטול הענקות בדיעבד.",
    source: "הממונה על הליכי חדלות פירעון (משרד המשפטים)",
    severity: "red",
  },
  {
    num: "02",
    tag: "שעבוד נסתר",
    title: "משכונות צד ג' והלוואות חוץ-בנקאיות",
    desc: "רוב הרוכשים בודקים רק נסח טאבו, אך הלוואות פרטיות, חובות לחברות מימון או משכונות חוזיים רשומים אך ורק ברשם המשכונות. דירה עם משכון לא ניתנת להעברת בעלות נקייה.",
    source: "רשם המשכונות והבטוחות (רשות התאגידים)",
    severity: "red",
  },
  {
    num: "03",
    tag: "תמחור ושוק",
    title: "תמחור יתר חריג ללא התאמת קומה ומעלית",
    desc: "פער מחיר דרמטי מול עסקאות אמת ברחוב. מודל SafeDeal מבצע התאמת מחיר מדויקת לפי קומת הדירה, קיום מעלית ומיקום יחסי בבניין, כדי שלא תשלמו מאות אלפי שקלים מעל השווי האמיתי.",
    source: "רשות המסים ונדל״ן ממשלתי",
    severity: "amber",
  },
  {
    num: "04",
    tag: "זכויות ובעלות",
    title: "הערות אזהרה סותרות, יורשים וזכויות צד ג׳",
    desc: "הערות לפי סעיף 126 לטובת רוכשים קודמים, סכסוכי גירושין, יורשים שלא הסדירו צוואות או הערות לפי פקודת המסים. כל אלו עלולים למנוע רישום משכנתה והעברת בעלות.",
    source: "לשכת רישום המקרקעין (טאבו)",
    severity: "red",
  },
  {
    num: "05",
    tag: "תכנון והנדסה",
    title: "הפקעות מתוכננות, חריגות ושינויי תב״ע בסביבה",
    desc: "תוכניות מתאר מופקדות המייעדות חלק מהמגרש להפקעה, סלילת כביש סואן מתחת לחלון, או מגדל ענק שיחסום את האור והאוויר. מידע תכנוני שחובה לדעת לפני שנכנסים לעסקה.",
    source: "מינהל התכנון (XPLAN) והנדסה עירונית",
    severity: "amber",
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
  { name: "רשם החברות", label: "אימות קבלן/יזם", desc: "סטטוס פעילות, חברה מפרת חוק, גיל החברה, מנהלים וצווי פירוק" },
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
    traditional: "מאוחר מאוד — אחרי משא ומתן, הסכמה על מחיר והתאהבות רגשית בדירה",
    safedeal: "מוקדם ומיידי — לפני שמוציאים שקל על אנשי מקצוע ולפני שמתחייבים",
  },
  {
    feature: "זמן עד לקבלת תוצאות",
    traditional: "ימים עד שבועות (ממתינים להפקת מסמכים ולבדיקות שונות)",
    safedeal: "סריקה מקיפה ב-3 דקות ודוח אנליסט מאומת",
  },
  {
    feature: "בדיקת חדלות פירעון ורשם המשכונות",
    traditional: "לעתים קרובות נבדק רק סמוך לחתימה או מתפספס בדירות יד שנייה",
    safedeal: "שולב כחלק מובנה מליבת מודל הסיכונים עם כפתור STOP מיידי",
  },
  {
    feature: "התאמת מחיר לפי קומה ומעלית",
    traditional: "הסתמכות על 'תחושת בטן' של מתווך או מודעות יד2 (מחירי ביקוש לא אמיתיים)",
    safedeal: "חישוב מתמטי לפי עסקאות אמת ברשות המסים + התאמת קומה ומיקום יחסי",
  },
  {
    feature: "מדד סיכון מספרי ברור",
    traditional: "אין ציון — רק ערימת מסמכים וחוות דעת מלל מסורבלות",
    safedeal: "ציון SafeScore מ-0 עד 100 עם מפת סיכונים צבעונית ופשוטה להבנה",
  },
  {
    feature: "עלות הבדיקה",
    traditional: "אלפי שקלים (עו״ד, שמאי מקרקעין ובדק בית) עוד לפני שיודעים אם העסקה תקינה",
    safedeal: "סינון מוקדם במחיר שווה לכל נפש, החוסך אלפי שקלים ועוגמת נפש",
  },
];

/* ─────────────────────────────────────────────────────────────
   Data — Frequently Asked Questions
───────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "האם דוח SafeDeal מחליף עורך דין או שמאי מקרקעין?",
    a: "לא. SafeDeal הוא כלי סינון מוקדם (Early Pre-screening) שנועד להעצים אתכם ואת עורך הדין שלכם. במקום לגלות דגלים אדומים ברגע האחרון כשהשקעתם כבר אלפי שקלים על שמאי ומהנדס, SafeDeal מציגה לכם את התמונה המלאה כבר בשלב ההתעניינות ומספקת לעורך הדין מפת סיכונים מדויקת לחוזה.",
  },
  {
    q: "האם המוכר או המתווך יודעים שביצעתי בדיקה על הנכס?",
    a: "ממש לא. הבדיקה דיסקרטית לחלוטין. כל השאילתות מתבצעות ישירות מול מאגרי המידע הרשמיים והפומביים של מדינת ישראל, ללא כל פנייה למוכר, ליזם או לגורם תיווך.",
  },
  {
    q: "מה קורה אם אין לי את מספר הגוש והחלקה או את קומת הדירה?",
    a: "אין שום בעיה. המערכת כוללת מנוע איתור קדסטרלי אוטונומי מ-GovMap שיודע לאתר את הגוש והחלקה ישירות מהכתובת. בנוסף, בהתאם למודל SafeDeal, מידע חסר אינו מעניש בציון ואינו מייצר Red Flag — המערכת פשוט תתאים את שווי השוק בדיוק המתאים למידע הזמין.",
  },
  {
    q: "מהי בדיקת חדלות הפירעון ומדוע היא קריטית?",
    a: "בדיקת חדלות פירעון במשרד המשפטים בודקת האם המוכר (או היזם) מצוי בהליכי פשיטת רגל או חדלות פירעון פעילים. חתימה עם מוכר כזה ללא צו מפורש מבית משפט הינה עבירה חמורה שעלולה להוביל לאובדן המקדמה ולביטול עסקת המכר.",
  },
  {
    q: "כמה זמן לוקח לקבל את הדוח המלא?",
    a: "מילוי הטופס אורך כ-3 דקות בלבד. הנתונים נקשרים מיידית לתיק נאותות במערכת האנליסטים, ובדיקת המאגרים מתבצעת ברציפות לשם הפקת דוח נאותות מהימן.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [fastAddress, setFastAddress] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleFastSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/analyze");
  };

  return (
    <div className="relative bg-[#060E1C] text-white min-h-screen overflow-hidden selection:bg-[#00C896]/30 selection:text-white" dir="rtl">
      
      {/* ═══════════════════════════════════════════════════════
          FLOATING NAVIGATION BAR
      ═══════════════════════════════════════════════════════ */}
      <header className="fixed top-4 left-4 right-4 sm:left-8 sm:right-8 z-50 max-w-6xl mx-auto">
        <nav className="flex items-center justify-between px-5 sm:px-8 py-3.5 rounded-2xl bg-[#060E1C]/85 backdrop-blur-2xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <SafeDealLogo size="sm" />
          
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#traps" className="hover:text-white transition-colors">הסיכונים הנסתרים</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">איך זה עובד</a>
            <a href="#sources" className="hover:text-white transition-colors">11 המאגרים</a>
            <a href="#comparison" className="hover:text-white transition-colors">השוואה</a>
            <a href="#legal" className="hover:text-white transition-colors">גילוי נאות</a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/report"
              className="hidden sm:inline text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              דוח לדוגמה
            </Link>
            <Link
              href="/analyze"
              className="sd-btn-primary text-xs py-2.5 px-4 sm:px-5 font-bold shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:shadow-[0_6px_28px_rgba(0,200,150,0.5)]"
            >
              התחילו בדיקה (3 דקות)
            </Link>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — High Authority & Interactive Input
      ═══════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen px-6 pt-36 pb-20 overflow-hidden">
        
        {/* Ambient mesh glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,200,150,0.14)_0%,rgba(30,68,120,0.09)_45%,transparent_75%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-[#1E4478]/25 blur-3xl pointer-events-none" />

        {/* Tagline Badge */}
        <Reveal delay={0}>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#00C896]/35 bg-[#00C896]/10 backdrop-blur-md mb-8 shadow-[0_0_25px_rgba(0,200,150,0.15)]">
            <Sparkles size={14} className="text-[#00C896]" />
            <span className="text-xs sm:text-sm font-bold tracking-wider text-[#2DD4BF] uppercase">
              בדיקת נאותות חכמה לנדל״ן בישראל · מבוסס 11 מאגרי מידע רשמיים
            </span>
          </div>
        </Reveal>

        {/* Display Header */}
        <Reveal delay={0.15}>
          <h1
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.14] max-w-4xl mb-7 tracking-tight text-white drop-shadow-md"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            לא קונים דירה לפני שעושים{" "}
            <span className="text-[#00C896] underline decoration-[#00C896]/40 underline-offset-8">
              SafeDeal.
            </span>
            <br className="hidden sm:block" />
            <span className="text-[#FAF8F5] block mt-3 font-medium text-2xl sm:text-4xl md:text-5xl">
              כי יש דברים שאסור לגלות אחרי שחותמים על החוזה.
            </span>
          </h1>
        </Reveal>

        {/* Subtitle */}
        <Reveal delay={0.25}>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-10 font-normal">
            סריקה והצלבה מיידית מ-11 מאגרים ממשלתיים ומשפטיים לאיתור שעבודים, עיקולים, פשיטות רגל, פערי שווי והערות אזהרה — דוח נאותות מקיף עם ציון SafeScore ברור, לפני שאתם מתחייבים למיליונים.
          </p>
        </Reveal>

        {/* Fast Address Search Box */}
        <Reveal delay={0.35} className="w-full max-w-2xl mb-12">
          <form
            onSubmit={handleFastSearch}
            className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[#0A1628]/90 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          >
            <div className="relative flex-1 w-full flex items-center pr-3">
              <MapPin size={18} className="text-[#00C896] ml-2 shrink-0 opacity-80" />
              <input
                type="text"
                value={fastAddress}
                onChange={(e) => setFastAddress(e.target.value)}
                placeholder="הזינו כתובת (למשל: רוטשילד 45, תל אביב) או גוש וחלקה..."
                className="w-full bg-transparent py-3 pr-2 pl-4 text-white text-sm placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="sd-btn-primary w-full sm:w-auto text-sm px-6 py-3.5 font-bold shrink-0 shadow-[0_6px_25px_rgba(0,200,150,0.4)]"
            >
              <Search size={16} />
              התחילו בדיקה (3 דקות)
              <ArrowLeft size={16} />
            </button>
          </form>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            🔒 דיסקרטי לחלוטין · ללא שדות חובה · המוכר או המתווך אינם מיודעים
          </p>
        </Reveal>

        {/* Trust Pill Bar */}
        <Reveal delay={0.45}>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs font-semibold text-[#5EEAD4] bg-[#0A1628]/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#00C896]" /> סריקה מקיפה ב-3 דקות
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#00C896]" /> בדיקת חדלות פירעון רשמית
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#00C896]" /> 11 מאגרי מידע מחוברים
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[#00C896]" /> מדד סיכון משוקלל (SafeScore)
            </span>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — THE 5 CRITICAL TRAPS
      ═══════════════════════════════════════════════════════ */}
      <section id="traps" className="relative px-6 sm:px-10 py-24 sm:py-32 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              מה מסתתר מאחורי הדירה?
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-6 max-w-3xl text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            רוב הרוכשים בודקים את המטבח ואת הנוף.{" "}
            <span className="text-slate-400 block mt-2 text-2xl sm:text-3xl font-sans font-normal">
              מעטים בודקים את המלכודות המשפטיות שעלולות לעלות מאות אלפי שקלים.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base text-slate-300 max-w-2xl mb-14 leading-relaxed font-normal">
            עסקת מקרקעין היא ההשקעה הגדולה ביותר של מרבית הישראלים. אלו 5 המלכודות השכיחות ביותר ש-SafeDeal מאתרת עבורכם עוד לפני שפניתם לשמאי או לעורך דין:
          </p>
        </Reveal>

        {/* 5 Traps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CRITICAL_TRAPS.map((trap, i) => (
            <Reveal
              key={trap.num}
              delay={0.08 + i * 0.08}
              className={i === 0 ? "md:col-span-2 lg:col-span-2" : "col-span-1"}
            >
              <div
                className={`group relative h-full rounded-2xl p-7 transition-all duration-300 flex flex-col justify-between ${
                  i === 0
                    ? "bg-gradient-to-br from-[#0D2037] via-[#0A1628] to-[#142A4A] border border-[#00C896]/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    : "bg-[#0A1628]/85 border border-white/12 shadow-xl hover:border-white/25 hover:-translate-y-1"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-serif text-3xl font-extrabold text-[#00C896]/40 group-hover:text-[#00C896] transition-colors"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {trap.num}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                        trap.severity === "red"
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {trap.tag}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 group-hover:text-[#2DD4BF] transition-colors">
                    {trap.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {trap.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <Database size={13} className="text-[#00C896]" />
                  <span>מקור אימות: {trap.source}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (3 SIMPLE STEPS)
      ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative px-6 sm:px-10 py-24 sm:py-32 bg-[#081324] border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[#00C896]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
                פשוט, מהיר ואוטונומי
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-14 text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              איך זה עובד?{" "}
              <span className="text-[#00C896]">3 שלבים לשקט נפשי מוחלט.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "ממלאים פרטים בסיסיים על הנכס",
                desc: "כתובת, קומה (או סימון 'לא ידוע'), ומחיר מבוקש. אין שדות חובה מיותרים — ממלאים את מה שידוע לכם תוך 3 דקות.",
                icon: MapPin,
              },
              {
                step: "02",
                title: "מנוע ה-AI סורק ומצליב 11 מאגרים",
                desc: "סריקה אוטונומית של טאבו, רשם המשכונות, תיקי חדלות פירעון, עסקאות רשות המסים, תוכניות XPLAN ותביעות משפטיות.",
                icon: Database,
              },
              {
                step: "03",
                title: "מקבלים דוח נאותות ניהולי מלא",
                desc: "ציון בטיחות SafeScore, מפת סיכונים צבעונית, 5 ממצאי מפתח והנחיות אופרטיביות שמעבירים ישירות לעורך הדין.",
                icon: ShieldCheck,
              },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <Reveal key={step} delay={0.1 + i * 0.12}>
                <div className="relative p-8 rounded-2xl bg-[#0A1628] border border-white/12 shadow-xl hover:border-[#00C896]/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="font-serif text-4xl font-extrabold text-[#00C896]/40"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#00C896]/10 border border-[#00C896]/30 flex items-center justify-center text-[#00C896]">
                      <Icon size={20} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — THE 11 OFFICIAL GOVERNMENT DATA SOURCES
      ═══════════════════════════════════════════════════════ */}
      <section id="sources" className="relative px-6 sm:px-10 py-24 sm:py-32 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              עוצמת המידע
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-6 text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            11 מאגרי מידע לאומיים —{" "}
            <span className="text-[#00C896]">מרוכזים במקום אחד.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-base text-slate-300 max-w-2xl mb-14 leading-relaxed font-normal">
            במקום לעבור בין עשרות אתרים ממשלתיים, להזין נתונים בנפרד ולשלם אגרות כפולות — SafeDeal מצליבה את כל המאגרים הרשמיים ומספקת תמונת מצב אחידה ומדויקת:
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SOURCES_11.map((src, i) => (
            <Reveal key={src.name} delay={0.04 + i * 0.04}>
              <div
                className={`p-6 rounded-2xl border transition-all duration-300 h-full flex flex-col justify-between ${
                  src.highlight
                    ? "bg-[#0A1628] border-[#00C896]/60 shadow-[0_10px_30px_rgba(0,200,150,0.15)]"
                    : "bg-[#0A1628]/70 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-[#00C896] uppercase tracking-wider">
                      {src.name}
                    </span>
                    {src.highlight && (
                      <span className="text-[9px] uppercase tracking-widest text-[#00C896] bg-[#00C896]/15 border border-[#00C896]/30 px-2 py-0.5 rounded-full font-bold">
                        חדש במודל 2026
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{src.label}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">{src.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — REAL REPORT SHOWCASE
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-24 sm:py-32 bg-[#081324] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[#00C896]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
                תוצר הבדיקה
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-12 text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              דוח נאותות מנהלים —{" "}
              <span className="text-slate-400 font-sans font-normal block mt-2 text-2xl sm:text-3xl">
                ברור, מדויק ומגובה באסמכתאות רשמיות.
              </span>
            </h2>
          </Reveal>

          {/* Interactive Report Card Mockup */}
          <Reveal delay={0.2}>
            <div className="rounded-2xl border border-white/20 bg-[#0A1628] shadow-[0_25px_70px_rgba(0,0,0,0.7)] overflow-hidden">
              {/* Header Chrome */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#060E1C]/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-[#00C896]/80" />
                  <span className="text-xs text-slate-400 font-mono mr-3">SafeDeal Report #SD-61582</span>
                </div>
                <span className="text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  מאושר ע״י אנליסט
                </span>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-10 space-y-8">
                {/* Score & Property Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block mb-1">
                      מדד תקינות עסקה משוקלל
                    </span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl sm:text-6xl font-serif font-extrabold text-[#00C896]">84</span>
                      <span className="text-2xl text-slate-400">/ 100</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold mr-2">
                        רמת סיכון: נמוכה-בינונית
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">רחוב רוטשילד 45, תל אביב-יפו</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">גוש 6158 · חלקה 42 · דירת 4 חדרים (קומה 4 מתוך 8)</p>
                  </div>
                </div>

                {/* Quick Risk Map Pills */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">מפת סיכונים מהירה (Quick Risk Map)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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
                        className={`p-3 rounded-xl border text-center ${
                          item.ok
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        }`}
                      >
                        <p className="text-xs font-bold">{item.label}</p>
                        <p className="text-[10px] opacity-80 mt-0.5">{item.sub || (item.ok ? "תקין" : "לבדיקה")}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Findings List */}
                <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">ממצאי מפתח מרכזיים (Top Findings)</p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span><b>חדלות פירעון:</b> לא אותרו הליכי חדלות פירעון פעילים על שם המוכר במאגר משרד המשפטים.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      <span><b>התאמת קומה:</b> נתוני קומה מלאים (קומה 4 מתוך 8 עם מעלית) — מחיר המבוקש תואם את עסקאות הסביבה.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                      <span><b>הערה משפטית:</b> קיימת משכנתה קיימת לטובת בנק לאומי — מומלץ לוודא מכתב כוונות מסודר.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center pt-2">
                  <Link
                    href="/report"
                    className="sd-btn-ghost text-xs font-bold px-7 py-3 inline-flex items-center gap-2"
                  >
                    <FileText size={15} />
                    צפייה בדוח מלא לדוגמה
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 6 — COMPARISON MATRIX
      ═══════════════════════════════════════════════════════ */}
      <section id="comparison" className="relative px-6 sm:px-10 py-24 sm:py-32 max-w-6xl mx-auto">
        <Reveal>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-[#00C896]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
              למה SafeDeal?
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-12 text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            בדיקה שגרתית מול בדיקת נאותות SafeDeal
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="border border-white/15 rounded-2xl overflow-hidden bg-[#0A1628]/80 shadow-2xl">
            <div className="grid grid-cols-12 bg-[#060E1C] p-4 text-xs font-bold uppercase tracking-wider border-b border-white/10">
              <div className="col-span-4 text-slate-400">מאפיין הבדיקה</div>
              <div className="col-span-4 text-slate-400">בדיקה שגרתית מסורתית</div>
              <div className="col-span-4 text-[#00C896]">SafeDeal PropTech</div>
            </div>

            <div className="divide-y divide-white/10">
              {COMPARISON_ROWS.map((row, i) => (
                <div key={i} className="grid grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm items-center hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 font-bold text-white">{row.feature}</div>
                  <div className="col-span-4 text-slate-400 leading-relaxed pr-2">{row.traditional}</div>
                  <div className="col-span-4 text-emerald-300 font-medium leading-relaxed pr-2">{row.safedeal}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 7 — FREQUENTLY ASKED QUESTIONS (FAQ)
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-24 sm:py-32 bg-[#081324] border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-[#00C896]" />
              <span className="text-xs font-bold tracking-[0.2em] text-[#2DD4BF] uppercase">
                שאלות ותשובות
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.18] mb-12 text-white"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              שאלות נפוצות על הבדיקה
            </h2>
          </Reveal>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={i} delay={0.06 + i * 0.06}>
                  <div className="border border-white/12 rounded-2xl bg-[#0A1628]/70 overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-right font-bold text-sm sm:text-base text-white hover:text-[#00C896] transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 transition-transform duration-200 shrink-0 mr-4 ${
                          isOpen ? "rotate-180 text-[#00C896]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 8 — MANDATORY LEGAL DISCLAIMER & TRANSPARENCY
      ═══════════════════════════════════════════════════════ */}
      <section id="legal" className="relative px-6 sm:px-10 py-20 max-w-6xl mx-auto">
        <Reveal>
          <div className="p-8 rounded-2xl border border-white/15 bg-[#0A1628]/50 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4 text-[#00C896]">
              <Scale size={20} />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                עניינים משפטיים, רגולציה וגילוי נאות מחייב
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed">
              <div>
                <b className="text-white block mb-1">כלי סינון מוקדם (Early Pre-screening)</b>
                שירות SafeDeal הינו כלי אנליטי-טכנולוגי לסינון מוקדם של נכסים המרכז ומנתח נתונים ממאגרי מידע ממשלתיים וציבוריים. המידע, הניתוחים והציונים המוצגים אינם מהווים חוות דעת משפטית מחייבת, חוות דעת שמאית או בדיקה הנדסית, ואינם תחליף לייעוץ משפטי של עורך דין, שמאי מקרקעין או מהנדס מוסמך.
              </div>

              <div>
                <b className="text-white block mb-1">הגנת הפרטיות ואבטחת מידע</b>
                המערכת פועלת בהתאם לתקנות הגנת הפרטיות (אבטחת מידע) תשע״ז-2017. כל המידע המוזן במערכת מוצפן בפרוטוקול SSL/TLS בדרגת אבטחה בנקאית (256-bit). SafeDeal מקפידה על דיסקרטיות מוחלטת ואינה מעבירה את פרטי המשתמש או הנכס הנבדק למוכרים, מתווכים או גורמים בלתי מורשים.
              </div>

              <div>
                <b className="text-white block mb-1">שימוש במאגרים ממשלתיים פתוחים</b>
                איסוף המידע מתבצע בהתאם לתנאי השימוש במאגרי המידע הממשלתיים הפתוחים של מדינת ישראל (GovMap, משרד המשפטים, רשות המסים, מינהל התכנון והלמ״ס). הנתונים נכונים למועד הפקת הדוח ומשקפים את הרשומות הציבוריות בלבד.
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 9 — HIGH IMPACT FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 sm:px-10 py-28 sm:py-36 text-center overflow-hidden border-t border-white/10">
        <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[500px] rounded-full bg-[#00C896]/12 blur-3xl pointer-events-none" />

        <Reveal>
          <div className="w-12 h-[2px] bg-[#00C896] mx-auto mb-8" />
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.12] max-w-3xl mx-auto mb-7 text-white"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            אל תגלו את הסיכונים{" "}
            <br className="hidden sm:block" />
            <span className="text-[#00C896] block mt-2">אחרי שחתמתם על החוזה.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
            SafeDeal סורקת ומאתרת את כל הסיכונים המשפטיים, ההנדסיים והתכנוניים — בדוח אחד ברור בתוך 3 דקות, לפני שאתם מתחייבים למיליונים.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto">
            <Link
              href="/analyze"
              className="sd-btn-primary text-base px-9 py-4 font-extrabold shadow-[0_10px_35px_rgba(0,200,150,0.45)] w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <Search size={18} />
              בדקו את הדירה עכשיו (ללא שדות חובה)
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/report"
              className="sd-btn-ghost text-sm font-bold px-8 py-4 w-full sm:w-auto"
            >
              ראו דוח לדוגמה
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/12 px-6 sm:px-10 py-12 text-center bg-[#060E1C]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <SafeDealLogo size="xs" />
          
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} SafeDeal PropTech Ltd. כל הזכויות שמורות.
          </p>

          <div className="flex gap-6 text-xs text-slate-400 font-medium">
            <Link href="/staff" className="hover:text-white transition-colors">פורטל עובדים (Staff)</Link>
            <a href="#legal" className="hover:text-white transition-colors">גילוי נאות משפטי</a>
            <a href="#legal" className="hover:text-white transition-colors">מדיניות פרטיות</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
