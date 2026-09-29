import { Button } from "@/components/ui/button";
import { DEFAULT_ADJUSTMENTS, type MediaEdit } from "../schema";
import { RangeField } from "./range-field";

type Adjustments = MediaEdit["adjustments"];

const SHARPEN_FILTER_ID = "gc-sharpen";

/** Filtro CSS para las vistas previas; el resultado final lo genera el servidor con sharp. */
export function adjustmentsFilter({ brightness, contrast, saturation, sharpness }: Adjustments): string {
  const colors = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  return sharpness > 0 ? `${colors} url(#${SHARPEN_FILTER_ID})` : colors;
}

/** Define el filtro SVG que usan las vistas previas para mostrar la nitidez. Va una sola vez en el editor. */
export function SharpenFilter({ sharpness }: { sharpness: number }) {
  const a = sharpness * 0.35;
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={SHARPEN_FILTER_ID} colorInterpolationFilters="sRGB">
        <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix={`0 ${-a} 0 ${-a} ${1 + 4 * a} ${-a} 0 ${-a} 0`} />
      </filter>
    </svg>
  );
}

const FIELDS: { key: keyof Adjustments; label: string; min: number; max: number; display: (value: number) => string }[] = [
  { key: "brightness", label: "Brillo", min: 0.5, max: 1.5, display: (value) => `${Math.round(value * 100)}%` },
  { key: "contrast", label: "Contraste", min: 0.5, max: 1.5, display: (value) => `${Math.round(value * 100)}%` },
  { key: "saturation", label: "Saturación", min: 0.5, max: 1.5, display: (value) => `${Math.round(value * 100)}%` },
  { key: "sharpness", label: "Nitidez", min: 0, max: 2, display: (value) => `${Math.round(value * 50)}%` },
];

type AdjustmentsProps = {
  value: Adjustments;
  onChange: (value: Adjustments) => void;
};

export function AdjustmentsPanel({ value, onChange }: AdjustmentsProps) {
  const isDefault = FIELDS.every(({ key }) => value[key] === DEFAULT_ADJUSTMENTS[key]);

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-semibold">Ajustes de imagen</legend>
      {FIELDS.map(({ key, label, min, max, display }) => (
        <RangeField
          key={key}
          id={`adjust-${key}`}
          label={label}
          min={min}
          max={max}
          step={0.05}
          value={value[key]}
          display={display(value[key])}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
      <Button type="button" variant="ghost" className="self-start" disabled={isDefault} onClick={() => onChange(DEFAULT_ADJUSTMENTS)}>
        Restablecer ajustes
      </Button>
    </fieldset>
  );
}
