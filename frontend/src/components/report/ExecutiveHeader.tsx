"use client";

import { SafeDealLogo } from "@/components/SafeDealLogo";

interface ExecutiveHeaderProps {
  dealType: "second-hand" | "developer" | "new-developer";
  reportNumber: string;
  generatedDate?: string;
  address: string;
  projectName?: string;
}

export function ExecutiveHeader({
  dealType,
  reportNumber,
  generatedDate = new Date().toLocaleDateString("he-IL"),
  address,
  projectName,
}: ExecutiveHeaderProps) {
  const title =
    dealType === "new-developer" || dealType === "developer"
      ? "דוח סיכונים לרכישת דירה מקבלן"
      : "דוח סיכונים לרכישת דירה יד שנייה";

  return (
    <header className="w-full bg-[#060E1C] border-b border-white/10 pb-6 mb-8 text-right">
      <div className="flex items-center justify-between mb-4">
        <div>
          <SafeDealLogo size="md" />
          <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase mt-1">
            Real Estate Risk Intelligence
          </p>
        </div>
        <div className="text-left text-xs text-slate-400">
          <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg font-mono text-teal-400">
            {reportNumber}
          </span>
          <p className="mt-1 text-[11px] text-slate-500">{generatedDate}</p>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gradient-to-r from-teal-500/50 via-slate-700 to-transparent my-4" />

      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {title}
        </h1>
        <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
          <span>{address}</span>
          {projectName && (
            <span className="text-teal-400 text-xs border border-teal-500/30 px-2 py-0.5 rounded">
              {projectName}
            </span>
          )}
        </p>
      </div>
    </header>
  );
}
