import { build } from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  external: ["electron"],
  logLevel: "info",
};

await build({
  ...common,
  entryPoints: ["electron/main.ts"],
  outfile: "electron/dist/main.cjs",
});

await build({
  ...common,
  entryPoints: ["electron/preload.ts"],
  outfile: "electron/dist/preload.cjs",
});
