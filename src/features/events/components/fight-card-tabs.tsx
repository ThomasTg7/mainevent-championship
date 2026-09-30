"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FightCardTabsProps = {
  /** Un bloque por pestaña; su lista de peleas ya viene armada por el servidor. */
  segments: { id: string; name: string; content: ReactNode }[];
};

/**
 * Pestañas por bloque de la cartelera («Cartelera estelar», «Preliminares»…) sobre fondo blanco. Solo las pestañas son
 * interactivas; el contenido lo arma el servidor. La barra amarilla de la pestaña activa y la entrada del panel usan
 * solo `transform` y `opacity`, y se quedan quietas si la persona pidió menos movimiento. Con un solo bloque no hay pestañas.
 */
export function FightCardTabs({ segments }: FightCardTabsProps) {
  const [active, setActive] = useState(segments[0]?.id ?? "");
  if (segments.length === 1) {
    const [only] = segments;
    return (
      <div>
        <h3 className="border-b-2 border-neutral-200 py-3.5 font-cond text-[15px] font-extrabold uppercase tracking-[.1em] text-black">{only!.name}</h3>
        <ul>{only!.content}</ul>
      </div>
    );
  }

  return (
    <Tabs value={active} onValueChange={setActive} className="gap-0">
      <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-0 border-b-2 border-neutral-200 p-0 group-data-horizontal/tabs:h-auto">
        {segments.map((segment) => (
          <TabsTrigger
            key={segment.id}
            value={segment.id}
            className="relative h-auto flex-none rounded-none px-4 py-3.5 font-cond text-[15px] font-extrabold uppercase tracking-[.1em] text-neutral-500 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-1 after:origin-left after:scale-x-0 after:bg-yellow after:opacity-100 after:transition-transform after:duration-300 hover:text-neutral-800 data-active:text-black data-active:after:scale-x-100 motion-reduce:after:transition-none sm:px-[22px]"
          >
            {segment.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {segments.map((segment) => (
        // Todos los bloques quedan en el HTML (ocultos los que no se ven): buscadores y lectores los encuentran sin JavaScript.
        <TabsContent
          key={segment.id}
          value={segment.id}
          forceMount
          hidden={active !== segment.id}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
        >
          <ul>{segment.content}</ul>
        </TabsContent>
      ))}
    </Tabs>
  );
}
