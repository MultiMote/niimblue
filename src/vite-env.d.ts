/// <reference types="svelte" />
/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __BUILD_DATE__: string;

// not declared in ts lib, experimental feature
declare type FontData = {
  readonly family: string;
  readonly fullName: string;
  readonly postscriptName: string;
  readonly style: string;
};

declare function queryLocalFonts(): Promise<ReadonlyArray<FontData>>;

// Extend types and functions that are not exported in @types/fabric
declare namespace fabric {
  /** deprecated, by no other ways to stop style copy now */
  let disableStyleCopyPaste: boolean;

  type MoveCommand = ["M" | "m", number, number];
  type LineCommand = ["L" | "l", number, number] | ["H" | "h" | "V" | "v", number];
  type CurveCommand =
    | ["C" | "c", number, number, number, number, number, number]
    | ["S" | "s", number, number, number, number];
  type QuadraticCommand = ["Q" | "q", number, number, number, number] | ["T" | "t", number, number];
  type EllipseCommand = ["A" | "a", number, number, number, number, number, number, number];
  type CloseCommand = ["Z" | "z"];
  type PathCommand = MoveCommand | LineCommand | CurveCommand | QuadraticCommand | EllipseCommand | CloseCommand;

  interface IUtil {
    /**
     * Parse SVG path string into array of path commands
     * @param pathString SVG path string
     */
    parsePath(pathString: string): PathCommand[];
    /**
     * Simplify path commands
     * @param path Array of path commands
     */
    makePathSimpler(path: PathCommand[]): PathCommand[];
    /**
     * Join path commands into a single path string
     * @param pathData Array of path commands
     */
    joinPath(pathData: PathCommand[]): string;
  }

  interface Canvas {
    _renderBackground(ctx: CanvasRenderingContext2D): void
  }
}
