"use client";

export default function PrintButton() {
  return <button className="print-button" onClick={() => window.print()}>הדפסה / שמירה כ-PDF</button>;
}
