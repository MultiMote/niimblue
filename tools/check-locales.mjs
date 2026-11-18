import fs from "fs";
import path from "path";

const projectRoot = path.resolve(import.meta.dirname, "..");

// Validate translation dictionaries against the English one.
// - missing keys: ok, they fall back to en at runtime
// - extra keys: bad, they are not valid translation keys (missing in en.json)
// - empty values: reported as missing (treated as missing at runtime)
//
// Usage: node check-locales.mjs [--missing]
//   --missing  list missing keys for each language (shown as counts by default)
//
// Exits with code 1 when extra keys are found.

const dictsDir = path.join(projectRoot, "src/locale/dicts");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dictsDir, file), "utf8"));

const en = readJson("en.json");
const enKeys = Object.keys(en);

let failed = false;

for (const file of fs.readdirSync(dictsDir).sort()) {
  if (!file.endsWith(".json") || file === "en.json") {
    continue;
  }
  
  const dict = readJson(file);

  const missing = enKeys.filter((key) => !(key in dict));
  const empty = Object.keys(dict).filter((key) => key in en && dict[key] === "");
  const extra = Object.keys(dict)
    .filter((key) => !(key in en))
    .sort();

  const report = [];

  if (extra.length > 0) {
    report.push(`  extra keys (this is bad): ${extra.join(", ")}`);
  }

  if (empty.length > 0) {
    report.push(`  empty values (treated as missing): ${empty.join(", ")}`);
  }

  if (missing.length > 0) {
    report.push(
      process.argv.includes("--missing")
        ? `  missing keys: ${missing.join(", ")}`
        : `  missing keys: ${missing.length}`,
    );
  }

  console.log(`${file}\n${report.join("\n")}`);

  failed ||= extra.length > 0;
}

process.exitCode = failed ? 1 : 0;
