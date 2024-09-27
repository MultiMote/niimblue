import fs from "fs";
import readline from "readline";
const codepoints = {};
const availableIcons = [];

let fileStream = fs.createReadStream("node_modules/material-icons/css/_codepoints.scss");

let rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

for await (const line of rl) {
  const r = /^\s*"(\w+)": (\w+)/.exec(line);
  if (r != null) {
    codepoints[r[1]] = r[2];
  }
}
fileStream.close();

fileStream = fs.createReadStream("node_modules/material-icons/index.d.ts");

rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

for await (const line of rl) {
  const r = /^\s*"(\w+)"/.exec(line);
  if (r != null) {
    availableIcons.push(r[1]);
  }
}
fileStream.close();

console.log(`import { type MaterialIcon } from "material-icons"`);
console.log("");
console.log("type IconListItem = Record<MaterialIcon, number>;");
console.log("");
console.log("export const icons: IconListItem = {");

for (const icon of availableIcons) {
  if (icon in codepoints) {
    console.log(`  "${icon}": 0x${codepoints[icon]},`);
  }
}

console.log("};");
