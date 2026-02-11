// Bundled fonts - 400 (regular) and 700 (bold) weights, latin subset
// Sans-serif
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-700.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-700.css";
import "@fontsource/lato/latin-400.css";
import "@fontsource/lato/latin-700.css";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/oswald/latin-400.css";
import "@fontsource/oswald/latin-700.css";
import "@fontsource/raleway/latin-400.css";
import "@fontsource/raleway/latin-700.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/ubuntu/latin-400.css";
import "@fontsource/ubuntu/latin-700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow-condensed/latin-400.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/titillium-web/latin-400.css";
import "@fontsource/titillium-web/latin-700.css";
import "@fontsource/rubik/latin-400.css";
import "@fontsource/rubik/latin-700.css";
import "@fontsource/work-sans/latin-400.css";
import "@fontsource/work-sans/latin-700.css";
import "@fontsource/fira-sans/latin-400.css";
import "@fontsource/fira-sans/latin-700.css";
import "@fontsource/kanit/latin-400.css";
import "@fontsource/kanit/latin-700.css";
import "@fontsource/archivo/latin-400.css";
import "@fontsource/archivo/latin-700.css";
import "@fontsource/josefin-sans/latin-400.css";
import "@fontsource/josefin-sans/latin-700.css";
import "@fontsource/quicksand/latin-400.css";
import "@fontsource/quicksand/latin-700.css";
import "@fontsource/comfortaa/latin-400.css";
import "@fontsource/comfortaa/latin-700.css";
import "@fontsource/fredoka/latin-400.css";
import "@fontsource/fredoka/latin-700.css";
import "@fontsource/overpass/latin-400.css";
import "@fontsource/overpass/latin-700.css";

// Serif
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/merriweather/latin-400.css";
import "@fontsource/merriweather/latin-700.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-700.css";
import "@fontsource/pt-serif/latin-400.css";
import "@fontsource/pt-serif/latin-700.css";
import "@fontsource/libre-baskerville/latin-400.css";
import "@fontsource/libre-baskerville/latin-700.css";
import "@fontsource/crimson-text/latin-400.css";
import "@fontsource/crimson-text/latin-700.css";
import "@fontsource/bitter/latin-400.css";
import "@fontsource/bitter/latin-700.css";
import "@fontsource/arvo/latin-400.css";
import "@fontsource/arvo/latin-700.css";
import "@fontsource/zilla-slab/latin-400.css";
import "@fontsource/zilla-slab/latin-700.css";
import "@fontsource/abril-fatface/latin-400.css";

// Monospace
import "@fontsource/source-code-pro/latin-400.css";
import "@fontsource/source-code-pro/latin-700.css";
import "@fontsource/fira-code/latin-400.css";
import "@fontsource/fira-code/latin-700.css";
import "@fontsource/jetbrains-mono/latin-400.css";
import "@fontsource/jetbrains-mono/latin-700.css";
import "@fontsource/courier-prime/latin-400.css";
import "@fontsource/courier-prime/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-700.css";
import "@fontsource/inconsolata/latin-400.css";
import "@fontsource/inconsolata/latin-700.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";

// Display / Handwriting
import "@fontsource/dancing-script/latin-400.css";
import "@fontsource/dancing-script/latin-700.css";
import "@fontsource/pacifico/latin-400.css";
import "@fontsource/caveat/latin-400.css";
import "@fontsource/caveat/latin-700.css";
import "@fontsource/satisfy/latin-400.css";
import "@fontsource/great-vibes/latin-400.css";
import "@fontsource/permanent-marker/latin-400.css";
import "@fontsource/bebas-neue/latin-400.css";
import "@fontsource/anton/latin-400.css";
import "@fontsource/righteous/latin-400.css";
import "@fontsource/lobster/latin-400.css";

export interface BundledFont {
  family: string;
  category: "sans-serif" | "serif" | "monospace" | "display" | "handwriting";
}

export const bundledFonts: BundledFont[] = [
  // Sans-serif
  { family: "Archivo", category: "sans-serif" },
  { family: "Barlow", category: "sans-serif" },
  { family: "Barlow Condensed", category: "sans-serif" },
  { family: "Comfortaa", category: "sans-serif" },
  { family: "Fira Sans", category: "sans-serif" },
  { family: "Fredoka", category: "sans-serif" },
  { family: "Inter", category: "sans-serif" },
  { family: "Josefin Sans", category: "sans-serif" },
  { family: "Kanit", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Overpass", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Quicksand", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Rubik", category: "sans-serif" },
  { family: "Titillium Web", category: "sans-serif" },
  { family: "Ubuntu", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  // Serif
  { family: "Abril Fatface", category: "serif" },
  { family: "Arvo", category: "serif" },
  { family: "Bitter", category: "serif" },
  { family: "Crimson Text", category: "serif" },
  { family: "Libre Baskerville", category: "serif" },
  { family: "Lora", category: "serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "PT Serif", category: "serif" },
  { family: "Zilla Slab", category: "serif" },
  // Monospace
  { family: "Courier Prime", category: "monospace" },
  { family: "Fira Code", category: "monospace" },
  { family: "IBM Plex Mono", category: "monospace" },
  { family: "Inconsolata", category: "monospace" },
  { family: "JetBrains Mono", category: "monospace" },
  { family: "Source Code Pro", category: "monospace" },
  { family: "Space Mono", category: "monospace" },
  // Display
  { family: "Anton", category: "display" },
  { family: "Bebas Neue", category: "display" },
  { family: "Lobster", category: "display" },
  { family: "Permanent Marker", category: "display" },
  { family: "Righteous", category: "display" },
  // Handwriting
  { family: "Caveat", category: "handwriting" },
  { family: "Dancing Script", category: "handwriting" },
  { family: "Great Vibes", category: "handwriting" },
  { family: "Pacifico", category: "handwriting" },
  { family: "Satisfy", category: "handwriting" },
];

export const bundledFontFamilies: string[] = bundledFonts.map(f => f.family);
