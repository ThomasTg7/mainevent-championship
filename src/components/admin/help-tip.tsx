"use client";

import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type HelpTipProps = {
  /** De qué trata la ayuda: el lector de pantalla anuncia «Ayuda: <topic>». */
  topic: string;
  children: ReactNode;
};

/**
 * Un «?» junto a una etiqueta o un paso que explica qué hacer, con un ejemplo si hace falta. Se abre al tocar (en celular
 * no existe «pasar el mouse») y el área táctil mide 44 px aunque el ícono sea chico.
 */
export function HelpTip({ topic, children }: HelpTipProps) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`Ayuda: ${topic}`}
        className="-my-3 inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary data-[state=open]:text-primary"
      >
        <CircleHelp aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] gap-2 text-sm leading-relaxed">
        {children}
      </PopoverContent>
    </Popover>
  );
}
