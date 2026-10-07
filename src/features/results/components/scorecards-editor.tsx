"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SCORECARDS } from "@/domain/bout-result";
import { cn } from "@/lib/cn";
import type { RoundScoreDraft, ScorecardDraft, ScorecardMode } from "../result-draft";

type ScorecardsEditorProps = {
  cards: ScorecardDraft[];
  mode: ScorecardMode;
  /** Cuántos rounds se puntúan en el modo «por round» (`scorecardRoundCount`). */
  roundCount: number;
  redName: string;
  blueName: string;
  error?: string;
  onChange: (cards: ScorecardDraft[]) => void;
  onModeChange: (mode: ScorecardMode) => void;
  /** Con las tarjetas completas, propone el resultado y el tipo de decisión; devuelve un aviso si no puede. */
  onSuggest: () => string | null;
};

const MODES: { value: ScorecardMode; label: string }[] = [
  { value: "total", label: "Solo el total" },
  { value: "rounds", label: "Round por round" },
];

const EMPTY_ROUND: RoundScoreDraft = { red: "", blue: "" };

/** Los rounds de la tarjeta, completados con filas vacías hasta `count`. */
function roundsOf(card: ScorecardDraft, count: number): RoundScoreDraft[] {
  const rounds = card.rounds ?? [];
  return Array.from({ length: count }, (_, index) => rounds[index] ?? EMPTY_ROUND);
}

function sum(rounds: RoundScoreDraft[], side: keyof RoundScoreDraft): number | null {
  let total = 0;
  for (const round of rounds) {
    const value = Number(round[side]);
    if (!round[side].trim() || !Number.isFinite(value)) return null;
    total += value;
  }
  return total;
}

/** Tarjetas de los jueces (opcionales, hasta 5): el total de cada esquina, o round por round con el total sumado solo. */
export function ScorecardsEditor({ cards, mode, roundCount, redName, blueName, error, onChange, onModeChange, onSuggest }: ScorecardsEditorProps) {
  const [hint, setHint] = useState<string | null>(null);

  function update(index: number, changes: Partial<ScorecardDraft>) {
    onChange(cards.map((card, position) => (position === index ? { ...card, ...changes } : card)));
  }

  function updateRound(index: number, round: number, changes: Partial<RoundScoreDraft>) {
    const card = cards[index]!;
    update(index, { rounds: roundsOf(card, roundCount).map((score, position) => (position === round ? { ...score, ...changes } : score)) });
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Tarjetas de los jueces (opcional)</legend>

      <div role="radiogroup" aria-label="Cómo anotar las tarjetas" className="inline-flex w-fit border border-border">
        {MODES.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-center px-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              mode === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <input type="radio" name="scorecard-mode" value={option.value} checked={mode === option.value} onChange={() => onModeChange(option.value)} className="sr-only" />
            {option.label}
          </label>
        ))}
      </div>

      {cards.map((card, index) => {
        const number = index + 1;
        const remove = (
          <Button type="button" variant="outline" size="icon" aria-label={`Quitar tarjeta ${number}`} onClick={() => onChange(cards.filter((_, position) => position !== index))}>
            <Trash2 aria-hidden />
          </Button>
        );
        const judge = (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tarjeta {number}: juez
            <Input value={card.judge} onChange={(event) => update(index, { judge: event.target.value })} placeholder={`Juez ${number}`} autoComplete="off" />
          </label>
        );

        if (mode === "total") {
          return (
            <div key={index} className="grid grid-cols-[1fr_5rem_5rem_auto] items-end gap-2">
              {judge}
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Tarjeta {number}: puntos de {redName}
                <Input value={card.red} onChange={(event) => update(index, { red: event.target.value })} inputMode="numeric" placeholder="29" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                Tarjeta {number}: puntos de {blueName}
                <Input value={card.blue} onChange={(event) => update(index, { blue: event.target.value })} inputMode="numeric" placeholder="28" />
              </label>
              {remove}
            </div>
          );
        }

        const rounds = roundsOf(card, roundCount);
        const [red, blue] = [sum(rounds, "red"), sum(rounds, "blue")];
        return (
          <div key={index} className="flex flex-col gap-2 border border-border p-3">
            <div className="grid grid-cols-[1fr_auto] items-end gap-2">
              {judge}
              {remove}
            </div>
            <div className="grid grid-cols-[3rem_1fr_1fr] items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
              <span />
              <span className="truncate">{redName}</span>
              <span className="truncate">{blueName}</span>
              {rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="contents">
                  <span className="font-medium">R{roundIndex + 1}</span>
                  <Input
                    aria-label={`Tarjeta ${number}, round ${roundIndex + 1}: puntos de ${redName}`}
                    value={round.red}
                    onChange={(event) => updateRound(index, roundIndex, { red: event.target.value })}
                    inputMode="numeric"
                    placeholder="10"
                  />
                  <Input
                    aria-label={`Tarjeta ${number}, round ${roundIndex + 1}: puntos de ${blueName}`}
                    value={round.blue}
                    onChange={(event) => updateRound(index, roundIndex, { blue: event.target.value })}
                    inputMode="numeric"
                    placeholder="9"
                  />
                </div>
              ))}
              <span className="font-medium">Total</span>
              <output className="px-3 text-sm text-foreground tabular-nums" aria-label={`Tarjeta ${number}: total de ${redName}`}>
                {red ?? "–"}
              </output>
              <output className="px-3 text-sm text-foreground tabular-nums" aria-label={`Tarjeta ${number}: total de ${blueName}`}>
                {blue ?? "–"}
              </output>
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" disabled={cards.length >= MAX_SCORECARDS} onClick={() => onChange([...cards, { judge: "", red: "", blue: "" }])}>
          <Plus aria-hidden /> Agregar tarjeta
        </Button>
        {cards.length >= 3 ? (
          <Button type="button" variant="outline" onClick={() => setHint(onSuggest())}>
            Sugerir desde tarjetas
          </Button>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {cards.length} de {MAX_SCORECARDS}
        </span>
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
