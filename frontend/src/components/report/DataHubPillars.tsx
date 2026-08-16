"use client";

import {
  Scale,
  TrendingUp,
  Building,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LucideIcon,
  ShieldCheck,
  Info,
} from "lucide-react";
import { SourceVerificationTooltip } from "@/components/report/SourceVerificationTooltip";

type StatusType = "green" | "yellow" | "red";

interface PillarMetric {
  label: string;
  value: string;
  status: StatusType;
  details?: string;
}

interface Pillar {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  metrics: PillarMetric[];
}

const PILLARS: Pillar[] = [
  {
    id: "cadastral",
    title: "1. זכויות משפטיות וטאבו",
    subtitle: "פנקסי מקרקעין, בעלות, משכנתאות ועיקולים",
    icon: Scale,
    metrics: [
      {
        label: "סטטוס רישום זכויות",
        value: "בעלות פרטית נקייה (רשומה בטאבו)",
        status: "green",
        details: "הזכויות רשומות כהלכה בפנקסי המקרקעין ללא עננה משפטית.",
      },
      {
        label: "הערות אזהרה ועיקולים",
        value: "אין הערות סותרות (משכנתה בודדת)",
        status: "green",
        details: "רשומה משכנתה פעילה לטובת בנק לאומי שתוסר במעמד המכירה.",
      },
      {
        label: "צווים ושיעבודים",
        value: "לא נמצאו צווים שיפוטיים או עיקולים",
        status: "green",
        details: "בדיקת רשם המשכונות ופנקס הבתים המשותפים נקייה.",
      },
    ],
  },
  {
    id: "economic",
    title: "2. שווי נכס ומחירי עסקאות",
    subtitle: "עסקאות השוואה ברשות המסים ומגמות שוק",
    icon: TrendingUp,
    metrics: [
      {
        label: "עסקאות השוואה באזור",
        value: "12 עסקאות דומות ברדיוס 500 מטר",
        status: "green",
        details: "מחיר עומד על ₪40,500 למ״ר בהשוואה לממוצע של ₪39,800 למ״ר.",
      },
      {
        label: "מחיר ממוצע למ״ר",
        value: "₪40,500 למ״ר (סטייה זעירה +1.8%)",
        status: "yellow",
        details: "המחיר סביר למבנה שמור אך מומלץ למצות משא ומתן קל.",
      },
      {
        label: "תשואה שכירות צפויה",
        value: "3.4% שנתית (שכ״ד ממוצע ₪7,200/חודש)",
        status: "green",
        details: "ביקוש גבוה מאוד לשכירות באזור זה.",
      },
    ],
  },
  {
    id: "planning",
    title: "3. תכנון עירוני והתחדשות",
    subtitle: "תוכניות תב״ע, התחדשות עירונית ותשתיות",
    icon: Building,
    metrics: [
      {
        label: "פינוי-בינוי / תמ״א 38",
        value: "תוכנית התחדשות עירונית בתוקף (תא/5000)",
        status: "green",
        details: "הבניין נכלל במתחם מועדף להתחדשות בעתיד.",
      },
      {
        label: "תוכניות בניין עיר עתידיות",
        value: "עבודות תשתיות במרחק 250 מטר",
        status: "yellow",
        details: "מתוכנן תוואי הרכבת הירוק (מטרד רעש זמני בשנתיים הקרובות).",
      },
      {
        label: "זכויות בנייה נותרות",
        value: "נוצלו במלואן לפי תוכנית ג1",
        status: "green",
        details: "אין חריגות תכנוניות משמעותיות בבניין.",
      },
    ],
  },
  {
    id: "engineering",
    title: "4. היתרי בנייה ומצב הנדסי",
    subtitle: "תיק בניין עירוני, היתרים וחריגות בנייה",
    icon: Wrench,
    metrics: [
      {
        label: "מצב תיק בניין עירוני",
        value: "תיק בניין קיים ומאומת בארכיב העירייה",
        status: "green",
        details: "התשריט והיתר הבנייה המקורי אותרו בהצלחה.",
      },
      {
        label: "היתרי בנייה ושינויים",
        value: "סגירת מרפסת דורשת אימות נוסף",
        status: "yellow",
        details: "סגירת המרפסת משנת 2008 אינה מופיעה במפורש בהיתר הבנייה.",
      },
      {
        label: "טופס 4 ותעודת גמר",
        value: "קיים טופס 4 מאושר",
        status: "green",
        details: "תעודת גמר מקורית מופיעה בתיק המבנה.",
      },
    ],
  },
];

