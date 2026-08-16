"use client";

import type { ActionableItem } from "@/types/property";

interface ActionableContextProps {
  title?: string;
  items?: ActionableItem[];
}

const DEFAULT_ITEMS: ActionableItem[] = [
  {
    id: 1,
    title: "עיקול חדש לפני השלמת העסקה",
    description: "נושה עשוי להטיל עיקול על זכויות המוכר לפני העברת הבעלות.",
  },
  {
    id: 2,
    title: "עיכוב בקבלת אישורים",
    description: "ייתכן שיהיה צורך להסדיר חובות או אישורים לפני סיום העסקה.",
  },
  {
    id: 3,
    title: "סיכון בהעברת כספים",
    description: "יש לוודא שכספי התמורה עוברים במנגנון נאמנות בטוח.",
  },
  {
    id: 4,
    title: "בדיקה חוזרת לפני הסגירה",
    description: "המצב הפיננסי של המוכר יכול להשתנות בין החתימה למסירה.",
  },
];

export function ActionableContextCard({
  title = "מה המשמעות של חובות אישיים?",
  items = DEFAULT_ITEMS,
}: ActionableContextProps) {
  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span>{title}</span>
        <span className="text-xs text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full font-bold">
          צעדים אופרטיביים
        </span>
      </h3>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-lg text-sm font-serif">
              {item.id}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white mb-0.5">{item.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
