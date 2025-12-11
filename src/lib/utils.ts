import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
