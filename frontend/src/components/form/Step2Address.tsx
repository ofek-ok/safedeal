"use client";

import { useState, useEffect } from "react";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import type { Step2PropertyId } from "@/types/property";
import { GovAutocomplete } from "./GovAutocomplete";

interface Props {
  data: Step2PropertyId;
  onChange: (d: Step2PropertyId) => void;
  showErrors: boolean;
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
        {label}
        {optional && <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">אופציונלי</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-400 mt-2">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function EditorialInput({
  id,
  type = "text",
  inputMode,
  value,
  onChange,
  placeholder,
  hasError,
}: {
  id: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-white/[0.15] py-3 px-0 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300"
      style={hasError ? { borderColor: "rgba(248,113,113,0.6)" } : undefined}
    />
  );
}

type GovMapParcelFeature = {
  id?: string | number;
  attributes?: Record<string, unknown>;
};
type GovMapLookupResponse = {
  layers?: Record<string, GovMapParcelFeature[]>;
  status?: number;
  errorCode?: number;
  message?: string | null;
};
type GovMapSearchResponse = {
  results?: Array<{ type?: string; text?: string; score?: number; centroid?: string }>;
  status?: number;
  errorCode?: number;
  message?: string | null;
};
type GovMapSdk = {
  search: (params: {
    searchText: string;
    language: "he";
    maxResults: number;
    isAccurate: boolean;
    apiKey: string;
  }) => Promise<GovMapSearchResponse>;
  getLayerFeaturesByLocation: (
    params: {
      geometry: string;
      radius: number;
      layers: Array<{ name: string; fields: string[] }>;
    },
    apiToken: string,
  ) => Promise<GovMapLookupResponse>;
};

declare global {
  interface Window {
    govmap?: GovMapSdk;
  }
}

const govMapApiToken = process.env.NEXT_PUBLIC_GOVMAP_API_TOKEN?.trim();
let govMapSdkPromise: Promise<GovMapSdk> | null = null;

function loadGovMapSdk(): Promise<GovMapSdk> {
  if (window.govmap) return Promise.resolve(window.govmap);
  if (!govMapSdkPromise) {
    govMapSdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://www.govmap.gov.il/govmap/api/govmap.api.js";
      script.async = true;
      script.onload = () => {
        if (window.govmap) resolve(window.govmap);
        else reject(new Error("GovMap SDK did not initialize."));
      };
      script.onerror = () => {
        govMapSdkPromise = null;
        reject(new Error("GovMap SDK failed to load."));
      };
      document.head.appendChild(script);
    });
  }
  return govMapSdkPromise;
}

function attributeValue(attributes: Record<string, unknown> | undefined, field: string) {
  const value = Object.entries(attributes ?? {}).find(([name]) => name.toUpperCase() === field)?.[1];
  return value == null ? "" : String(value).trim();
}