function StatusBadge({ status }: { status: StatusType }) {
  if (status === "green") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 uppercase text-teal-300 border border-teal-500/40 rounded-full bg-teal-500/10 shrink-0">
        <CheckCircle2 size={13} className="text-teal-400" />
        תקין
      </span>
    );
  }
  if (status === "yellow") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 uppercase text-amber-300 border border-amber-500/40 rounded-full bg-amber-500/10 shrink-0">
        <AlertTriangle size={13} className="text-amber-400" />
        לתשומת לב
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 uppercase text-red-300 border border-red-500/40 rounded-full bg-red-500/10 shrink-0">
      <XCircle size={13} className="text-red-400" />
      סיכון
    </span>
  );
}

interface DataHubPillarsProps {
  pillars?: {
    cadastral?: { id: string; title: string; subtitle: string; metrics: PillarMetric[] };
    economic?: { id: string; title: string; subtitle: string; metrics: PillarMetric[] };
    planning?: { id: string; title: string; subtitle: string; metrics: PillarMetric[] };
    engineering?: { id: string; title: string; subtitle: string; metrics: PillarMetric[] };
  };
  sourceStatuses?: Array<{ sourceId: string; sourceName: string; status: string }>;
  warnings?: string[];
}

export function DataHubPillars({ pillars: realPillars, sourceStatuses, warnings }: DataHubPillarsProps = {}) {
  const activePillars: Pillar[] = realPillars
    ? [
        realPillars.cadastral && { ...PILLARS[0], ...realPillars.cadastral },
        realPillars.economic && { ...PILLARS[1], ...realPillars.economic },
        realPillars.planning && { ...PILLARS[2], ...realPillars.planning },
        realPillars.engineering && { ...PILLARS[3], ...realPillars.engineering },
      ].filter(Boolean) as Pillar[]
    : PILLARS;

  return (
    <div className="space-y-8 py-8 mb-12">
      {/* Section Header */}
      <div className="flex flex-col space-y-2">
        <div className="w-8 h-[1px] bg-teal-500"></div>
        <span className="text-xs uppercase tracking-[0.2em] text-teal-400 font-bold">
          סיכום ממצאים לפי תחומי בדיקה
        </span>
        <h2 className="text-2xl sm:text-3xl text-white font-bold" style={{ fontFamily: "var(--font-serif)" }}>
          תוצאות בדיקת הנאותות (Due Diligence)
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          סריקה רציפה ומצליבה מול 11 מאגרי מידע ממשלתיים, עירוניים ומשפטיים לקבלת תמונה מלאה ונהירה של הנכס.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activePillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.id}
              className="bg-[#0B1528] p-6 sm:p-7 rounded-2xl border border-white/10 flex flex-col justify-between shadow-xl space-y-6"
            >
              <div>
                {/* Pillar Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg text-white font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                      {pillar.title}
                    </h3>
                    <p className="text-xs tracking-wider text-slate-300 font-medium mt-0.5">
                      {pillar.subtitle}
                    </p>
                  </div>
                </div>

                {/* Metrics list */}
                <div className="space-y-5">
                  {pillar.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="pb-4 border-b border-white/5 last:border-0 last:pb-0 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold tracking-wider text-slate-200 flex items-center">
                          {metric.label}
                          <SourceVerificationTooltip sourceName={metric.details || metric.label} />
                        </span>
                        <StatusBadge status={metric.status} />
                      </div>

                      <p className="text-sm font-semibold text-white leading-snug">
                        {metric.value}
                      </p>

                      {metric.details && (
                        <div className="flex items-start gap-2 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/20">
                          <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-indigo-200/90 leading-relaxed font-normal">
                            {metric.details}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {warnings && warnings.length > 0 && (
        <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl text-right">
          <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-2">נתונים שלא אומתו אוטומטית</p>
          <ul className="space-y-1">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="text-xs text-slate-400">{w}</li>
            ))}
          </ul>
        </div>
      )}

      {sourceStatuses && sourceStatuses.length > 0 && (
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-teal-400" />
              אימות מול 11 מאגרי מידע רשמיים
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceStatuses.map((s) => (
              <span
                key={s.sourceId}
                className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium ${
                  s.status === 'success'
                    ? 'border-teal-500/30 text-teal-400 bg-teal-500/5'
                    : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                }`}
              >
                {s.sourceName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
