"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from "lucide-react";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import type { MediaDTO } from "../dto";

type GalleryItemProps = {
  media: MediaDTO;
  position: number;
  total: number;
  disabled: boolean;
  onMove: (delta: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
};

export function GalleryItem({ media, position, total, disabled, onMove, onEdit, onRemove }: GalleryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: media.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 border border-border bg-card p-2 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="cursor-grab touch-none"
        aria-label={`Arrastrar foto ${position + 1} para reordenar`}
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden />
      </Button>
      <div className="size-16 shrink-0 overflow-hidden bg-muted sm:size-20">
        <MediaImage media={media} sizes="80px" className="size-full object-cover" />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm">Foto {position + 1}</span>
      <div className="flex flex-wrap justify-end gap-1">
        <Button type="button" variant="outline" size="icon" disabled={disabled || position === 0} aria-label={`Subir foto ${position + 1}`} onClick={() => onMove(-1)}>
          <ArrowUp aria-hidden />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={disabled || position === total - 1} aria-label={`Bajar foto ${position + 1}`} onClick={() => onMove(1)}>
          <ArrowDown aria-hidden />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={disabled} aria-label={`Editar foto ${position + 1}`} onClick={onEdit}>
          <Pencil aria-hidden />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={disabled} aria-label={`Quitar foto ${position + 1}`} onClick={onRemove}>
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
}
