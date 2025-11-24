import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
const config = {
  compilerOptions: {
    runes: true
  },
  preprocess: vitePreprocess(),
};

export default config;
