// Pesos chilenos siempre enteros y con el mismo texto en el servidor y en el navegador (locale fijo).
const clpFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

/** 15000 → "$15.000". */
export function formatClp(amount: number): string {
  return clpFormatter.format(amount).replace(/\s/g, "");
}

/** Lo que se escribe en un campo de monto → «15.000» (punto cada tres dígitos, sin ceros a la izquierda). Solo cuenta los dígitos. */
export function formatThousands(text: string): string {
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** «15.000» → 15000; sin dígitos, `null`. */
export function parseThousands(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
