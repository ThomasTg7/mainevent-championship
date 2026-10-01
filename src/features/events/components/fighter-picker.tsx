"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { FormField } from "@/components/admin/form-field";
import { Flag } from "@/components/ui-gc/flag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchFightersForBoutAction, type FighterSearchResult } from "../card-actions";

export type PickedFighter = { id: string; label: string };

type FighterPickerProps = {
  label: string;
  corner: "red" | "blue";
  value: PickedFighter | null;
  onChange: (value: PickedFighter | null) => void;
  /** Peleadores que ya tienen otra pelea en el evento: se muestran pero no se pueden elegir. */
  busyIds: string[];
  error?: string;
};

const SEARCH_DELAY_MS = 250;
const CORNER_COLOR = { red: "border-l-[#D7263D]", blue: "border-l-[#1E6FD9]" } as const;

/** Buscador de peleadores por nombre o apodo: pide a lo más 10 resultados al servidor, nunca la lista completa. */
export function FighterPicker({ label, corner, value, onChange, busyIds, error }: FighterPickerProps) {
  const uid = useId();
  const [query, setQuery] = useState("");
  // Lo encontrado se guarda con el texto que lo pidió: solo se muestra si sigue siendo el texto actual.
  const [found, setFound] = useState<{ text: string; items: FighterSearchResult[] } | null>(null);
  const text = query.trim();
  const results = text.length >= 2 && found?.text === text ? found.items : null;

  useEffect(() => {
    if (text.length < 2) return;
    let stale = false;
    const timer = setTimeout(async () => {
      const items = await searchFightersForBoutAction(text);
      if (!stale) setFound({ text, items });
    }, SEARCH_DELAY_MS);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [text]);

  if (value) {
    return (
      <FormField id={`${uid}-picked`} label={label} error={error}>
        <div className={`flex min-h-11 items-center justify-between gap-2 border border-border border-l-4 bg-card px-3 ${CORNER_COLOR[corner]}`}>
          <span id={`${uid}-picked`} className="font-medium break-words">
            {value.label}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} aria-label={`Cambiar ${label.toLowerCase()}`}>
            <X aria-hidden /> Cambiar
          </Button>
        </div>
      </FormField>
    );
  }

  return (
    <FormField id={`${uid}-search`} label={label} error={error} hint="Escribe al menos 2 letras del nombre, apellido o apodo.">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${uid}-search`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          className="pl-8"
          placeholder="Buscar peleador"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-controls={`${uid}-results`}
        />
      </div>
      <div id={`${uid}-results`} role="status" aria-live="polite">
        {results === null ? null : results.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Ningún peleador coincide. Créalo antes en Peleadores.</p>
        ) : (
          <ul className="mt-1 flex flex-col border border-border">
            {results.map((fighter) => {
              const busy = busyIds.includes(fighter.id);
              return (
                <li key={fighter.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      onChange({ id: fighter.id, label: fighter.nickname ? `${fighter.name} «${fighter.nickname}»` : fighter.name });
                      setQuery("");
                    }}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Flag code={fighter.nationality} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium break-words">
                        {fighter.name}
                        {fighter.nickname ? <span className="font-normal text-muted-foreground"> «{fighter.nickname}»</span> : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {fighter.divisionName}
                        {fighter.status === "draft" ? " · Borrador" : ""}
                        {fighter.careerStatus === "active" ? "" : fighter.careerStatus === "retired" ? " · Retirado" : " · Inactivo"}
                        {busy ? " · Ya está en la cartelera" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FormField>
  );
}
