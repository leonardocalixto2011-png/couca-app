import { STUDIO_TZ } from "./policy";

export function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: STUDIO_TZ,
  }).format(d);
}

export function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: STUDIO_TZ,
  }).format(d);
}

export function minLabel(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
