"use client";

import { SourceVerificationTooltip } from "@/components/report/SourceVerificationTooltip";

interface PropertyDetailsProps {
  details: {
    projectName?: string;
    developerName?: string;
    address: string;
    propertyType: string;
    rooms: string;
    areaSqm: string;
    balconySqm?: string;
    floor: string;
    parkingStorage?: string;
    askingPrice: string;
    yearBuilt?: string;
  };
}

export function PropertyDetailsCard({ details }: PropertyDetailsProps) {
  const isDeveloper = !!(details.projectName || details.developerName);

  const rows = [
    ...(isDeveloper
      ? [
          { label: "פרויקט", value: details.projectName || "נאות האגם", source: "רשם החברות / היתרי בנייה", url: "https://ica.justice.gov.il/" },
          { label: "יזם", value: details.developerName || "נווה פארק יזמות בע״מ", source: "רשם החברות", url: "https://ica.justice.gov.il/" },
        ]
      : []),
    { label: "כתובת", value: details.address, source: "GovMap המרכז למיפוי ישראל", url: "https://govmap.gov.il/" },
    { label: "סוג נכס", value: details.propertyType, source: "פנקסי מקרקעין (טאבו)", url: "https://www.gov.il/he/departments/land_registration_and_settlement_rights/" },
    { label: "קומה", value: details.floor, source: "פנקסי מקרקעין (טאבו)", url: "https://www.gov.il/he/departments/land_registration_and_settlement_rights/" },
    {
      label: "שטח",
      value: details.balconySqm
        ? `${details.areaSqm} + מרפסת ${details.balconySqm}`
        : details.areaSqm,
      source: "מרשם מקרקעין (טאבו / היתרי בנייה)",
      url: "https://data.gov.il/dataset/building-permits",
    },
    ...(!isDeveloper && details.yearBuilt
      ? [{ label: "שנת בנייה", value: details.yearBuilt, source: "תיק בניין עירוני / למ\"ס", url: "https://www.cbs.gov.il/" }]
      : []),
    { label: "חניה / מחסן", value: details.parkingStorage || "חניה אחת / מחסן", source: "תקנון בית משותף (טאבו)", url: "https://www.gov.il/he/departments/land_registration_and_settlement_rights/" },
    { label: "מחיר מבוקש", value: details.askingPrice, highlight: true, source: "הצהרת המוכר / לוח נדל\"ן", url: "https://www.nadlan.gov.il/" },
  ];

  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span>פרטי הנכס</span>
        <span className="text-xs font-normal text-slate-400 font-mono">מאומת מול רשויות</span>
      </h3>

      <div className="divide-y divide-white/5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <span className="text-slate-400 font-medium flex items-center shrink-0">
              {row.label}
              <SourceVerificationTooltip sourceName={row.source} sourceUrl={row.url} details={`נתון נשלף מתוך ${row.source}`} />
            </span>
            <span
              className={`font-semibold text-right sm:text-left break-words ${
                row.highlight ? "text-teal-400 font-serif text-base" : "text-slate-100"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
