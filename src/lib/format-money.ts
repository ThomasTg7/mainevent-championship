// Pesos chilenos siempre enteros y con el mismo texto en el servidor y en el navegador (locale fijo).
const clpFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

/** 15000 → "$15.000". */
export function formatClp(amount: number): string {
  return clpFormatter.format(amount).replace(/\s/g, "");
}
