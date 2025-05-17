import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

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
          if (id.includes("node_modules")){
            if (id.includes("fabric")) {
              return "lib.fabric";
            } else if (id.includes("@capacitor/filesystem") || id.includes("@capacitor/share")) {
              return "lib.cap";
            } else if (id.includes("zod")) {
              return "lib.zod";
            } else if (id.includes("@mmote/niimbluelib")) {
              return "lib.niim";
            }
            return "lib.other";
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
