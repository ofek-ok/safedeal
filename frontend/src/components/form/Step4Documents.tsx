"use client";

import { useCallback } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import type { Step4Documents } from "@/types/property";
import { formatBytes } from "@/lib/utils";

interface Props {
  data: Step4Documents;
  onChange: (d: Step4Documents) => void;
}

function FileCard({
  file,
  tag,
  onRemove,
}: {
  file: File;
  tag?: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="w-10 h-10 rounded border border-white/[0.1] flex items-center justify-center shrink-0 bg-white/[0.01]">
        <FileText size={16} className="text-[#00C896]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate tracking-wider">{file.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{formatBytes(file.size)}</p>
      </div>
      {tag && (
        <span className="shrink-0 text-[9px] uppercase tracking-widest text-[#00C896] border border-[#00C896]/30 px-2 py-1 rounded">
          {tag}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center shrink-0 text-slate-500 hover:text-red-400 transition-colors"
        aria-label="הסר קובץ"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function Dropzone({
  id,
  label,
  sublabel,
  accept,
  file,
  onSelect,
  onRemove,
  tag,
  required,
}: {
  id: string;
  label: string;
  sublabel: string;
  accept: string;
  file: File | null;
  onSelect: (f: File) => void;
  onRemove: () => void;
  tag?: string;
  required?: boolean;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) onSelect(f);
    },
    [onSelect]
  );

  if (file) {
    return <FileCard file={file} tag={tag} onRemove={onRemove} />;
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="block cursor-pointer p-8 border border-dashed border-white/[0.15] rounded-xl hover:border-[#00C896]/50 hover:bg-[#00C896]/5 transition-all duration-300"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <Upload size={20} className="text-[#00C896] mb-2 opacity-80" />
        <div>
          <p className="text-white text-sm tracking-wider mb-2">{label}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">{sublabel}</p>
        </div>
        {required && (
          <span className="text-[9px] uppercase tracking-widest text-[#00C896] border border-[#00C896]/30 px-2 py-1 rounded mt-2">
            נדרש לדוח מלא
          </span>
        )}
      </div>
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function Step4Documents({ data, onChange }: Props) {
  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Heading */}
      <div className="mb-10 text-right">
        <div className="w-8 h-[1px] bg-[#00C896] mb-4"></div>
        <span className="text-[#00C896] text-[10px] font-bold uppercase tracking-widest mb-3 block">
          שלב 04
        </span>
        <h2 className="text-2xl font-normal text-white mb-3" style={{ fontFamily: "var(--font-serif)" }}>
          העלאת מסמכים
        </h2>
        <p className="text-slate-400 text-sm tracking-wider">
          נסח הטאבו הוא המסמך המרכזי לניתוח הבדיקה
        </p>
      </div>

      <div className="space-y-10">
        {/* Tabu */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
            נסח טאבו
            <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">מומלץ לדוח מלא</span>
          </p>
          <Dropzone
            id="tabu-upload"
            label="גרור לכאן את נסח הטאבו"
            sublabel="או לחצו לבחירת קובץ · PDF בלבד · עד 20MB"
            accept="application/pdf"
            file={data.tabuFile}
            tag="נסח טאבו"
            required
            onSelect={(f) => onChange({ ...data, tabuFile: f })}
            onRemove={() => onChange({ ...data, tabuFile: null })}
          />
        </div>

        {/* Building file */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-slate-400 font-medium">
            תיק בניין
            <span className="text-slate-600 text-[9px] border border-slate-700 px-1.5 py-0.5 rounded">אופציונלי</span>
          </p>
          <Dropzone
            id="building-upload"
            label="גרור לכאן את תיק הבניין"
            sublabel="PDF, JPG, PNG · עד 50MB"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            file={data.buildingFile}
            tag="תיק בניין"
            onSelect={(f) => onChange({ ...data, buildingFile: f })}
            onRemove={() => onChange({ ...data, buildingFile: null })}
          />
        </div>

        {/* Hint */}
        <div className="p-5 border-l-2 border-[#00C896] bg-[#00C896]/5 flex items-start gap-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#00C896]" />
          <p className="text-xs text-slate-300 tracking-wider leading-relaxed">
            ניתן להוציא נסח טאבו עדכני מ
            <a
              href="https://www.gov.il/he/departments/topics/tabu-digital-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00C896] hover:text-[#00C896]/80 underline underline-offset-4 mx-1 transition-colors"
            >
              אתר רשות מקרקעי ישראל
            </a>
            תמורת תשלום מינימלי. ניתן לדלג על שלב זה — הדוח יהיה חלקי.
          </p>
        </div>
      </div>
    </div>
  );
}