export function Step2Address({ data, onChange, showErrors }: Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  const set = <K extends keyof Step2PropertyId>(k: K, v: string) => {
    setLookupError(null);
    setLookupSuccess(false);
    onChange({ ...data, [k]: v });
  };

  useEffect(() => {
    const { city, street, houseNumber, block, parcel } = data;
    const normalizedCity = city.trim();
    const normalizedStreet = street.trim();
    const normalizedHouseNumber = houseNumber.trim();

    if (!normalizedCity || !normalizedStreet || !normalizedHouseNumber || block || parcel) {
      setIsLookingUp(false);
      return;
    }

    if (!govMapApiToken) {
      setLookupError("החיפוש האוטומטי לא הוגדר. אפשר להזין גוש וחלקה ידנית.");
      return;
    }

    let cancelled = false;
    let requestTimeout: number | undefined;
    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const sdk = await loadGovMapSdk();
        const timeout = new Promise<never>((_, reject) => {
          requestTimeout = window.setTimeout(() => reject(new Error("timeout")), 20_000);
        });
        const lookup = (async () => {
          const address = `${normalizedStreet} ${normalizedHouseNumber} ${normalizedCity}`;
          const search = await sdk.search({
            searchText: address,
            language: "he",
            maxResults: 5,
            isAccurate: true,
            apiKey: govMapApiToken,
          });
          if (
            (search.status !== undefined && search.status !== 0) ||
            (search.errorCode !== undefined && search.errorCode !== 0)
          ) {
            throw new Error("unavailable");
          }

          const addressResult = search.results?.find(
            (item) => item.type === "address" && item.centroid,
          ) ?? search.results?.find((item) => item.centroid);
          if (!addressResult?.centroid) throw new Error("address-not-found");

          return sdk.getLayerFeaturesByLocation(
            {
              geometry: addressResult.centroid.replace(/^POINT\s+\(/i, "POINT("),
              radius: 20,
              layers: [{ name: "PARCEL_ALL", fields: ["GUSH_NUM", "PARCEL"] }],
            },
            govMapApiToken,
          );
        })();
        const result = await Promise.race([lookup, timeout]);
        if (cancelled) return;
        if (
          (result.status !== undefined && result.status !== 0) ||
          (result.errorCode !== undefined && result.errorCode !== 0)
        ) {
          throw new Error("unavailable");
        }

        const parcelLayer = Object.entries(result.layers ?? {}).find(
          ([name]) => name.toUpperCase() === "PARCEL_ALL",
        )?.[1] ?? [];
        if (!parcelLayer.length) throw new Error("parcel-not-found");
        let parcels = parcelLayer
          .map((feature) => ({
            block: attributeValue(feature.attributes, "GUSH_NUM"),
            parcel: attributeValue(feature.attributes, "PARCEL"),
          }))
          .filter((item) => item.block && item.parcel);

        if (!parcels.length) {
          const featureIds = parcelLayer
            .map((feature) => feature.id)
            .filter((id): id is string | number => typeof id === "string" || typeof id === "number")
            .map(String);
          if (!featureIds.length) throw new Error("parcel-fields-missing");

          const fallbackResponse = await Promise.race([
            fetch("/api/cadastral-parcel", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ featureIds }),
            }).then(async (response) => {
              if (!response.ok) throw new Error("parcel-fields-missing");
              return response.json() as Promise<{ parcels?: Array<{ block?: string; parcel?: string }> }>;
            }),
            timeout,
          ]);
          parcels = (fallbackResponse.parcels ?? [])
            .map((item) => ({
              block: String(item.block ?? "").trim(),
              parcel: String(item.parcel ?? "").trim(),
            }))
            .filter((item) => item.block && item.parcel);
        }
        const uniqueParcels = [...new Map(
          parcels.map((item) => [`${item.block}/${item.parcel}`, item] as const),
        ).values()];

        if (!uniqueParcels.length) throw new Error("parcel-fields-missing");
        if (uniqueParcels.length > 1) throw new Error("ambiguous");
        const { block, parcel: parcelNumber } = uniqueParcels[0];
        onChange({ ...data, block, parcel: parcelNumber });
        setLookupSuccess(true);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setLookupError(error instanceof Error && error.message === "address-not-found"
          ? "GovMap לא מצא את הכתובת המדויקת. בחרו יישוב ורחוב מהרשימה או הזינו גוש וחלקה ידנית."
          : error instanceof Error && error.message === "parcel-not-found"
            ? "הכתובת נמצאה, אך לא נמצא שיוך לחלקה במאגר. אפשר להזין גוש וחלקה ידנית."
            : error instanceof Error && error.message === "parcel-fields-missing"
              ? "נמצאה חלקה, אך נתוני הגוש והחלקה לא הוחזרו. אפשר להזין אותם ידנית."
              : error instanceof Error && error.message === "ambiguous"
            ? "הכתובת משויכת ליותר מגוש או חלקה אחד. בדקו את נסח הטאבו והזינו את הנתונים ידנית."
            : error instanceof Error && error.message === "timeout"
              ? "החיפוש נמשך זמן רב. אפשר להזין גוש וחלקה ידנית."
              : "GovMap לא הצליח לאתר את הכתובת. אפשר להזין גוש וחלקה ידנית.");
      } finally {
        if (requestTimeout) window.clearTimeout(requestTimeout);
        if (!cancelled) setIsLookingUp(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (requestTimeout) window.clearTimeout(requestTimeout);
      setIsLookingUp(false);
    };
  }, [data.city, data.street, data.houseNumber, data.block, data.parcel]);

  const errors = showErrors
    ? {
        city:        !data.city.trim()        ? "שם העיר הוא שדה חובה" : undefined,
        street:      !data.street.trim()      ? "שם הרחוב הוא שדה חובה" : undefined,
        houseNumber: !data.houseNumber.trim() ? "מספר הבית הוא שדה חובה" : undefined,
      }
    : {};

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {/* Heading */}
      <div className="mb-4 sm:mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-2 sm:mb-4"></div>
        <span className="text-[#00C896] text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1 sm:mb-3 block">
          שלב 02
        </span>
        <h2 className="text-xl sm:text-2xl font-normal text-white mb-1 sm:mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          כתובת הנכס
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm tracking-wider">
          הכניסו את כתובת הנכס לאיתור במאגרי הרישום
        </p>
      </div>

      <div className="space-y-4 sm:space-y-8">
        {/* City */}
        <Field id="city" label="עיר / יישוב *">
          <GovAutocomplete
            id="city"
            type="city"
            value={data.city}
            onChange={(val) => set("city", val)}
            placeholder="לדוגמה: תל אביב-יפו"
            hasError={showErrors && !data.city.trim()}
          />
          {showErrors && !data.city.trim() && (
            <p className="text-red-400 text-xs mt-1">יש להזין עיר כדי להמשיך</p>
          )}
        </Field>

        {/* Street + House number */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div className="col-span-2">
            <Field id="street" label="רחוב *" error={errors.street}>
              <GovAutocomplete
                id="street"
                type="street"
                cityFilter={data.city}
                value={data.street}
                onChange={(val) => set("street", val)}
                placeholder="שם הרחוב"
                hasError={!!errors.street}
              />
            </Field>
          </div>
          <Field id="houseNumber" label='מס׳ בית *' error={errors.houseNumber}>
            <EditorialInput
              id="houseNumber"
              inputMode="numeric"
              value={data.houseNumber}
              onChange={(e) => set("houseNumber", e.target.value)}
              placeholder="45"
              hasError={!!errors.houseNumber}
            />
          </Field>
        </div>

        {/* Cadastral divider */}
        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-4 mt-2 sm:mt-6">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
            <Info size={11} />
            זיהוי קדסטרלי
          </span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
        </div>

        {/* Auto Lookup Status */}
        <div className="flex flex-col items-center min-h-[24px] sm:min-h-[30px] justify-center">
          {isLookingUp && (
            <div className="flex items-center gap-2 text-[10px] text-[#00C896] uppercase tracking-widest bg-[#00C896]/10 px-3 py-1 rounded-full">
              <Loader2 size={12} className="animate-spin" />
              מאתר גוש וחלקה...
            </div>
          )}
          {!isLookingUp && lookupError && (
            <span className="text-red-400 text-[10px] bg-red-400/10 px-3 py-1 rounded">{lookupError}</span>
          )}
          {!isLookingUp && lookupSuccess && (
            <span className="text-[#00C896] text-[10px] bg-[#00C896]/10 px-3 py-1 rounded">הושלם בהצלחה! אנא ודאו את הנתונים מול הטאבו.</span>
          )}
        </div>

        {/* Block / Parcel / Sub-parcel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6">
          {(
            [
              { key: "block",     label: "גוש",      placeholder: "מס׳ גוש" },
              { key: "parcel",    label: "חלקה",     placeholder: "מס׳ חלקה" },
              { key: "subParcel", label: "תת-חלקה",  placeholder: "מס׳" },
            ] as { key: keyof Step2PropertyId; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <Field key={key} id={key} label={label} optional>
              <EditorialInput
                id={key}
                inputMode="numeric"
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
              />
            </Field>
          ))}
        </div>

        {/* Hint */}
        <div className="p-3.5 sm:p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-start gap-3 sm:gap-4">
          <Info size={13} className="shrink-0 mt-0.5 text-[#00C896]" />
          <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
            המערכת תנסה לאתר את הגוש והחלקה לפי הכתובת. מומלץ לוודא את הנתונים מול נסח הטאבו, ואפשר להזינם ידנית.
          </p>
        </div>
      </div>
    </div>
  );
}
