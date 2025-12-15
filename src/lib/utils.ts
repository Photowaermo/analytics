import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Use manual formatting to avoid hydration mismatches between server and client
export function formatCurrency(value: number): string {
  const formatted = value.toFixed(2).replace(".", ",");
  // Add thousands separator
  const parts = formatted.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${parts.join(",")} €`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatPercent(value: number): string {
  // For very small percentages (< 0.1%), show more decimals
  if (value > 0 && value < 0.1) {
    return `${value.toFixed(2)}%`;
  }
  return `${value.toFixed(1)}%`;
}

// Translate common English terms to German
export function translateToGerman(text: string): string {
  const translations: Record<string, string> = {
    "Unknown": "Unbekannt",
    "N/A": "K.A.",
    "unknown": "unbekannt",
  };
  return translations[text] || text;
}
