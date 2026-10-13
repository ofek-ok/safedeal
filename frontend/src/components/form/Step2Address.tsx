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

type GovMapLocateResponse = {
  data?: Array<{ Values?: unknown[] }>;
  status?: number;
  errorCode?: number;
  message?: string | null;
};
type GovMapSdk = {
  locateType: { lotParcelToAddress: string | number };
  createMap: (mapDivId: string, settings: {
    token: string;
    onLoad: () => void;
    onError: () => void;
  }) => void;
  searchAndLocate: (params: {
    type: string | number;
    address: string;
  }) => Promise<GovMapLocateResponse>;
};

declare global {
  interface Window {
    govmap?: GovMapSdk;
  }
}

const govMapApiToken = process.env.NEXT_PUBLIC_GOVMAP_API_TOKEN?.trim();
let govMapSdkPromise: Promise<GovMapSdk> | null = null;
let govMapMapPromise: Promise<GovMapSdk> | null = null;

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

function initializeGovMapLookup(): Promise<GovMapSdk> {
  if (!govMapApiToken) return Promise.reject(new Error("unavailable"));
  if (!govMapMapPromise) {
    govMapMapPromise = loadGovMapSdk().then((sdk) => new Promise((resolve, reject) => {
      sdk.createMap("safedeal-govmap-runtime", {
        token: govMapApiToken,
        onLoad: () => resolve(sdk),
        onError: () => reject(new Error("unavailable")),
      });
    })).catch((error) => {
      govMapMapPromise = null;
      throw error;
    });
  }
  return govMapMapPromise;
}

function attributeValue(attributes: Record<string, unknown> | undefined, field: string) {
  const value = Object.entries(attributes ?? {}).find(([name]) => name.toUpperCase() === field)?.[1];
  return value == null ? "" : String(value).trim();
}

export function Step2Address({ data, onChange, showErrors }: Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<"address-not-found" | "parcel-not-found" | "parcel-fields-missing" | "ambiguous" | "timeout" | "unavailable" | null>(null);
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
      setLookupError("unavailable");
      return;
    }

    let cancelled = false;
    let requestTimeout: number | undefined;
    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const sdk = await initializeGovMapLookup();
        const timeout = new Promise<never>((_, reject) => {
          requestTimeout = window.setTimeout(() => reject(new Error("timeout")), 20_000);
        });
        const address = `${normalizedStreet} ${normalizedHouseNumber}, ${normalizedCity}`;
        const lookup = sdk.searchAndLocate({
          type: sdk.locateType.lotParcelToAddress,
          address,
        });
        const result = await Promise.race([lookup, timeout]);
        if (cancelled) return;
        if (
          (result.status !== undefined && result.status !== 0) ||
          (result.errorCode !== undefined && result.errorCode !== 0)
        ) {
          throw new Error("unavailable");
        }

        const rawParcels = (result.data ?? [])
          .map((item) => ({
            block: String(item.Values?.[0] ?? "").trim(),
            parcel: String(item.Values?.[1] ?? "").trim(),
          }))
          .filter((item) => item.block && item.parcel);
        const uniqueParcels = [...new Map(
          rawParcels.map((item) => [`${item.block}/${item.parcel}`, item] as const),
        ).values()];

        if (!uniqueParcels.length) throw new Error("address-not-found");
        if (uniqueParcels.length > 1) throw new Error("ambiguous");
        const { block, parcel: parcelNumber } = uniqueParcels[0];
        onChange({ ...data, block, parcel: parcelNumber });
        setLookupSuccess(true);
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        const code = error instanceof Error ? error.message : "unavailable";
        setLookupError(
          code === "address-not-found" ||
          code === "parcel-not-found" ||
          code === "parcel-fields-missing" ||
          code === "ambiguous" ||
          code === "timeout"
            ? code
            : "unavailable",
        );
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

  const addressLookupMessage = lookupError === "address-not-found"
    ? "לא מצאנו את הכתובת במאגר. בחרו עיר ורחוב מהרשימה או בדקו את הכתובת."
    : lookupError === "timeout"
      ? "האיתור מתעכב. אפשר להמשיך ולמלא גוש וחלקה ידנית."
      : lookupError === "unavailable"
        ? "האיתור האוטומטי אינו זמין כרגע. אפשר להמשיך ולמלא גוש וחלקה ידנית."
        : null;
  const parcelLookupMessage = lookupError === "parcel-not-found"
    ? "הכתובת נמצאה, אך לא אותרה עבורה חלקה. הזינו גוש וחלקה ידנית."
    : lookupError === "parcel-fields-missing"
      ? "נמצאה חלקה, אך המאגר לא החזיר את מספרי הגוש והחלקה. הזינו אותם ידנית או השתמשו בקישור לאיתור לפי כתובת."
      : lookupError === "ambiguous"
        ? "לכתובת נמצאו כמה חלקות אפשריות. בדקו את נסח הטאבו והזינו את הגוש והחלקה המתאימים."
        : null;

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      <div
        id="safedeal-govmap-runtime"
        aria-hidden="true"
        className="pointer-events-none fixed -left-[10000px] top-0 h-[500px] w-[500px] opacity-0"
      />
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

        {(isLookingUp || addressLookupMessage) && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${addressLookupMessage ? "text-amber-300" : "text-[#00C896]"}`}
            role={addressLookupMessage ? "status" : "status"}
            aria-live="polite"
          >
            {isLookingUp ? <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" /> : <Info size={14} className="mt-0.5 shrink-0" />}
            <span>{isLookingUp ? "מאתר גוש וחלקה לפי הכתובת..." : addressLookupMessage}</span>
          </div>
        )}

        {/* Cadastral divider */}
        <div className="flex items-center gap-3 sm:gap-4 py-2 sm:py-4 mt-2 sm:mt-6">
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5 sm:gap-2">
            <Info size={11} />
            זיהוי קדסטרלי
          </span>
          <div className="flex-1 h-[1px] bg-white/[0.06]" />
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

        {(parcelLookupMessage || lookupSuccess) && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${lookupSuccess ? "text-[#00C896]" : "text-amber-300"}`}
            role="status"
            aria-live="polite"
          >
            {lookupSuccess ? <Info size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            <span>{lookupSuccess ? "הגוש והחלקה אותרו. מומלץ לוודא את הנתונים מול נסח הטאבו." : parcelLookupMessage}</span>
          </div>
        )}

        <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
          לדיוק מרבי, אפשר{" "}
          <a
            href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00C896] underline underline-offset-4 hover:text-white transition-colors"
          >
            לאתר כאן את הגוש והחלקה לפי כתובת הנכס
          </a>
          , ואז להזין את הנתונים בשדות למעלה.
        </p>

      </div>
    </div>
  );
}
