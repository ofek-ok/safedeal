"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Mail, PlusCircle } from "lucide-react";
import { EmailModal } from "./EmailModal";

export function ReportActionBar() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const handlePrintPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      <div className="sticky top-4 z-40 w-full mx-auto print:hidden">
        <div className="bg-navy-900/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/15 shadow-2xl">
          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
            {/* Download PDF */}
            <button
              onClick={handlePrintPDF}
              className="sd-btn-primary py-3 px-5 text-xs sm:text-sm font-bold flex-1 sm:flex-none shadow-lg"
            >
              <Download size={16} />
              <span>הורד כדוח PDF</span>
            </button>

            {/* Send via Email */}
            <button
              onClick={() => setIsEmailOpen(true)}
              className="py-3 px-5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 flex-1 sm:flex-none border border-white/20 text-white hover:bg-white/10 rounded-xl"
            >
              <Mail size={16} />
              <span>שליחה במייל</span>
            </button>
          </div>

          {/* New Analysis Link */}
          <Link
            href="/analyze"
            className="py-3 px-5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 border border-teal-500/40 text-teal-300 hover:bg-teal-500/15 hover:border-teal-500/60 rounded-xl w-full sm:w-auto"
          >
            <PlusCircle size={16} />
            <span>בדיקת נכס נוסף</span>
          </Link>
        </div>
      </div>

      <EmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
      />
    </>
  );
}
