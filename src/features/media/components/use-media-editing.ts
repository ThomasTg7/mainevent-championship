"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES, MEDIA_SPECS, type MediaKind } from "@/domain/media-specs";
import { getMediaEditAction, saveMediaEditAction } from "../actions";
import type { MediaDTO } from "../dto";
import type { MediaEdit } from "../schema";
import { DEFAULT_EDIT } from "../schema";
import { uploadOriginal } from "./upload-original";

export type EditingSession = {
  mediaId: string;
  src: string;
  natural: { w: number; h: number };
  initial?: MediaEdit;
};

type Phase = { name: "idle" } | { name: "uploading"; progress: number } | { name: "busy" };

const SVG_TYPE = "image/svg+xml";
/** Valida en el navegador para avisar al tiro; el servidor vuelve a validar todo. */
export function validateFile(kind: MediaKind, file: File): string | null {
  if (!MEDIA_SPECS[kind].accepts.includes(file.type)) return "Formato no permitido";
  if (file.size > MAX_UPLOAD_BYTES) return "El archivo supera 15 MB";
  return null;
}

/** Flujo completo de un campo de imagen: subir → editar → guardar, y reabrir para seguir editando. */
export function useMediaEditing(kind: MediaKind, onSaved: (media: MediaDTO) => void) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [session, setSession] = useState<EditingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, []);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const run = useCallback(async (task: () => Promise<void>) => {
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Ocurrió un error inesperado");
    } finally {
      setPhase({ name: "idle" });
    }
  }, []);

  const uploadAndOpen = useCallback(
    async (file: Blob & { name?: string; type: string }) => {
      setPhase({ name: "uploading", progress: 0 });
      const uploaded = await uploadOriginal(kind, file, (progress) => setPhase({ name: "uploading", progress }));

      if (file.type === SVG_TYPE) {
        // Un logo SVG no se recorta: se guarda tal cual (sanitizado en el servidor).
        setPhase({ name: "busy" });
        const saved = await saveMediaEditAction(uploaded.mediaId, DEFAULT_EDIT);
        if ("error" in saved) throw new Error(saved.error);
        onSaved(saved.data);
        return;
      }

      releaseObjectUrl();
      objectUrl.current = URL.createObjectURL(file);
      setSession({ mediaId: uploaded.mediaId, src: objectUrl.current, natural: { w: uploaded.width, h: uploaded.height } });
    },
    [kind, onSaved, releaseObjectUrl],
  );

  const pickFile = useCallback(
    (file: File) => {
      const problem = validateFile(kind, file);
      if (problem) return setError(problem);
      return run(() => uploadAndOpen(file));
    },
    [kind, run, uploadAndOpen],
  );

  const reopen = useCallback(
    (media: MediaDTO) =>
      run(async () => {
        setPhase({ name: "busy" });
        const edit = await getMediaEditAction(media.id);
        if ("error" in edit) throw new Error(edit.error);
        setSession({ mediaId: media.id, src: media.originalUrl, natural: { w: media.width, h: media.height }, initial: edit.data });
      }),
    [run],
  );

  const save = useCallback(
    (edit: MediaEdit) =>
      run(async () => {
        if (!session) return;
        setPhase({ name: "busy" });
        const saved = await saveMediaEditAction(session.mediaId, edit);
        if ("error" in saved) throw new Error(saved.error);
        onSaved(saved.data);
        releaseObjectUrl();
        setSession(null);
      }),
    [onSaved, releaseObjectUrl, run, session],
  );

  const replaceWithCutout = useCallback(
    (cutout: Blob) => run(() => uploadAndOpen(new File([cutout], "sin-fondo.png", { type: "image/png" }))),
    [run, uploadAndOpen],
  );

  const cancel = useCallback(() => {
    releaseObjectUrl();
    setSession(null);
  }, [releaseObjectUrl]);

  return { phase, session, error, pickFile, reopen, save, replaceWithCutout, cancel };
}
