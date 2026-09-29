"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MEDIA_SPECS, type MediaKind } from "@/domain/media-specs";
import type { MediaEdit } from "../schema";
import type { EditingSession } from "./use-media-editing";

// react-easy-crop y el editor solo se descargan cuando alguien abre una imagen.
const ImageEditor = dynamic(() => import("./image-editor").then((module) => module.ImageEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

type EditorDialogProps = {
  kind: MediaKind;
  session: EditingSession | null;
  onSave: (edit: MediaEdit) => void;
  onCancel: () => void;
  onBackgroundRemoved: (cutout: Blob) => void;
};

export function EditorDialog({ kind, session, onSave, onCancel, onBackgroundRemoved }: EditorDialogProps) {
  return (
    <Dialog open={session !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-dvh w-full max-w-full overflow-y-auto rounded-none sm:max-h-[95dvh] sm:max-w-5xl sm:rounded-xl">
        <DialogTitle>{MEDIA_SPECS[kind].label}</DialogTitle>
        <DialogDescription>Recorta, ajusta y revisa cómo se verá antes de guardar.</DialogDescription>
        {session ? (
          <ImageEditor
            // Al cambiar de imagen (p. ej. tras quitar el fondo) se reinicia todo el editor.
            key={session.mediaId}
            kind={kind}
            src={session.src}
            natural={session.natural}
            initial={session.initial}
            onSave={onSave}
            onCancel={onCancel}
            onBackgroundRemoved={onBackgroundRemoved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
