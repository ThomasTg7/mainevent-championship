"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScorecardDraft } from "../result-draft";

type ScorecardsEditorProps = {
  cards: ScorecardDraft[];
  redName: string;
  blueName: string;
  error?: string;
  onChange: (cards: ScorecardDraft[]) => void;
  /** Con las tarjetas completas, propone el resultado y el tipo de decisión; devuelve un aviso si no puede. */
  onSuggest: () => string | null;
};

const MAX_CARDS = 3;

/** Tarjetas de los jueces (opcionales): un juez y el puntaje de cada esquina. */
export function ScorecardsEditor({ cards, redName, blueName, error, onChange, onSuggest }: ScorecardsEditorProps) {
  const [hint, setHint] = useState<string | null>(null);

  function update(index: number, changes: Partial<ScorecardDraft>) {
    onChange(cards.map((card, position) => (position === index ? { ...card, ...changes } : card)));
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Tarjetas de los jueces (opcional)</legend>
      {cards.map((card, index) => (
        <div key={index} className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tarjeta {index + 1}: juez
            <Input value={card.judge} onChange={(event) => update(index, { judge: event.target.value })} placeholder={`Juez ${index + 1}`} autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tarjeta {index + 1}: puntos de {redName}
            <Input value={card.red} onChange={(event) => update(index, { red: event.target.value })} inputMode="numeric" placeholder="29" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tarjeta {index + 1}: puntos de {blueName}
            <Input value={card.blue} onChange={(event) => update(index, { blue: event.target.value })} inputMode="numeric" placeholder="28" />
          </label>
          <Button type="button" variant="outline" size="icon" aria-label={`Quitar tarjeta ${index + 1}`} onClick={() => onChange(cards.filter((_, position) => position !== index))}>
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={cards.length >= MAX_CARDS} onClick={() => onChange([...cards, { judge: "", red: "", blue: "" }])}>
          <Plus aria-hidden /> Agregar tarjeta
        </Button>
        {cards.length === MAX_CARDS ? (
          <Button type="button" variant="outline" onClick={() => setHint(onSuggest())}>
            Sugerir desde tarjetas
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
