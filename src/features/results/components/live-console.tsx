"use client";

import { ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/domain/bout-enums";
import { EVENT_STATUS_LABELS } from "@/domain/bout-enums";
import { startLiveEventAction, type RecordResultState } from "../actions";
import { BoutResultDialog } from "./bout-result-dialog";
import { LiveCurrentBout, type LiveBout } from "./live-current-bout";

type LiveConsoleProps = {
  eventId: string;
  eventName: string;
  eventStatus: EventStatus;
  /** Las peleas por pelear, en el orden de la noche (la primera es la de ahora). */
  pending: LiveBout[];
  /** Las ya peleadas, la más reciente primero. */
  finished: LiveBout[];
  cancelled: LiveBout[];
  techniques: { id: string; name: string }[];
  cardHref: string;
  publicHref: string;
};

/**
 * Noche de pelea: pantalla de celular para cargar resultados en vivo. Abrirla pone el evento «en vivo»; cada resultado
 * guardado se ve en el sitio en el siguiente refresco (≤ 30 s) y la consola pasa sola a la pelea siguiente.
 */
export function LiveConsole({ eventId, eventName, eventStatus, pending, finished, cancelled, techniques, cardHref, publicHref }: LiveConsoleProps) {
  // Ids guardados en esta sesión: se ocultan al instante, sin esperar a que el servidor devuelva la lista nueva.
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [correcting, setCorrecting] = useState<string | null>(null);
  // Abrir la pantalla pone el evento en vivo: se muestra ya así, sin esperar la respuesta del servidor.
  const status: EventStatus = eventStatus === "scheduled" ? "live" : eventStatus;

  useEffect(() => {
    if (eventStatus === "scheduled") void startLiveEventAction(eventId);
  }, [eventId, eventStatus]);

  const remaining = pending.filter((bout) => !saved.has(bout.id));
  const current = remaining[0];
  const totalCount = pending.length + finished.length;
  const allDone = remaining.length === 0;
  const correctingBout = [...finished, ...pending].find((bout) => bout.id === correcting) ?? null;

  function handleSaved(boutId: string, state: RecordResultState) {
    setSaved((previous) => new Set(previous).add(boutId));
    toast.success(state.success ?? "Resultado guardado");
    if (state.titleChange) toast.info("Cambio de título: el retador ganó el cinturón. Queda pendiente de confirmar en Rankings y títulos.");
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant={status === "live" ? "default" : "outline"}>{status === "live" ? "● EN VIVO" : EVENT_STATUS_LABELS[status]}</Badge>
        <span className="text-sm text-muted-foreground">{allDone ? "Todas las peleas tienen resultado" : `Pelea ${totalCount - remaining.length + 1} de ${totalCount}`}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={cardHref}>Cartelera</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={publicHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden /> Ver en el sitio
            </a>
          </Button>
        </div>
      </div>

      {current ? (
        <LiveCurrentBout key={current.id} bout={current} techniques={techniques} remaining={remaining.length} onSaved={handleSaved} />
      ) : (
        <div role="status" className="flex flex-col gap-1 border border-primary bg-card p-5">
          <p className="font-display text-2xl uppercase">{totalCount === 0 ? "No hay peleas en la cartelera" : "La noche terminó"}</p>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0 ? `Arma la cartelera de ${eventName} antes de abrir la noche de pelea.` : `${eventName} quedó finalizado. Puedes corregir cualquier resultado abajo.`}
          </p>
        </div>
      )}

      {finished.length + saved.size > 0 ? (
        <details className="border border-border" open={allDone}>
          <summary className="min-h-11 cursor-pointer px-3 py-3 font-semibold">Peleas terminadas ({finished.length})</summary>
          <ul className="flex flex-col divide-y divide-border">
            {finished.map((bout) => (
              <li key={bout.id} className="flex flex-wrap items-center gap-2 px-3 py-3">
                <span className="min-w-0 flex-1 basis-56 text-sm">{bout.resultLine}</span>
                <Button type="button" variant="outline" onClick={() => setCorrecting(bout.id)} aria-label={`Corregir el resultado de ${bout.red.lastName} vs ${bout.blue.lastName}`}>
                  <Pencil aria-hidden /> Corregir
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {cancelled.length > 0 ? (
        <p className="text-sm text-muted-foreground">Canceladas: {cancelled.map((bout) => `${bout.red.lastName} vs ${bout.blue.lastName}`).join(", ")}.</p>
      ) : null}

      <BoutResultDialog bout={correctingBout} techniques={techniques} onClose={() => setCorrecting(null)} />
    </div>
  );
}
