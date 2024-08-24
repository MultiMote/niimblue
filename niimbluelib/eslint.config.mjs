import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{ts}"] },
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  { ignores: ["dist/*", "dumps/*", "**/*.{mjs,js}"] },
];
