import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "node:path";

const getDate = (): string => {
  const date = new Date();
  const fmt = (n: number) => (n > 9 ? n : `0${n}`);
  return `${date.getFullYear()}-${fmt(date.getMonth() + 1)}-${fmt(date.getDate())}`;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // "tauri" mode selects the host (Tauri) platform implementation, the web
  // build resolves the stubs and does not contain any Tauri code.
  const isTauri = mode === "tauri";

  return {
    plugins: [svelte()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.COMMIT_TAG),
      __APP_COMMIT__: JSON.stringify(process.env.COMMIT_HASH),
      __BUILD_DATE__: JSON.stringify(getDate()),
    },
    optimizeDeps: {
      include: ["@mmote/niimbluelib"], // Fix browser error when using `npm link @mmote/niimbluelib`
    },
    resolve: {
      preserveSymlinks: true, // Fix build error when using `npm link @mmote/niimbluelib`
      alias: {
        $platform: resolve(__dirname, isTauri ? "./src/platform/tauri" : "./src/platform/web"),
        $: resolve(__dirname, "./src"),
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
              } else if (id.includes("@mnlphlp/plugin-blec") || id.includes("@tauri-apps/api")) {
                return "lib.2.tauri";
              } else if (id.includes("zod")) {
                return "lib.2.zod";
              } else if (id.includes("@mmote/niimbluelib")) {
                return "lib.2.niim";
              } else if (id.includes("pdfjs-dist")) {
                return "lib.2.pdf";
              }

              return "lib.1.other";
            }
            return null;
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ?? "";
            if (facadeModuleId.includes("/locale/dicts/") && facadeModuleId.endsWith(".json")) {
              return "assets/locales/[name].[hash].js";
            }
            return "assets/[name].[hash].js";
          },
        },
      },
    },
  };
});
