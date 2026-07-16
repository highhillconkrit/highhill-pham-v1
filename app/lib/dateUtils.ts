/** Extract YYYY-MM-DD from a Date using UTC methods (avoids timezone shift). */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD string into { year, month (0-indexed), day }. */
export function parseDateKey(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

/** Build a UTC range for a full year+month (0-indexed month). */
export function yearMonthRange(year: number, month: number): { start: Date; end: Date } {
  const mm = String(month + 1).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const dd = String(lastDay).padStart(2, "0");
  return {
    start: new Date(`${year}-${mm}-01T00:00:00.000Z`),
    end: new Date(`${year}-${mm}-${dd}T23:59:59.999Z`),
  };
}

/** Build a UTC range for a single YYYY-MM-DD date. */
export function dateKeyRange(dateStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateStr}T00:00:00.000Z`),
    end: new Date(`${dateStr}T23:59:59.999Z`),
  };
}
