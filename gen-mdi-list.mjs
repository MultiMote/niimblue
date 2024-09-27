const response = await fetch(
  "https://raw.githubusercontent.com/google/material-design-icons/refs/heads/master/font/MaterialIcons-Regular.codepoints"
);
const iconsText = await response.text();
const lines = iconsText.split("\n");

console.log("type IconListItem = Record<string, string>;");
console.log("");
console.log("export const icons: IconListItem = {");
let lastName = "";
for (const line of lines) {
  if (!line) {
    continue;
  }
  const [name, codepoint] = line.split(" ");

  if (name === lastName) {
    continue;
  }

  console.log(`  "${name}": "${codepoint}",`);

  lastName = name;
}
console.log("};");
