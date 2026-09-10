import { writable } from "svelte/store";

export type PrintDirection = "left" | "top";

export type LabelProps = {
  printDirection: PrintDirection;
  size: { width: number; height: number };
  dpmm: number;
};

export const DEFAULT_LABEL: LabelProps = {
  printDirection: "left",
  size: { width: 240, height: 96 },
  dpmm: 8,
};

export const labelProps = writable<LabelProps>(structuredClone(DEFAULT_LABEL));

const mmToPx = (mm: number, dpmm: number) => Math.round(mm * dpmm);

export const setLabelSize = (t: {
  widthMm: number;
  heightMm?: number;
  dpmm: number;
  printDirection: PrintDirection;
  continuous?: boolean;
}) => {
  labelProps.update((p) => ({
    ...p,
    dpmm: t.dpmm,
    printDirection: t.printDirection,
    size: {
      width: mmToPx(t.widthMm, t.dpmm),
      height: t.continuous ? p.size.height : mmToPx(t.heightMm ?? 30, t.dpmm),
    },
  }));
};
