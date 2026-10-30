"use client";

import { useState, useEffect } from "react";
import { Info, AlertCircle, Loader2 } from "lucide-react";
import type { Step2PropertyId } from "@/types/property";
import { GovAutocomplete } from "./GovAutocomplete";

type GovMapFeature = { attributes?: Record<string, unknown>; properties?: Record<string, unknown>; fields?: Array<{ fieldName?: string; fieldValue?: unknown; name?: string; value?: unknown }>; Values?: unknown[]; values?: unknown[] };
type GovMapLookupResponse = {
  layers?: Record<string, GovMapFeature[]>;
  data?: Record<string, GovMapFeature[]>;
  status?: number;
  errorCode?: number;
  message?: string | null;
};
type GovMapSearchResult = { id?: string; text?: string; type?: string; centroid?: string; [key: string]: unknown };
type GovMapSearchResponse = { results?: GovMapSearchResult[]; resultsCount?: number };
type GovMapSdk = {
  search?: (params: { searchText: string; language: 'he'; maxResults: number; isAccurate: boolean; apiKey: string }) => Promise<GovMapSearchResponse>;
  getSearchResultData?: (result: GovMapSearchResult, apiToken: string) => Promise<{ geom?: string }>;
  getLayerFeaturesByLocation?: (params: { geometry: string; radius: number; layers: Array<{ name: string; fields: string[] }> }, apiToken: string) => Promise<GovMapLookupResponse>;
};
declare global { interface Window { govmap?: GovMapSdk } }
const govMapApiToken = process.env.NEXT_PUBLIC_GOVMAP_API_TOKEN;
let govMapSdkPromise: Promise<GovMapSdk> | null = null;

function loadGovMapSdk(): Promise<GovMapSdk> {
  if (typeof window === "undefined") return Promise.reject(new Error("unavailable"));
  if (window.govmap?.getLayerFeaturesByLocation) return Promise.resolve(window.govmap);
  if (!govMapSdkPromise) {
    govMapSdkPromise = new Promise((resolve, reject) => {
      let script = document.getElementById("safedeal-govmap-sdk") as HTMLScriptElement | null;
      const cleanup = () => { script?.removeEventListener("load", onLoad); script?.removeEventListener("error", onError); };
      const onLoad = () => { cleanup(); if (window.govmap?.getLayerFeaturesByLocation) resolve(window.govmap); else { govMapSdkPromise = null; reject(new Error("GOVMAP_SDK_METHOD_MISSING")); } };
      const onError = () => { cleanup(); govMapSdkPromise = null; reject(new Error("GOVMAP_SDK_LOAD_FAILED")); };
      if (!script) { script = document.createElement("script"); script.id = "safedeal-govmap-sdk"; script.src = "https://www.govmap.gov.il/govmap/api/govmap.api.js"; script.async = true; }
      script.addEventListener("load", onLoad, { once: true }); script.addEventListener("error", onError, { once: true });
      if (!script.isConnected) document.head.appendChild(script); else if (window.govmap?.getLayerFeaturesByLocation) onLoad();
    });
  }
  return govMapSdkPromise;
}
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code = "lookup-timeout"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(code)), timeoutMs);
    promise.then((value) => { window.clearTimeout(timer); resolve(value); }, (error) => { window.clearTimeout(timer); reject(error); });
  });
}
function formatGovMapAddress(city: string, street: string, houseNumber: string) {
  const locality = city.trim().replace(/\s*-\s*יפו$/, '').trim();
  return (street.trim() + ' ' + houseNumber.trim() + ' ' + locality).replace(/\s+/g, ' ').trim();
}

function normalizeGovMapAddress(value: string) {
  return value.trim().replace(/[,-]/g, ' ').replace(/\s+/g, ' ').replace(/\s+יפו$/, '').trim();
}

