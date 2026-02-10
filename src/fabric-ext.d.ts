import "fabric";

declare module "fabric" {
  interface Textbox {
    /** Shrink text to fit into text frame */
    fontAutoSize?: boolean;
  }
  interface TextboxProps {
    /** Shrink text to fit into text frame */
    fontAutoSize?: boolean;
  }
}
