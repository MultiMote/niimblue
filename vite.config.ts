import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { ManualChunkMeta } from "rollup";

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
            } else if (id.includes("@capacitor/filesystem") || id.includes("@capacitor/share")) {
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
