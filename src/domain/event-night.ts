/** Cuántas horas antes de su inicio empieza «la noche» de un evento: desde ahí abrir Noche de pelea no sorprende a nadie. */
export const NIGHT_OPENS_HOURS_BEFORE = 12;

const HOUR_MS = 60 * 60 * 1000;

/** ¿Ya es la noche del evento? Falso antes de las 12 h previas al inicio; verdadero desde ahí y para siempre después. */
export function isEventNight(startsAt: Date, now: Date): boolean {
  return now.getTime() >= startsAt.getTime() - NIGHT_OPENS_HOURS_BEFORE * HOUR_MS;
}

/**
 * Cuántas horas después de su inicio un evento sigue siendo «próximo» aunque nadie lo haya marcado en vivo: una velada
 * dura unas horas y el panel puede tardar en abrir «Noche de pelea». La usan «Próximos» (en la base) y la venta de entradas.
 */
export const UPCOMING_GRACE_HOURS = 12;

/** ¿El evento empezó hace menos de `UPCOMING_GRACE_HOURS` (o aún no empieza)? */
export function isWithinUpcomingGrace(startsAt: Date, now: Date): boolean {
  return now.getTime() <= startsAt.getTime() + UPCOMING_GRACE_HOURS * HOUR_MS;
}
