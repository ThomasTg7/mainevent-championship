import { Button } from "@/components/ui/button";
import { DEFAULT_ADJUSTMENTS, type MediaEdit } from "../schema";
import { RangeField } from "./range-field";

type Adjustments = MediaEdit["adjustments"];

export function adjustmentsFilter({ brightness, contrast, saturation }: Adjustments): string {
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

const FIELDS: { key: keyof Adjustments; label: string }[] = [
  { key: "brightness", label: "Brillo" },
  { key: "contrast", label: "Contraste" },
  { key: "saturation", label: "Saturación" },
];

type AdjustmentsProps = {
  value: Adjustments;
  onChange: (value: Adjustments) => void;
};

export function AdjustmentsPanel({ value, onChange }: AdjustmentsProps) {
  const isDefault = FIELDS.every(({ key }) => value[key] === DEFAULT_ADJUSTMENTS[key]);

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-semibold">Ajustes de color</legend>
      {FIELDS.map(({ key, label }) => (
        <RangeField
          key={key}
          id={`adjust-${key}`}
          label={label}
          min={0.5}
          max={1.5}
          step={0.05}
          value={value[key]}
          display={`${Math.round(value[key] * 100)}%`}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
      <Button type="button" variant="ghost" className="self-start" disabled={isDefault} onClick={() => onChange(DEFAULT_ADJUSTMENTS)}>
        Restablecer colores
      </Button>
    </fieldset>
  );
}
