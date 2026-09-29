import { z } from "zod";
import { publicationShape, requireScheduleDate } from "@/features/publication/schema";

/** La bio es breve: se muestra dentro de la tarjeta de la ficha, junto al nombre. */
export const BIO_MAX_LENGTH = 300;

const IMAGE_UNAVAILABLE = "La imagen ya no está disponible. Súbela de nuevo.";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Texto opcional: vacío o ausente se guarda como `null`. */
function optionalText(max: number, label: string) {
  return z
    .string()
    .trim()
    .max(max, `${label} es demasiado largo (máx. ${max} caracteres)`)
    .nullish()
    .transform((value) => value || null);
}

/** Número opcional que llega como número o como texto de un formulario ("70,3" o "70.3"). */
function optionalNumber(label: string, { min, max, integer = false }: { min: number; max: number; integer?: boolean }) {
  let bounded = z.number({ error: `${label} debe ser un número` });
  if (integer) bounded = bounded.int(`${label} debe ser un número entero`);
  bounded = bounded.min(min, `${label} no puede ser menor que ${min}`).max(max, `${label} no puede ser mayor que ${max}`);

  return z
    .union([z.number(), z.string()])
    .nullish()
    .transform((value) => {
      if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
      return typeof value === "string" ? Number(value.replace(",", ".")) : value;
    })
    .pipe(bounded.nullable());
}

/** Contador del récord manual: vacío cuenta como 0. */
function recordCount(label: string) {
  return optionalNumber(label, { min: 0, max: 999, integer: true }).transform((value) => value ?? 0);
}

function optionalEnum<const Values extends readonly [string, ...string[]]>(values: Values, message: string) {
  return z
    .union([z.enum(values, { error: message }), z.literal("")])
    .nullish()
    .transform((value) => (value === "" || value === undefined ? null : value));
}

function optionalImageId() {
  return z
    .union([z.uuid({ error: IMAGE_UNAVAILABLE }), z.literal("")])
    .nullish()
    .transform((value) => value || null);
}

const birthDate = z
  .string()
  .nullish()
  .transform((value, ctx) => {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    const parsed = new Date(`${trimmed}T00:00:00Z`);
    const valid = BIRTH_DATE_PATTERN.test(trimmed) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(trimmed);
    if (!valid || parsed.getUTCFullYear() < 1900 || parsed.getTime() > Date.now()) {
      ctx.issues.push({ code: "custom", message: "La fecha de nacimiento no es válida", input: value });
      return z.NEVER;
    }
    return trimmed;
  });

export const fighterInputSchema = z
  .object({
    firstName: z.string({ error: "El nombre es obligatorio" }).trim().min(1, "El nombre es obligatorio").max(60, "El nombre es demasiado largo"),
    lastName: z.string({ error: "El apellido es obligatorio" }).trim().min(1, "El apellido es obligatorio").max(60, "El apellido es demasiado largo"),
    nickname: optionalText(40, "El apodo"),
    /** Solo al editar el enlace a mano; vacío = se genera del nombre (al crear) o se conserva (al editar). */
    slug: z
      .string()
      .trim()
      .max(80, "El enlace es demasiado largo")
      .regex(SLUG_PATTERN, "El enlace solo puede tener letras minúsculas sin tildes, números y guiones")
      .nullish()
      .or(z.literal(""))
      .transform((value) => value || null),
    gender: z.enum(["male", "female"], { error: "Elige masculino o femenino" }),
    birthDate,
    nationality: z
      .string({ error: "Elige el país" })
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Elige el país")
      .transform((value) => value.toUpperCase()),
    hometown: optionalText(80, "La ciudad"),
    divisionId: z.string({ error: "Selecciona una división" }).pipe(z.uuid({ error: "Selecciona una división" })),
    weightKg: optionalNumber("El peso", { min: 30, max: 200 }),
    heightCm: optionalNumber("La estatura", { min: 100, max: 250, integer: true }),
    reachCm: optionalNumber("El alcance", { min: 100, max: 260, integer: true }),
    stance: optionalEnum(["orthodox", "southpaw", "switch"], "Elige la guardia"),
    gym: optionalText(80, "El gimnasio"),
    coach: optionalText(80, "El entrenador"),
    baseDiscipline: optionalText(60, "La disciplina base"),
    bio: optionalText(BIO_MAX_LENGTH, "La biografía"),
    careerStatus: z.enum(["active", "inactive", "retired"], { error: "Elige el estado" }).default("active"),
    instagram: optionalText(200, "Instagram"),
    tiktok: optionalText(200, "TikTok"),
    youtube: optionalText(200, "YouTube"),
    x: optionalText(200, "X"),
    bodyMediaId: optionalImageId(),
    headshotMediaId: optionalImageId(),
    proWins: recordCount("Las victorias profesionales"),
    proLosses: recordCount("Las derrotas profesionales"),
    proDraws: recordCount("Los empates profesionales"),
    proNoContests: recordCount("Los sin resultado profesionales"),
    amWins: recordCount("Las victorias amateur"),
    amLosses: recordCount("Las derrotas amateur"),
    amDraws: recordCount("Los empates amateur"),
    amNoContests: recordCount("Los sin resultado amateur"),
    ...publicationShape,
  })
  .superRefine(requireScheduleDate);

export type FighterFormInput = z.input<typeof fighterInputSchema>;
/** Lo que entrega un formulario HTML: solo textos. Se valida y convierte con `fighterInputSchema`. */
export type FighterRawInput = FighterFormInput | Record<string, string>;
export type FighterData = z.output<typeof fighterInputSchema>;

export type FighterFilters = {
  q?: string;
  /** Slug de la división. */
  division?: string;
  /** Código ISO 3166-1 alfa-2. */
  nationality?: string;
  gender?: "male" | "female";
  status?: "active" | "inactive" | "retired";
};

/** Id de peleador que llega de la URL o de una action: uuid o nada. */
export const fighterIdSchema = z.uuid();
