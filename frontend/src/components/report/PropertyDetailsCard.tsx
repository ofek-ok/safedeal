"use client";

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
          { label: "פרויקט", value: details.projectName || "נאות האגם" },
          { label: "יזם", value: details.developerName || "נווה פארק יזמות בע״מ" },
        ]
      : []),
    { label: "כתובת", value: details.address },
    { label: "סוג נכס", value: details.propertyType },
    { label: "קומה", value: details.floor },
    {
      label: "שטח",
      value: details.balconySqm
        ? `${details.areaSqm} + מרפסת ${details.balconySqm}`
        : details.areaSqm,
    },
    ...(!isDeveloper && details.yearBuilt
      ? [{ label: "שנת בנייה", value: details.yearBuilt }]
      : []),
    { label: "חניה / מחסן", value: details.parkingStorage || "חניה אחת / מחסן" },
    { label: "מחיר מבוקש", value: details.askingPrice, highlight: true },
  ];

  return (
    <div className="w-full bg-[#0B1528] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
      <h3
        className="text-lg font-bold text-white mb-2 border-b border-white/10 pb-3 flex items-center justify-between"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <span>פרטי הנכס</span>
        <span className="text-xs font-normal text-slate-400 font-mono">נתוני אמת</span>
      </h3>

      <div className="divide-y divide-white/5">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 text-xs sm:text-sm"
          >
            <span className="text-slate-400 font-medium">{row.label}</span>
            <span
              className={`font-semibold ${
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
