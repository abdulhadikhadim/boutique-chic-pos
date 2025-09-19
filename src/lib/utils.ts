import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting utility for PKR
export function formatPKR(amount: number): string {
  return `PKR ${amount.toFixed(2)}`;
}
