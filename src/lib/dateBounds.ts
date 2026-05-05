// YYYY-MM-DD math (UTC). Sortable as strings, compatible with <input type="date">.
const iso = (d: Date) => d.toISOString().split('T')[0];
const shift = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return iso(d);
};

export const today = () => iso(new Date());
export const daysAgo = (n: number) => shift(-n);
export const daysFromNow = (n: number) => shift(n);