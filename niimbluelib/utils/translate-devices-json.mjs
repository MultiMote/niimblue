const locale = (
  await (await fetch("https://oss-print.niimbot.com/public_resources/static_resources/languagePack/en.json")).json()
)["lang"];

const translateDeep = (obj) => {
  if (typeof obj === "object") {
    for (const key in obj) {
      if (typeof obj[key] === "object") {
        translateDeep(obj[key]);
      } else if (typeof obj[key] === "string" && key === "multilingualCode") {
        const translated = locale[obj[key]];
        obj["translated"] = translated ? translated["value"] : "TRANSLATION_NOT_FOUND";
      }
    }
  }
  return obj;
};

const devices = await (await fetch("https://oss-print.niimbot.com/public_resources/static_resources/devices.json")).json();

const translated = devices.map(translateDeep);

console.log(JSON.stringify(translated, null, 2));
