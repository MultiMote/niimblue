// Bundled fonts - 400 (regular) and 700 (bold) weights, ALL subsets via unicode-range (browser downloads only what is needed)
// Sans-serif
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/700.css";
import "@fontsource/raleway/400.css";
import "@fontsource/raleway/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/ubuntu/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/400.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/titillium-web/400.css";
import "@fontsource/titillium-web/700.css";
import "@fontsource/rubik/400.css";
import "@fontsource/rubik/700.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/700.css";
import "@fontsource/fira-sans/400.css";
import "@fontsource/fira-sans/700.css";
import "@fontsource/kanit/400.css";
import "@fontsource/kanit/700.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/700.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/700.css";
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/700.css";
import "@fontsource/comfortaa/400.css";
import "@fontsource/comfortaa/700.css";
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/overpass/400.css";
import "@fontsource/overpass/700.css";

// Serif
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/700.css";
import "@fontsource/pt-serif/400.css";
import "@fontsource/pt-serif/700.css";
import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "@fontsource/crimson-text/400.css";
import "@fontsource/crimson-text/700.css";
import "@fontsource/bitter/400.css";
import "@fontsource/bitter/700.css";
import "@fontsource/arvo/400.css";
import "@fontsource/arvo/700.css";
import "@fontsource/zilla-slab/400.css";
import "@fontsource/zilla-slab/700.css";
import "@fontsource/abril-fatface/400.css";

// Monospace
import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/700.css";
import "@fontsource/fira-code/400.css";
import "@fontsource/fira-code/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";

// Display / Handwriting
import "@fontsource/dancing-script/400.css";
import "@fontsource/dancing-script/700.css";
import "@fontsource/pacifico/400.css";
import "@fontsource/caveat/400.css";
import "@fontsource/caveat/700.css";
import "@fontsource/satisfy/400.css";
import "@fontsource/great-vibes/400.css";
import "@fontsource/permanent-marker/400.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/anton/400.css";
import "@fontsource/righteous/400.css";
import "@fontsource/lobster/400.css";

export interface BundledFont {
  family: string;
  category: "sans-serif" | "serif" | "monospace" | "display" | "handwriting";
  cyrillic?: boolean;
}

export const bundledFonts: BundledFont[] = [
  // Sans-serif
  { family: "Archivo", category: "sans-serif" },
  { family: "Barlow", category: "sans-serif" },
  { family: "Barlow Condensed", category: "sans-serif" },
  { family: "Comfortaa", category: "sans-serif", cyrillic: true },
  { family: "Fira Sans", category: "sans-serif", cyrillic: true },
  { family: "Fredoka", category: "sans-serif" },
  { family: "Inter", category: "sans-serif", cyrillic: true },
  { family: "Josefin Sans", category: "sans-serif" },
  { family: "Kanit", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif", cyrillic: true },
  { family: "Nunito", category: "sans-serif", cyrillic: true },
  { family: "Open Sans", category: "sans-serif", cyrillic: true },
  { family: "Oswald", category: "sans-serif", cyrillic: true },
  { family: "Overpass", category: "sans-serif", cyrillic: true },
  { family: "Poppins", category: "sans-serif" },
  { family: "Quicksand", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif", cyrillic: true },
  { family: "Roboto", category: "sans-serif", cyrillic: true },
  { family: "Rubik", category: "sans-serif", cyrillic: true },
  { family: "Titillium Web", category: "sans-serif" },
  { family: "Ubuntu", category: "sans-serif", cyrillic: true },
  { family: "Work Sans", category: "sans-serif" },
  // Serif
  { family: "Abril Fatface", category: "serif" },
  { family: "Arvo", category: "serif" },
  { family: "Bitter", category: "serif", cyrillic: true },
  { family: "Crimson Text", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "Lora", category: "serif", cyrillic: true },
  { family: "Merriweather", category: "serif", cyrillic: true },
  { family: "Playfair Display", category: "serif", cyrillic: true },
  { family: "PT Serif", category: "serif", cyrillic: true },
  { family: "Zilla Slab", category: "serif" },
  // Monospace
  { family: "Courier Prime", category: "monospace" },
  { family: "Fira Code", category: "monospace", cyrillic: true },
  { family: "IBM Plex Mono", category: "monospace", cyrillic: true },
  { family: "Inconsolata", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace", cyrillic: true },
  { family: "Source Code Pro", category: "monospace", cyrillic: true },
  { family: "Space Mono", category: "monospace" },
  // Display
  { family: "Anton", category: "display" },
  { family: "Bebas Neue", category: "display" },
  { family: "Lobster", category: "display", cyrillic: true },
  { family: "Permanent Marker", category: "display" },
  { family: "Righteous", category: "display" },
  // Handwriting
  { family: "Caveat", category: "handwriting", cyrillic: true },
  { family: "Dancing Script", category: "handwriting" },
  { family: "Great Vibes", category: "handwriting" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Satisfy", category: "handwriting" },
];

export const bundledFontFamilies: string[] = bundledFonts.map(f => f.family);
