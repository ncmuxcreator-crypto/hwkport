export const arr = value =>
  Array.isArray(value) ? value :
  Array.isArray(value?.data) ? value.data :
  Array.isArray(value?.items) ? value.items :
  Array.isArray(value?.vessels) ? value.vessels :
  Array.isArray(value?.ports) ? value.ports :
  Array.isArray(value?.candidates) ? value.candidates :
  Array.isArray(value?.opportunities) ? value.opportunities :
  Array.isArray(value?.visits) ? value.visits :
  Array.isArray(value?.alerts) ? value.alerts :
  Array.isArray(value?.rows) ? value.rows : [];

export const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const isKnownNumber = value =>
  value !== undefined &&
  value !== null &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value));

export const fmt = value =>
  isKnownNumber(value) ? Number(value).toLocaleString("ko-KR") : "확인 불가";

export const esc = value => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export const pick = (object, ...keys) =>
  keys
    .map(key => object?.[key])
    .find(value => value !== undefined && value !== null && String(value).trim() !== "") ?? "";

export const uniqueBy = (items, keyFn) => {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
};
