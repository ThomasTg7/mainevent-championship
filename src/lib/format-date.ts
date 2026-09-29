// Zona horaria fija: el servidor (Vercel corre en UTC) y el navegador deben
// mostrar el mismo día; si no, hay desfase de fecha y errores de hidratación.
const TIME_ZONE = "America/Santiago";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: TIME_ZONE });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
