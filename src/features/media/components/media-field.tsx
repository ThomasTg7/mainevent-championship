"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { MEDIA_SPECS, type MediaKind } from "@/domain/media-specs";
import type { MediaDTO } from "../dto";
import { EditorDialog, mediaTriggerAttribute } from "./editor-dialog";
import { MediaDropzone } from "./media-dropzone";
import { useMediaEditing } from "./use-media-editing";

type MediaFieldProps = {
  kind: MediaKind;
  /** Nombre del campo del formulario: se envía el id de la imagen (o vacío). */
  name: string;
  /** Imagen ya guardada (la carga el servidor con `getMedia`). */
  media?: MediaDTO | null;
  onChange?: (mediaId: string | null) => void;
};

export function MediaField({ kind, name, media: initialMedia = null, onChange }: MediaFieldProps) {
  const spec = MEDIA_SPECS[kind];
  const [media, setMedia] = useState<MediaDTO | null>(initialMedia);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSaved = useCallback(
    (saved: MediaDTO) => {
      setMedia(saved);
      onChange?.(saved.id);
    },
    [onChange],
  );
  const editing = useMediaEditing(kind, handleSaved);
  const busy = editing.phase.name !== "idle";

  function remove() {
    setMedia(null);
    onChange?.(null);
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <input type="hidden" name={name} value={media?.id ?? ""} />

      {media ? (
        <div className="flex items-center gap-3 border border-border p-3">
          <div className="size-24 shrink-0 overflow-hidden bg-muted">
            {/* Un logo se ve entero; una foto llena el cuadro. */}
            <MediaImage media={media} sizes="96px" className={`size-full ${kind === "sponsor_logo" ? "object-contain" : "object-cover"}`} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            {media.variants.length > 0 ? (
              <Button type="button" variant="outline" disabled={busy} onClick={() => editing.reopen(media)} {...mediaTriggerAttribute(media.id)}>
                <Pencil aria-hidden /> Editar
              </Button>
            ) : null}
            <Button type="button" variant="outline" disabled={busy} onClick={remove}>
              <Trash2 aria-hidden /> Quitar
            </Button>
          </div>
        </div>
      ) : (
        <MediaDropzone
          accept={spec.accepts}
          disabled={busy}
          label={`Subir ${spec.label.toLowerCase()}`}
          hint={`Arrastra la imagen aquí o toca para elegirla · JPG, PNG o WebP${spec.accepts.includes("image/svg+xml") ? " o SVG" : ""} · máx. 15 MB`}
          onFiles={([file]) => editing.pickFile(file)}
        />
      )}

      <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
        {editing.phase.name === "uploading" ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Subiendo… {Math.round(editing.phase.progress * 100)}%
          </>
        ) : null}
        {editing.phase.name === "busy" ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> Procesando imagen…
          </>
        ) : null}
      </p>
      {editing.error ? (
        <p role="alert" className="text-sm text-destructive">
          {editing.error}
        </p>
      ) : null}

      <EditorDialog
        kind={kind}
        session={editing.session}
        onSave={editing.save}
        onCancel={editing.cancel}
        onBackgroundRemoved={editing.replaceWithCutout}
        returnFocusTo={containerRef}
      />
    </div>
  );
}
