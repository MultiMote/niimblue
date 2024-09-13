// https://print.niimbot.com/api/hardware/list

fetch("https://oss-print.niimbot.com/public_resources/static_resources/devices.json")
  .then((resp) => resp.json())
  .then((items) => {
    items.sort((a, b) => a.name.localeCompare(b.name));

    const dir_d = {
      270: "left",
      180: "top",
      90: "left",
      0: "top",
    };

    const ppmm_d = {
      203: 8,
      300: 11.81,
    };

    const labeltypes_d = {
      "1": "LT.WithGaps",
      "2": "LT.Black",
      "3": "LT.Continuous",
      "4": "LT.Perforated",
      "5": "LT.Transparent",
      "6": "LT.PvcTag",
      "10": "LT.BlackMarkGap",
      "11": "LT.HeatShrinkTube",
    }

    console.log("/* AUTO-GENERATED FILE. DO NOT EDIT! */");
    console.log("/* use 'yarn gen-printer-models' to generate */\n");
    console.log('import { PrintDirection, LabelType as LT } from ".";\n');

    console.log("export enum PrinterModel {");
    console.log('  UNKNOWN = "UNKNOWN",');
    for (const item of items) {
      const name = item.name.toUpperCase().replaceAll("-", "_");
      console.log(`  ${name} = "${name}",`);
    }

    console.log("};");

    console.log(`
export interface PrinterModelMeta {
  model: PrinterModel;
  id: [number, ...number[]];
  dpi: number;
  printDirection: PrintDirection;
  printheadPixels: number;
  paperTypes: number[];
  densityMin: number;
  densityMax: number;
  densityDefault: number;
}
`);

    console.log("export const modelsLibrary: PrinterModelMeta[] = [");
    for (const item of items) {
      if (item.codes.length === 0) {
        continue;
      }

      const name = item.name.toUpperCase().replaceAll("-", "_");
      const dir = dir_d[item.printDirection];
      const ppmm = ppmm_d[item.paccuracyName];
      const paperTypes = item.paperType.split(',').map(e => labeltypes_d[e]).join(", ");

      console.log("  {");
      console.log(`    model: PrinterModel.${name},`);
      console.log(`    id: [${item.codes.join(', ')}],`);
      console.log(`    dpi: ${item.paccuracyName},`);
      console.log(`    printDirection: "${dir}",`);
      console.log(`    printheadPixels: ${Math.ceil(item.widthSetEnd * ppmm)},`);
      console.log(`    paperTypes: [${paperTypes}],`);
      console.log(`    densityMin: ${item.solubilitySetStart},`);
      console.log(`    densityMax: ${item.solubilitySetEnd},`);
      console.log(`    densityDefault: ${item.solubilitySetDefault},`);
      console.log("  },");
    }

    console.log("];");

    console.log(`
export const getPrinterMetaById = (id: number): PrinterModelMeta | undefined => {
    return modelsLibrary.find((o) => o.id.includes(id));
};

export const getPrinterMetaByModel = (model: PrinterModel): PrinterModelMeta | undefined => {
    return modelsLibrary.find((o) => o.model === model);
};`);

  });
