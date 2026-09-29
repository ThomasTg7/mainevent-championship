import { MEDIA_SPECS, type MediaKind } from "@/domain/media-specs";

type Frame = { label: string; aspect: number; className: string };

/** Contextos reales donde se verá cada tipo de imagen. */
function framesFor(kind: MediaKind): Frame[] {
  switch (kind) {
    case "fighter_body":
      return [
        { label: "Tarjeta de listado · 4:5", aspect: 4 / 5, className: "w-28" },
        { label: "Ficha (escritorio) · 3:4", aspect: 3 / 4, className: "w-40" },
        { label: "Móvil · 9:16", aspect: 9 / 16, className: "w-24" },
      ];
    case "event_hero":
      return [{ label: "Portada (escritorio) · 16:9", aspect: 16 / 9, className: "w-full max-w-sm" }];
    case "news_cover":
      return [
        { label: "Tarjeta de noticia · 4:3", aspect: 4 / 3, className: "w-40" },
        { label: "Cabecera de la noticia · 21:9", aspect: 21 / 9, className: "w-full max-w-sm" },
      ];
    default:
      return [{ label: `Así se verá · ${MEDIA_SPECS[kind].aspectLabel}`, aspect: MEDIA_SPECS[kind].aspect ?? 1, className: "w-40" }];
  }
}

type PreviewFramesProps = {
  kind: MediaKind;
  /** Miniatura con el recorte ya aplicado. */
  src: string;
  focal: { x: number; y: number };
  filter: string;
};

export function PreviewFrames({ kind, src, focal, filter }: PreviewFramesProps) {
  return (
    <section aria-label="Vista previa" className="flex flex-col gap-2">
      <h3 className="font-semibold">Vista previa</h3>
      <div className="flex flex-wrap items-end gap-4">
        {framesFor(kind).map((frame) => (
          <figure key={frame.label} className="flex flex-col gap-1">
            <div
              style={{ aspectRatio: frame.aspect }}
              className={`${frame.className} overflow-hidden border border-border bg-muted`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob), no hay nada que optimizar */}
              <img
                src={src}
                alt=""
                draggable={false}
                style={{ objectPosition: `${focal.x * 100}% ${focal.y * 100}%`, filter }}
                className="size-full object-cover"
              />
            </div>
            <figcaption className="text-xs text-muted-foreground">{frame.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
