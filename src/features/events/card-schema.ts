import { z } from "zod";
import { BOUT_CORNERS, BOUT_LEVELS, DEFAULT_ROUND_SECONDS, MAX_ROUND_SECONDS, MIN_ROUND_SECONDS } from "@/domain/bout-enums";
import { optionalNumber, optionalText } from "@/lib/zod-fields";
import { optionalTime } from "./schema";

/** Bloque de la cartelera (nombre libre) con su hora de inicio opcional, escrita en Chile el día del evento. */
export const segmentInputSchema = z.object({
  id: z.uuid().nullish(),
  name: z.string({ error: "Escribe el nombre del bloque" }).trim().min(1, "Escribe el nombre del bloque").max(60, "El nombre del bloque es demasiado largo"),
  startsTime: optionalTime(),
});

export type SegmentRawInput = z.input<typeof segmentInputSchema>;

const fighterId = (message: string) => z.string({ error: message }).pipe(z.uuid({ error: message }));

const booleanish = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === "true" || value === "on");

const scheduledRounds = z
  .union([z.number(), z.string()])
  .optional()
  .transform((value) => (value === undefined || value === "" ? 3 : Number(value)))
  .pipe(z.union([z.literal(3), z.literal(5)], { error: "Los rounds deben ser 3 o 5" }));

export const boutInputSchema = z
  .object({
    redFighterId: fighterId("Elige el peleador de la esquina roja"),
    blueFighterId: fighterId("Elige el peleador de la esquina azul"),
    divisionId: z
      .union([z.uuid({ error: "Esa división no existe" }), z.literal("")])
      .nullish()
      .transform((value) => value || null),
    catchweightKg: optionalNumber("El peso pactado", { min: 40, max: 200 }),
    level: z.enum(BOUT_LEVELS, { error: "Elige el nivel" }).default("pro"),
    scheduledRounds,
    roundSeconds: optionalNumber("La duración del round", { min: MIN_ROUND_SECONDS, max: MAX_ROUND_SECONDS, integer: true }).transform(
      (value) => value ?? DEFAULT_ROUND_SECONDS,
    ),
    isTitleFight: booleanish,
    championCorner: z.enum(BOUT_CORNERS, { error: "Elige la esquina del campeón" }).default("red"),
  })
  .superRefine((value, ctx) => {
    if (!value.divisionId && value.catchweightKg === null) {
      ctx.addIssue({ code: "custom", path: ["divisionId"], message: "Elige la división o indica el peso pactado" });
    }
  });

export type BoutData = z.output<typeof boutInputSchema>;
export type BoutRawInput = z.input<typeof boutInputSchema>;

/** Motivo de una pelea cancelada (opcional). */
export const cancelReasonSchema = optionalText(200, "El motivo");
