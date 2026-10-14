import { currentLanguage } from '@/lib/i18n/current';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parseia uma data "YYYY-MM-DD" (formato de <input type="date"> e de Project.date)
 * como horário local, em vez de UTC. `new Date("2026-01-15")` é interpretado como
 * meia-noite UTC, então em fusos atrás de UTC (todo o Brasil) `.toLocaleDateString()`
 * mostra o dia anterior. Datas com componente de hora (ISO completo) passam direto.
 */
export function parseLocalDate(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return new Date(dateStr);
}

export function formatLocalDate(
  dateStr: string,
  locale: string = currentLanguage(),
  options?: Intl.DateTimeFormatOptions
): string {
  return parseLocalDate(dateStr).toLocaleDateString(locale, options);
}
