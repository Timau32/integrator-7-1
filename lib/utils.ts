import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Объединяет условные className, разрешая конфликты Tailwind-классов.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
