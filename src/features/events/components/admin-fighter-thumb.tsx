import { MediaImage } from "@/components/media/media-image";
import { FighterSilhouette } from "@/features/fighters/components/fighter-silhouette";
import { cn } from "@/lib/cn";
import type { AdminBoutFighter } from "../admin-card-queries";

/**
 * Miniatura del peleador en el panel (cartelera y resultados en vivo): la foto de rostro; si no hay, la de cuerpo
 * recortada desde arriba (se ve la cara); y si no hay ninguna, la silueta. `className` da el tamaño.
 */
export function AdminFighterThumb({ fighter, className }: { fighter: Pick<AdminBoutFighter, "headshotMedia" | "bodyMedia">; className?: string }) {
  const photo = fighter.headshotMedia ? "headshot" : fighter.bodyMedia ? "body" : "silhouette";
  const media = fighter.headshotMedia ?? fighter.bodyMedia;
  return (
    <div data-photo={photo} className={cn("shrink-0 overflow-hidden bg-muted", className)}>
      {media ? (
        <MediaImage media={media} sizes="64px" anchorTop={photo === "body"} className="size-full object-cover" />
      ) : (
        <FighterSilhouette className="size-full text-black drop-shadow-[0_0_1px_rgba(255,180,0,.6)]" />
      )}
    </div>
  );
}
