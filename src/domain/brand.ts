/** Public identity shared by presentation, metadata and transactional copy. */
export const BRAND = {
  name: "Mainevent Championship",
  /** Short mark used in watermarks and the panel: the oversized «MAIN» of the event posters. */
  shortName: "MAIN",
  description: "Mainevent Championship: eventos, carteleras, peleadores y rankings de Muay Thai y Kickboxing.",
  /** Official profile; `null` until the promotion confirms it (the footer hides the link meanwhile). */
  instagramUrl: null as string | null,
  colors: { primary: "#FFE500", orange: "#FF8A00", ink: "#000000" },
} as const;
