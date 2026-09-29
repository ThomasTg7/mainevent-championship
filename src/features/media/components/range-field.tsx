import { Label } from "@/components/ui/label";

type RangeFieldProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Texto del valor actual ("120%"). */
  display?: string;
};

export function RangeField({ id, label, value, min, max, step, onChange, display }: RangeFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        {display ? <span className="text-xs text-muted-foreground tabular-nums">{display}</span> : null}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}
