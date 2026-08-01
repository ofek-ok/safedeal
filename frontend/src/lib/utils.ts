import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Add thousands separator */
export function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Strip thousands formatting */
export function stripFormatting(value: string): string {
  return value.replace(/[^0-9.]/g, "");
}

/** Gross yield % */
export function calcYield(price: string, rent: string): string {
  const p = parseFloat(stripFormatting(price));
  const r = parseFloat(stripFormatting(rent));
  if (!p || !r) return "";
  return ((r * 12) / p * 100).toFixed(2);
}

/** Format bytes → human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate Israeli phone (054..., 02..., +972...) */
export function isValidPhone(phone: string): boolean {
  return /^(\+972|0)[-\s]?\d{1,2}[-\s]?\d{3}[-\s]?\d{4}$/.test(phone.trim());
}
