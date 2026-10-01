"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { MediaImage } from "@/components/media/media-image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { MediaDTO } from "@/features/media/dto";

type PhotoGalleryProps = {
  media: MediaDTO[];
  /** Nombre de la galería para lectores de pantalla («Galería de Guerra Campal 5»). */
  title: string;
};

/** Miniaturas de una galería: al tocar una se abre grande, con flechas (también las del teclado) para recorrerlas. */
export function PhotoGallery({ media, title }: PhotoGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const current = openIndex === null ? null : (media[openIndex] ?? null);

  function step(delta: -1 | 1) {
    setOpenIndex((index) => (index === null ? null : (index + delta + media.length) % media.length));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {media.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Ver foto ${index + 1} de ${media.length}${item.alt ? `: ${item.alt}` : ""}`}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-surface outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            >
              <MediaImage media={item} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="size-full object-cover transition-transform duration-500 ease-gc motion-safe:group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent onKeyDown={handleKeyDown} className="max-h-[92dvh] w-[min(96vw,1200px)] max-w-none gap-3 border-border bg-black p-2 sm:max-w-none sm:p-3">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Foto {(openIndex ?? 0) + 1} de {media.length}. Usa las flechas izquierda y derecha para cambiar de foto.
          </DialogDescription>
          {current ? (
            <div className="relative flex items-center justify-center">
              <MediaImage media={current} sizes="96vw" className="max-h-[78dvh] w-auto max-w-full object-contain" />
              {media.length > 1 ? (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className="absolute left-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-yellow hover:text-black">
                    <ChevronLeft aria-hidden />
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Foto siguiente" className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-yellow hover:text-black">
                    <ChevronRight aria-hidden />
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          <p aria-hidden className="text-center font-cond text-sm font-semibold tracking-[.1em] text-muted-foreground">
            {(openIndex ?? 0) + 1} / {media.length}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
