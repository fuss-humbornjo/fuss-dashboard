import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const fussProxy = () => ({
    target: env.FUSS_API_URL || "http://localhost:8080",
    changeOrigin: true,
    ...(env.AGENT_SERVICE_TOKEN
      ? { headers: { Authorization: `Bearer ${env.AGENT_SERVICE_TOKEN}` } }
      : {}),
  });
  const proxy = {
    "/agent": fussProxy(),
    "/registry": fussProxy(),
  };
  return {
    // Dev serves at the root for local development; the embedded
    // production build is mounted by fuss under /ui/.
    base: command === "serve" ? "/" : "/ui/",
    server: { host: "127.0.0.1", proxy },
    preview: { host: "127.0.0.1", proxy },
    resolve: {
      alias: {
        "$app/environment": `${projectRoot}/src/lib/shims/app-environment.ts`,
        $components: `${projectRoot}/src/lib/components`,
        $lib: `${projectRoot}/src/lib`,
      },
    },
    plugins: [svelte(), tailwindcss(), viteSingleFile()],
  };
});
