const PHONE_PATTERN = /^\+?[\d\s().-]{6,30}$/;
const MIN_DIGITS = 8;
const CHILE_CODE = "56";

/** Un celular chileno escrito sin el código del país: 9 dígitos que empiezan con 9 (con o sin el 0 inicial). */
const CHILEAN_MOBILE = /^9\d{8}$/;

/**
 * Enlace de WhatsApp (`wa.me`) desde un teléfono escrito a mano. Solo quedan los dígitos; un celular chileno sin código
 * de país lleva el 56. `null` si no hay número suficiente para llamar.
 */
export function whatsappUrl(phone: string): string | null {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (CHILEAN_MOBILE.test(digits)) digits = `${CHILE_CODE}${digits}`;
  return digits.length >= MIN_DIGITS ? `https://wa.me/${digits}` : null;
}

/** Enlace `tel:` desde un teléfono escrito a mano: sin espacios ni signos, conservando el «+» inicial. `null` si no hay dígitos. */
export function telUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}

/** Un teléfono escrito a mano: dígitos, un «+» inicial, espacios, paréntesis, puntos y guiones (6 a 30 caracteres). */
export function isPhoneLike(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}
