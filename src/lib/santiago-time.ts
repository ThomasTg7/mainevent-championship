// Las fechas de publicación y de eventos se escriben en hora de Chile (igual que `format-date.ts`).
const TIME_ZONE = "America/Santiago";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function santiagoParts(timestamp: number): Record<string, number> {
  const parts: Record<string, number> = {};
  for (const { type, value } of partsFormatter.formatToParts(timestamp)) {
    if (type !== "literal") parts[type] = Number(value);
  }
  return parts;
}

/** Diferencia (ms) entre la hora de Santiago y UTC en ese instante: -3 h en verano, -4 h en invierno. */
function santiagoOffsetMs(timestamp: number): number {
  const p = santiagoParts(timestamp);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(timestamp / 1000) * 1000;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

/** Fecha (`YYYY-MM-DD`) y hora (`HH:mm`) escritas en Santiago → instante real. `null` si falta algo o no existe. */
export function fromSantiagoInputs(date: string, time: string): Date | null {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [year, month, day] = [Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3])];
  const [hour, minute] = [Number(timeMatch[1]), Number(timeMatch[2])];
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const roundTrip = new Date(asUtc);
  if (roundTrip.getUTCFullYear() !== year || roundTrip.getUTCMonth() !== month - 1 || roundTrip.getUTCDate() !== day || hour > 23 || minute > 59) {
    return null;
  }

  // Dos pasadas: el desfase depende del instante, que a su vez depende del desfase (cambios de horario).
  const firstGuess = asUtc - santiagoOffsetMs(asUtc);
  return new Date(asUtc - santiagoOffsetMs(firstGuess));
}

export function toSantiagoInputs(instant: Date): { date: string; time: string } {
  const p = santiagoParts(instant.getTime());
  const two = (value: number) => String(value).padStart(2, "0");
  return { date: `${p.year}-${two(p.month)}-${two(p.day)}`, time: `${two(p.hour)}:${two(p.minute)}` };
}

/**
 * El día de hoy en Chile, fijado a mediodía UTC (igual que las fechas sin hora, como la de nacimiento): así `ageOn`
 * compara días de calendario de Santiago y no cambia la edad a las 20:00/21:00, cuando en UTC ya es mañana.
 */
export function santiagoToday(now: Date = new Date()): Date {
  return new Date(`${toSantiagoInputs(now).date}T12:00:00Z`);
}
