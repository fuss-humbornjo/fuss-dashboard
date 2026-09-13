// Service-token auth for the embedded build: fuss protects /agent/* and
// /registry/* with a bearer token. In dev the vite proxy injects it; when
// the dashboard is served embedded at /ui the browser must supply it —
// open /ui/?token=$AGENT_SERVICE_TOKEN once and it persists in localStorage.
const KEY = "fuss.token";

// bootstrapToken lifts ?token= from the URL into localStorage, then strips
// it so the token never lingers in history or copied links. Call once at
// app start.
export function bootstrapToken(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return;
  localStorage.setItem(KEY, token);
  params.delete("token");
  const query = params.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

export const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem(KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};
