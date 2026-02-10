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

