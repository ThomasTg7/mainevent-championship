// Módulo sin "use client": lo usan el Header/menú (cliente) y el Footer (servidor).
export const NAV_LINKS = [
  { href: "/eventos", label: "Eventos" },
  { href: "/peleadores", label: "Peleadores" },
  { href: "/rankings", label: "Rankings" },
  { href: "/noticias", label: "Noticias" },
  { href: "/entradas", label: "Entradas" },
] as const;
