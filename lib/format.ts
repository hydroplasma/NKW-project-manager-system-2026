const dateFormatter = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const numberFormatter = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
const moneyFormatter = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
}

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatMoney(value: number) {
  return moneyFormatter.format(value);
}
