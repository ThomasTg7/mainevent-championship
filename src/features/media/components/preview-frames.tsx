import { MEDIA_SPECS, type MediaKind } from "@/domain/media-specs";
import { CHECKERBOARD } from "./checkerboard";

type Frame = { name: string; ratio: string; aspect: number };

/** Contextos reales donde se verá cada tipo de imagen. */
function framesFor(kind: MediaKind): Frame[] {
  switch (kind) {
    case "fighter_body":
      return [
        { name: "Tarjeta", ratio: "4:5", aspect: 4 / 5 },
        { name: "Ficha", ratio: "3:4", aspect: 3 / 4 },
        { name: "Móvil", ratio: "9:16", aspect: 9 / 16 },
      ];
    case "event_hero":
      return [{ name: "Portada (escritorio)", ratio: "16:9", aspect: 16 / 9 }];
    case "news_cover":
      return [
        { name: "Tarjeta", ratio: "4:3", aspect: 4 / 3 },
        { name: "Cabecera", ratio: "21:9", aspect: 21 / 9 },
      ];
    default:
      return [{ name: "Así se verá", ratio: MEDIA_SPECS[kind].aspectLabel, aspect: MEDIA_SPECS[kind].aspect ?? 1 }];
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Así se verá en el sitio</h3>
      <div className="flex items-end gap-3 overflow-x-auto pb-1">
        {framesFor(kind).map((frame) => (
          <figure key={frame.name} className="flex shrink-0 flex-col gap-1">
            <div
              style={{ ...CHECKERBOARD, aspectRatio: frame.aspect }}
              className="h-28 overflow-hidden border border-border sm:h-32"
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
            <figcaption className="text-xs leading-tight">
              {frame.name} <span className="text-muted-foreground">· {frame.ratio}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
