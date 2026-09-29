import { z } from "zod";

const adjustment = z.number().min(0.5).max(1.5);
const unit = z.number().min(0).max(1);

export const mediaEditSchema = z.object({
  crop: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .nullable(),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  focal: z.object({ x: unit, y: unit }),
  adjustments: z.object({ brightness: adjustment, contrast: adjustment, saturation: adjustment }),
  alt: z.string().trim().max(300),
});

export type MediaEdit = z.infer<typeof mediaEditSchema>;

export const DEFAULT_ADJUSTMENTS: MediaEdit["adjustments"] = { brightness: 1, contrast: 1, saturation: 1 };
