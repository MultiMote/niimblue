import { type Config } from "prettier";

const config: Config = {
  useTabs: false,
  trailingComma: "none",
  printWidth: 120,
  plugins: ["prettier-plugin-svelte"],
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
};

export default config;
