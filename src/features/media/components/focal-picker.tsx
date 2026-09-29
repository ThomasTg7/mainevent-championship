"use client";

import type { KeyboardEvent, MouseEvent } from "react";

const KEYBOARD_STEP = 0.05;

type Focal = { x: number; y: number };

type FocalPickerProps = {
  src: string;
  /** Proporción (ancho/alto) del recorte, para que la vista coincida con el resultado. */
  aspect: number;
  focal: Focal;
  filter: string;
  onChange: (focal: Focal) => void;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, Math.round(value * 1000) / 1000));

export function FocalPicker({ src, aspect, focal, filter, onChange }: FocalPickerProps) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    onChange({
      x: clampUnit((event.clientX - rect.left) / rect.width),
      y: clampUnit((event.clientY - rect.top) / rect.height),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Focal> = {
      ArrowLeft: { x: -KEYBOARD_STEP, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEYBOARD_STEP },
      ArrowDown: { x: 0, y: KEYBOARD_STEP },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ x: clampUnit(focal.x + move.x), y: clampUnit(focal.y + move.y) });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Toca o haz clic sobre lo más importante de la imagen (por ejemplo, el rostro). Ese punto se mantiene visible
        cuando la foto se recorta en otros tamaños. También puedes moverlo con las flechas del teclado.
      </p>
      <div
        data-testid="focal-picker"
        role="application"
        tabIndex={0}
        aria-label={`Punto de enfoque: ${Math.round(focal.x * 100)}% desde la izquierda, ${Math.round(focal.y * 100)}% desde arriba`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{ aspectRatio: aspect }}
        className="relative mx-auto max-h-[60vh] max-w-full cursor-crosshair touch-manipulation overflow-hidden border border-border bg-black outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob), no hay nada que optimizar */}
        <img src={src} alt="" draggable={false} style={{ filter }} className="pointer-events-none size-full object-contain" />
        <span
          aria-hidden
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
          className="pointer-events-none absolute size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/20 shadow-[0_0_0_2px_rgba(0,0,0,0.7)]"
        />
      </div>
    </div>
  );
}
