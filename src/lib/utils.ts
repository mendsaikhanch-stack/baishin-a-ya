import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMNT(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} тэрбум ₮`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(0)} сая ₮`;
  }
  return `${amount.toLocaleString()} ₮`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export function getReadinessColor(score: number): string {
  if (score >= 80) return "text-success-600";
  if (score >= 60) return "text-brand-600";
  if (score >= 40) return "text-warning-600";
  return "text-danger-600";
}

export function getReadinessBgColor(score: number): string {
  if (score >= 80) return "bg-success-500";
  if (score >= 60) return "bg-brand-500";
  if (score >= 40) return "bg-warning-500";
  return "bg-danger-500";
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "high": return "border-danger-500 bg-danger-50";
    case "medium": return "border-warning-500 bg-warning-50";
    case "low": return "border-success-500 bg-success-50";
    default: return "border-gray-300 bg-gray-50";
  }
}
