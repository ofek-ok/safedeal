"use client";

import { useState } from "react";
import { AlertCircle, ExternalLink, ShieldCheck } from "lucide-react";

export interface SourceVerificationProps {
  sourceName: string;
  sourceUrl?: string;
  details?: string;
}

const DEFAULT_SOURCE_URLS: Record<string, string> = {
  govmap: "https://govmap.gov.il/",
  taxAuthority: "https://www.nadlan.gov.il/",
  realEstateGov: "https://www.nadlan.gov.il/",
  xplan: "https://mavat.iplan.gov.il/",
  cbs: "https://www.cbs.gov.il/",
  urbanRenewal: "https://www.gov.il/he/departments/the_governmental_authority_for_urban_renewal/",
  tabu: "https://www.gov.il/he/departments/land_registration_and_settlement_rights/",
  municipal: "https://data.gov.il/dataset/building-permits",
  registrarCompanies: "https://ica.justice.gov.il/",
  pledges: "https://www.gov.il/he/departments/topics/yalkut_hapirsumim",
  judicial: "https://www.court.gov.il/",
};

export function SourceVerificationTooltip({
  sourceName,
  sourceUrl,
  details,
}: SourceVerificationProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Match URL if not provided directly
  let targetUrl = sourceUrl;
  if (!targetUrl) {
    const key = Object.keys(DEFAULT_SOURCE_URLS).find(
      (k) => sourceName.toLowerCase().includes(k.toLowerCase()) || sourceName.includes("רשות המסים") || sourceName.includes("GovMap") || sourceName.includes("למ\"ס") || sourceName.includes("טאבו") || sourceName.includes("משכונות") || sourceName.includes("נט המשפט")
    );
    if (sourceName.includes("רשות המסים") || sourceName.includes("נדל\"ן")) targetUrl = DEFAULT_SOURCE_URLS.taxAuthority;
    else if (sourceName.includes("GovMap") || sourceName.includes("קדסטר")) targetUrl = DEFAULT_SOURCE_URLS.govmap;
    else if (sourceName.includes("למ\"ס") || sourceName.includes("CBS")) targetUrl = DEFAULT_SOURCE_URLS.cbs;
    else if (sourceName.includes("טאבו")) targetUrl = DEFAULT_SOURCE_URLS.tabu;
    else if (sourceName.includes("משכונות") || sourceName.includes("ילקוט")) targetUrl = DEFAULT_SOURCE_URLS.pledges;
    else if (sourceName.includes("פסיקה") || sourceName.includes("נט המשפט")) targetUrl = DEFAULT_SOURCE_URLS.judicial;
    else if (sourceName.includes("חברות")) targetUrl = DEFAULT_SOURCE_URLS.registrarCompanies;
    else if (sourceName.includes("XPLAN") || sourceName.includes("תכנון")) targetUrl = DEFAULT_SOURCE_URLS.xplan;
    else if (sourceName.includes("התחדשות")) targetUrl = DEFAULT_SOURCE_URLS.urbanRenewal;
    else targetUrl = DEFAULT_SOURCE_URLS.taxAuthority;
  }

  return (
    <div className="relative inline-block align-middle ml-1.5">
      {/* Exclamation Badge Icon */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[10px] flex items-center justify-center hover:bg-amber-500/30 hover:scale-110 transition-all duration-200 cursor-pointer shadow-sm"
        title="לחץ לאימות מקור המידע"
        aria-label="אימות מקור מידע"
      >
        !
      </button>

      {/* Verification Popover Box */}
      {isOpen && (
        <div className="absolute z-50 bottom-full right-0 mb-2 w-64 p-3.5 rounded-xl bg-[#060E1C] border border-amber-500/40 shadow-2xl text-right space-y-2 animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center gap-1">
              <AlertCircle size={12} /> אימות מקור מידע (פיתוח)
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
              <ShieldCheck size={10} /> מאומת
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-white leading-tight">{sourceName}</p>
            {details && (
              <p className="text-[10px] text-slate-400 leading-relaxed">{details}</p>
            )}
          </div>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/50 bg-teal-500/10 px-2.5 py-1.5 rounded-lg transition-colors w-full justify-center mt-1"
            >
              <span>פתיחת מקור המידע הרשמי</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
