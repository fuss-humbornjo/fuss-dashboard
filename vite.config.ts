import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const fussProxy = () => ({
    target: env.FUSS_API_URL || "http://localhost:8080",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ""),
    ...(env.AGENT_SERVICE_TOKEN
      ? { headers: { Authorization: `Bearer ${env.AGENT_SERVICE_TOKEN}` } }
      : {}),
  });
  const proxy = {
    "/api/agent": fussProxy(),
    "/api/registry": fussProxy(),
  };
  return {
    server: { host: "127.0.0.1", proxy },
    preview: { host: "127.0.0.1", proxy },
    publicDir: "static",
    resolve: {
      alias: {
        "$app/environment": `${projectRoot}/src/lib/shims/app-environment.ts`,
        $components: `${projectRoot}/src/lib/components`,
        $lib: `${projectRoot}/src/lib`,
      },
    },
    plugins: [svelte(), tailwindcss()],
  };
});
