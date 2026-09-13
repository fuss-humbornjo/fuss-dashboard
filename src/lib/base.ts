// URL base the SPA is served under ("/ui" in the embedded fuss build).
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export const withBase = (p: string) => `${BASE}${p}`;
export const stripBase = (p: string) =>
  p.startsWith(BASE) ? p.slice(BASE.length) || "/" : p;
