"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface GovAutocompleteProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  hasError?: boolean;
  type: "city" | "street";
  cityFilter?: string; // required if type === "street"
}

export function GovAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  hasError,
  type,
  cityFilter,
}: GovAutocompleteProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOptions = async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      if (type === "city") {
        // Cities dataset
        const res = await fetch(
          `https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&q=${encodeURIComponent(
            query
          )}&limit=10`
        );
        const json = await res.json();
        const records = json.result?.records || [];
        // Extract city names and clean up trailing spaces
        const cityNames = records
          .map((r: any) => (r["שם_ישוב"] || "").trim())
          .filter(Boolean);
        // Unique
        setOptions(Array.from(new Set(cityNames)));
      } else if (type === "street") {
        // Streets dataset requires city filter for accuracy
        const filters = cityFilter ? `&filters={"שם_ישוב":"${cityFilter.trim()}"}` : "";
        const res = await fetch(
          `https://data.gov.il/api/3/action/datastore_search?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b&q=${encodeURIComponent(
            query
          )}${filters}&limit=15`
        );
        const json = await res.json();
        const records = json.result?.records || [];
        const streetNames = records
          .map((r: any) => (r["שם_רחוב"] || "").trim())
          .filter(Boolean);
        setOptions(Array.from(new Set(streetNames)));
      }
      setIsOpen(true);
    } catch (err) {
      console.error("GovAutocomplete fetch error:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce logic
  useEffect(() => {
    // We only want to fetch if the dropdown is active and user is typing
    if (value && document.activeElement?.id === id) {
      const timer = setTimeout(() => {
        fetchOptions(value);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, type, cityFilter, id]);

  const handleSelect = (selectedVal: string) => {
    onChange(selectedVal);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (value.length >= 2) fetchOptions(value);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent border-b border-white/[0.15] py-3 px-0 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-[#00C896] transition-colors duration-300 pr-2"
          style={hasError ? { borderColor: "rgba(248,113,113,0.6)" } : undefined}
        />
        {loading && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[#00C896]">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && options.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden">
          {options.map((opt, idx) => (
            <li
              key={idx}
              className="px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
