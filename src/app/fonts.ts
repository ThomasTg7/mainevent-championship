import { Anton, Barlow, Barlow_Condensed } from "next/font/google";

// `display: "swap"`: el texto se pinta de inmediato con una fuente de reemplazo de métricas ajustadas (sin saltos de diseño) y
// cambia a la de la marca cuando llega. Solo Anton (los titulares gigantes de la portada) se precarga: las siete variantes de
// Barlow (~100 KB) se piden al usarse, en vez de competir con el CSS y el JS en la carga inicial de una conexión móvil.

export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow-condensed",
  display: "swap",
  preload: false,
});

export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
  preload: false,
});
