"use client";

const STEPS = [
  { id: 1, label: "סוג נכס" },
  { id: 2, label: "כתובת" },
  { id: 3, label: "פרטים" },
  { id: 4, label: "תשלום" },
];

export function StepIndicator({ current }: { current: number }) {
  const pct = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="w-full mb-12">
      {/* Progress Track */}
      <div className="relative h-[1px] mb-8 bg-white/[0.08]">
        <div
          className="absolute top-0 right-0 h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            left: "auto",
            background: "linear-gradient(90deg, #00C896, rgba(0,200,150,0.2))",
          }}
        />
      </div>

      {/* Step Nodes */}
      <div className="flex items-start justify-between relative px-2 -mt-[34px]">
        {STEPS.map(({ id, label }) => {
          const done   = id < current;
          const active = id === current;
          return (
            <div key={id} className="flex flex-col items-center gap-5 min-w-0">
              <div
                className={`w-2 h-2 rotate-45 transition-all duration-500 ${
                  done
                    ? "bg-[#00C896]/50"
                    : active
                    ? "bg-[#00C896] shadow-[0_0_8px_rgba(0,200,150,0.5)]"
                    : "bg-white/[0.1]"
                }`}
              />
              <div className="flex flex-col items-center gap-1.5 hidden sm:flex">
                <span className={`text-base transition-colors duration-300 ${active ? "text-white" : "text-slate-600"}`} style={{ fontFamily: "var(--font-serif)" }}>
                  0{id}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-widest text-center transition-colors duration-300 ${
                    done
                      ? "text-slate-500"
                      : active
                      ? "text-[#00C896]"
                      : "text-slate-600"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Current Step Banner */}
      <div className="sm:hidden flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          שלב {current} מתוך {STEPS.length}
        </span>
        <span className="text-xs tracking-wider text-[#00C896]" style={{ fontFamily: "var(--font-serif)" }}>
          {STEPS[current - 1].label}
        </span>
      </div>
    </div>
  );
}