async function findCadastralParcel(city: string, street: string, houseNumber: string): Promise<{ block: string; parcel: string }> {
  if (!govMapApiToken) throw new Error('GOVMAP_TOKEN_MISSING');
  const sdk = await withTimeout(loadGovMapSdk(), 10_000);
  if (!sdk.search || !sdk.getSearchResultData || !sdk.getLayerFeaturesByLocation) throw new Error('GOVMAP_SDK_METHOD_MISSING');

  // Geocode the exact street, house number and locality, then query the parcel layer at that address point.
  const address = formatGovMapAddress(city, street, houseNumber);
  const search = await withTimeout(sdk.search({
    searchText: address,
    language: 'he',
    maxResults: 10,
    isAccurate: true,
    apiKey: govMapApiToken,
  }), 10_000);
  const exactAddresses = (search.results ?? []).filter((result) =>
    result.type === 'address' && typeof result.text === 'string' &&
    normalizeGovMapAddress(result.text) === normalizeGovMapAddress(address)
  );
  if (!exactAddresses.length) throw new Error('address-not-found');
  if (exactAddresses.length > 1) throw new Error('ambiguous');

  const details = await withTimeout(sdk.getSearchResultData(exactAddresses[0], govMapApiToken), 8_000);
  const geometry = details.geom || exactAddresses[0].centroid;
  if (typeof geometry !== 'string' || !geometry.trim()) throw new Error('address-geometry-missing');

  const response = await withTimeout(sdk.getLayerFeaturesByLocation({
    geometry,
    radius: 0,
    layers: [{ name: 'PARCEL_ALL', fields: ['GUSH_NUM', 'PARCEL', 'gush_num', 'parcel'] }],
  }, govMapApiToken), 10_000);

  if (response.errorCode !== undefined && Number(response.errorCode) !== 0) throw new Error('GOVMAP_API_ERROR_' + response.errorCode);
  if (response.status !== undefined && Number(response.status) !== 0) throw new Error('GOVMAP_API_STATUS_' + response.status);

  const layerMap = response.layers ?? response.data ?? {};
  const layer = Object.entries(layerMap).find(([name]) => name.toUpperCase() === 'PARCEL_ALL')?.[1] ?? [];
  const parcels = layer.map((feature) => {
    const attrs = feature.attributes ?? feature.properties ?? {};
    const fields = Object.fromEntries((feature.fields ?? []).map((field) => [
      String(field.fieldName ?? field.name ?? '').toUpperCase(), field.fieldValue ?? field.value,
    ]));
    const value = (name: string, index: number) => {
      const key = Object.keys(attrs).find((candidate) => candidate.toUpperCase() === name);
      return (key ? attrs[key] : undefined) ?? fields[name] ?? feature.Values?.[index] ?? feature.values?.[index];
    };
    return {
      block: String(value('GUSH_NUM', 0) ?? '').trim(),
      parcel: String(value('PARCEL', 1) ?? '').trim(),
    };
  }).filter((item) => /^\d+$/.test(item.block) && /^\d+$/.test(item.parcel));
  const unique = [...new Map(parcels.map((item) => [item.block + '/' + item.parcel, item] as const)).values()];
  if (!unique.length) {
    const firstFeature = layer[0] as GovMapFeature | undefined;
    console.warn('SafeDeal parcel layer schema', JSON.stringify({ layerNames: Object.keys(layerMap), featureKeys: firstFeature ? Object.keys(firstFeature) : [], attributeKeys: Object.keys(firstFeature?.attributes ?? firstFeature?.properties ?? {}), fieldNames: firstFeature?.fields?.map((field) => field.fieldName ?? field.name) ?? [] }));
    throw new Error(layer.length ? 'parcel-fields-missing' : 'parcel-not-found');
  }
  if (unique.length > 1) throw new Error('ambiguous');
  return unique[0];
}
interface Props {
  data: Step2PropertyId;
  onChange: (d: Step2PropertyId) => void;
  showErrors: boolean;
  hideHeading?: boolean;
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

export function Step2Address({ data, onChange, showErrors, hideHeading = false }: Props) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<"address-not-found" | "parcel-not-found" | "parcel-fields-missing" | "ambiguous" | "map-timeout" | "lookup-timeout" | "timeout" | "unavailable" | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);

  const set = <K extends keyof Step2PropertyId>(k: K, v: string) => {
    setLookupError(null);
    setLookupSuccess(false);
    const next = { ...data, [k]: v };
    if (k === "city" || k === "street" || k === "houseNumber") {
      next.block = "";
      next.parcel = "";
      next.subParcel = "";
    }
    onChange(next);
  };

  useEffect(() => {
    const normalizedCity = data.city.trim();
    const normalizedStreet = data.street.trim();
    const normalizedHouseNumber = data.houseNumber.trim();

    // Download the official SDK while the client completes the address.
    if (!normalizedCity || !normalizedStreet || !normalizedHouseNumber || data.block || data.parcel) {
      setIsLookingUp(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLookupError(null);
      setLookupSuccess(false);
      setIsLookingUp(true);
      try {
        const result = await findCadastralParcel(normalizedCity, normalizedStreet, normalizedHouseNumber);
        if (cancelled) return;
        onChange({ ...data, block: result.block, parcel: result.parcel });
        setLookupSuccess(true);
      } catch (error) {
        if (cancelled) return;
        const code = error instanceof Error ? error.message : "unavailable";
        console.warn("SafeDeal cadastral lookup failed", code);
        const knownCodes = ["address-not-found", "parcel-not-found", "parcel-fields-missing", "ambiguous", "map-timeout", "lookup-timeout", "timeout"];
        setLookupError(knownCodes.includes(code) ? code as typeof lookupError : "unavailable");
      } finally {
        if (!cancelled) setIsLookingUp(false);
      }
    }, 500);

    return () => { cancelled = true; window.clearTimeout(timer); setIsLookingUp(false); };
  }, [data.city, data.street, data.houseNumber, data.block, data.parcel]);

  const errors: Partial<Record<keyof Step2PropertyId, string>> = showErrors
    ? {
        city: !data.city.trim() ? "שם העיר הוא שדה חובה" : undefined,
        street: !data.street.trim() ? "שם הרחוב הוא שדה חובה" : undefined,
        houseNumber: !data.houseNumber.trim() ? "מספר הבית הוא שדה חובה" : undefined,
        block: !data.block.trim() ? "יש להזין גוש כדי להמשיך" : undefined,
        parcel: !data.parcel.trim() ? "יש להזין חלקה כדי להמשיך" : undefined,
      }
    : {};

  const addressLookupMessage = lookupError === "address-not-found"
    ? "לא נמצאה התאמה אוטומטית. כדי להמשיך, אתרו את הגוש והחלקה באתר הממשלתי והזינו אותם כאן."
    : lookupError === "map-timeout"
      ? "שירות האיתור לא הצליח לטעון את המפה. הזינו את הגוש והחלקה בעזרת האתר הממשלתי כדי להמשיך."
      : lookupError === "lookup-timeout" || lookupError === "timeout"
      ? "האיתור האוטומטי מתעכב. המתינו עוד רגע; אם לא תימצא התאמה, תוכלו לאתר את הגוש והחלקה באתר הממשלתי ולהזין אותם כאן."
      : lookupError === "unavailable"
        ? "האיתור האוטומטי לא זמין כרגע. אתרו את הגוש והחלקה באתר הממשלתי והזינו אותם כאן כדי להמשיך."
        : null;
  const govMapAddress = data.city.trim() && data.street.trim() && data.houseNumber.trim()
    ? formatGovMapAddress(data.city, data.street, data.houseNumber)
    : "";
  const parcelLookupMessage = lookupError === "parcel-not-found"
    ? "לא נמצאה התאמה לגוש ולחלקה. היכנסו לאתר הממשלתי לאיתור לפי כתובת, ואז הזינו כאן את המספרים."
    : lookupError === "parcel-fields-missing"
      ? "הכתובת נמצאה, אך מספרי הגוש והחלקה לא התקבלו. אפשר לאתר אותם באתר הממשלתי ולהזין כאן."
      : lookupError === "ambiguous"
        ? "לכתובת נמצאו כמה חלקות אפשריות. בדקו את נסח הטאבו והזינו את הגוש והחלקה המתאימים."
        : null;

  return (
    <div className="space-y-4 sm:space-y-10 animate-fade-in-up">
      {!hideHeading && <div className="mb-4 sm:mb-10 text-right">
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
      </div>}

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

        {data.city.trim() && data.street.trim() && data.houseNumber.trim() && (
          <p className="text-[11px] sm:text-xs text-slate-500" dir="rtl">
            כתובת החיפוש שנשלחת ל־GovMap:{" "}
            <span className="text-slate-300">
              {formatGovMapAddress(data.city, data.street, data.houseNumber)}
            </span>
          </p>
        )}

        {(isLookingUp || addressLookupMessage) && (
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed ${addressLookupMessage ? "text-amber-300" : "text-[#00C896]"}`}
            role={addressLookupMessage ? "status" : "status"}
            aria-live="polite"
          >
            {isLookingUp ? <Loader2 size={14} className="mt-0.5 shrink-0 animate-spin" /> : <Info size={14} className="mt-0.5 shrink-0" />}
            <span>{isLookingUp ? "מאתרים את הגוש והחלקה לפי הכתובת. המתינו כמה שניות; אם לא תימצא התאמה, נציג קישור לאיתור ממשלתי ולהזנה ידנית." : addressLookupMessage}</span>
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
              { key: "block",     label: "גוש *",      placeholder: "מס׳ גוש" },
              { key: "parcel",    label: "חלקה *",     placeholder: "מס׳ חלקה" },
              { key: "subParcel", label: "תת-חלקה",    placeholder: "מס׳", optional: true },
            ] as { key: keyof Step2PropertyId; label: string; placeholder: string; optional?: boolean }[]
          ).map(({ key, label, placeholder, optional }) => (
            <Field key={key} id={key} label={label} optional={optional} error={errors[key as "block" | "parcel"]}>
              <EditorialInput
                id={key}
                inputMode="numeric"
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                hasError={!!errors[key as "block" | "parcel"]}
              />
            </Field>
          ))}
        </div>

        {(parcelLookupMessage || lookupSuccess) && (
          <div
            className="flex items-start gap-2 text-xs leading-relaxed text-amber-300"
            role="status"
            aria-live="polite"
          >
            {lookupSuccess ? <Info size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            <span>{lookupSuccess ? "נמצאה התאמה אוטומטית אפשרית. האנליסט יבדוק אותה מול נסח הטאבו לפני הפקת הדוח." : parcelLookupMessage}</span>
          </div>
        )}

        <p className="text-[11px] sm:text-xs text-slate-400 tracking-wider leading-relaxed">
          גוש וחלקה נדרשים להמשך. המערכת מנסה לאתר אותם לפי הכתובת; אם לא נמצאה התאמה, הזינו אותם כאן ידנית בעזרת{" "}
          <a
            href="https://www.gov.il/apps/mapi/parcel_address/parcel_address.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00C896] underline underline-offset-4 hover:text-white transition-colors"
          >
            האתר הממשלתי לאיתור גוש וחלקה לפי כתובת
          </a>.
        </p>

      </div>
    </div>
  );
}
