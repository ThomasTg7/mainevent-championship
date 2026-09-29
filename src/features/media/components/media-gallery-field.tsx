"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { MEDIA_SPECS } from "@/domain/media-specs";
import type { MediaDTO } from "../dto";
import { EditorDialog } from "./editor-dialog";
import { GalleryItem } from "./gallery-item";
import { MediaDropzone } from "./media-dropzone";
import { uploadAndSave } from "./upload-original";
import { useMediaEditing, validateFile } from "./use-media-editing";

type MediaGalleryFieldProps = {
  /** Nombre del campo: se envía un valor por foto, en el orden mostrado. */
  name: string;
  /** Fotos ya guardadas, en orden (las carga el servidor con `getMediaByIds`). */
  media?: MediaDTO[];
  onChange?: (mediaIds: string[]) => void;
};

const SPEC = MEDIA_SPECS.gallery;

export function MediaGalleryField({ name, media: initialMedia = [], onChange }: MediaGalleryFieldProps) {
  const [items, setItems] = useState<MediaDTO[]>(initialMedia);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const commit = useCallback(
    (next: MediaDTO[]) => {
      setItems(next);
      onChange?.(next.map((item) => item.id));
    },
    [onChange],
  );

  const handleEdited = useCallback(
    (saved: MediaDTO) => commit(items.map((item) => (item.id === saved.id ? saved : item))),
    [commit, items],
  );
  const editing = useMediaEditing("gallery", handleEdited);
  const busy = progress !== null || editing.phase.name !== "idle";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function addFiles(files: File[]) {
    const added: MediaDTO[] = [];
    const failures: string[] = [];
    setProgress({ done: 0, total: files.length });

    for (const [index, file] of files.entries()) {
      const problem = validateFile("gallery", file);
      try {
        if (problem) throw new Error(problem);
        added.push(await uploadAndSave("gallery", file));
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : "no se pudo subir"}`);
      }
      setProgress({ done: index + 1, total: files.length });
    }

    setErrors(failures);
    setProgress(null);
    if (added.length > 0) commit([...items, ...added]);
  }

  function move(from: number, to: number) {
    commit(arrayMove(items, from, to));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    move(items.findIndex((item) => item.id === active.id), items.findIndex((item) => item.id === over.id));
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <input key={item.id} type="hidden" name={name} value={item.id} />
      ))}

      {items.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => (
                <GalleryItem
                  key={item.id}
                  media={item}
                  position={index}
                  total={items.length}
                  disabled={busy}
                  onMove={(delta) => move(index, index + delta)}
                  onEdit={() => editing.reopen(item)}
                  onRemove={() => commit(items.filter((other) => other.id !== item.id))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      <MediaDropzone
        multiple
        accept={SPEC.accepts}
        disabled={busy}
        label={items.length > 0 ? "Agregar más fotos" : "Subir fotos de la galería"}
        hint="Arrastra las fotos aquí o toca para elegirlas · JPG, PNG o WebP · máx. 15 MB cada una"
        onFiles={addFiles}
      />

      <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
        {progress ? (
          <>
            <Loader2 aria-hidden className="size-4 animate-spin" /> Subiendo foto {Math.min(progress.done + 1, progress.total)} de {progress.total}…
          </>
        ) : null}
      </p>
      {[...errors, ...(editing.error ? [editing.error] : [])].map((message) => (
        <p key={message} role="alert" className="text-sm text-destructive">
          {message}
        </p>
      ))}

      <EditorDialog
        kind="gallery"
        session={editing.session}
        onSave={editing.save}
        onCancel={editing.cancel}
        onBackgroundRemoved={editing.replaceWithCutout}
      />
    </div>
  );
}
