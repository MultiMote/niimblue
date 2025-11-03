import { execSync } from "node:child_process";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    version: {
      name: execSync("git rev-parse HEAD").toString().trim().substring(0, 7),
    },
    alias: {
      $: "src",
    },
  },
};

export default config;
