import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate Israeli phone (054..., 02..., +972...) */
export function isValidPhone(phone: string): boolean {
  return /^(\+972|0)[-\s]?\d{1,2}[-\s]?\d{3}[-\s]?\d{4}$/.test(phone.trim());
}
