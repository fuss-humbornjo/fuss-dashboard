// Minimal SvelteKit `$app/environment` shim for this plain Vite SPA.
// Vendored code (edra's useEditor) imports from `$app/environment`.
export const browser = true;
export const building = false;
export const dev = import.meta.env.DEV;
export const version = "";
