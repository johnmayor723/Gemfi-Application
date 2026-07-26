export function fmtMoney(v) {
  return (v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtNaira(v) {
  return `₦${fmtMoney(v)}`;
}

export function fmtPct(v, digits = 1) {
  if (v == null || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}
