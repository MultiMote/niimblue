import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getDate = (): string => {
  const date = new Date();
  const fmt = (n: number) => (n > 9 ? n : `0${n}`);
  return `${date.getFullYear()}-${fmt(date.getMonth() + 1)}-${fmt(date.getDate())}`;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __APP_COMMIT__: JSON.stringify(process.env.COMMIT_HASH),
    __BUILD_DATE__: JSON.stringify(getDate()),
  },
  optimizeDeps: {
    include: ["@mmote/niimbluelib"], // Fix browser error when using `npm link @mmote/niimbluelib`
  },
  resolve: {
    preserveSymlinks: true, // Fix build error when using `npm link @mmote/niimbluelib`
    alias: {
      $: resolve(__dirname, "./src"),
      $utils: resolve(__dirname, "./src/utils"),
      $routes: resolve(__dirname, "./src/routes"),
      $styles: resolve(__dirname, "src/styles"),
      $components: resolve(__dirname, "src/components"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.endsWith(".css") || id.endsWith(".scss")) {
            return "style";
          }

          if (id.includes("node_modules")) {
            if (id.includes("fabric")) {
              return "lib.2.fabric";
            } else if (
              id.includes("@capacitor/filesystem") ||
              id.includes("@capacitor/share")
            ) {
              return "lib.2.cap";
            } else if (id.includes("zod")) {
              return "lib.2.zod";
            } else if (id.includes("@mmote/niimbluelib")) {
              return "lib.2.niim";
            }

            return "lib.1.other";
          }
          return null;
        },
        chunkFileNames: () => {
          return "assets/[name].[hash].js";
        },
      },
    },
  },
});
