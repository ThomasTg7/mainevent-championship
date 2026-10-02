"use client";

import { ClipboardCopy, FileInput } from "lucide-react";
import dynamic from "next/dynamic";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { collectBodyMediaIds, type PostBody } from "@/domain/post-body";
import { parsePostMarkdown, postToMarkdown } from "@/domain/post-markdown";
import type { MediaDTO } from "@/features/media/dto";
import { readFormText, writeFormText } from "@/lib/form-dom";

// dnd-kit (orden de las fotos) solo se descarga al abrir «Con IA».
const GalleryEditor = dynamic(() => import("@/features/media/components/gallery-editor").then((module) => module.GalleryEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-32 w-full" />,
});

const UPLOAD_LABELS = { empty: "Subir fotos para la noticia", more: "Agregar más fotos" };

type AiWriterPanelProps = {
  /** Cuerpo actual (lo que hay en el editor). */
  body: PostBody;
  /** Imágenes conocidas por id: las del cuerpo guardado y las subidas después. */
  media: Record<string, MediaDTO>;
  /** Reemplaza el cuerpo del editor; `photos` son las imágenes que puede traer. */
  onLoad: (body: PostBody, photos: MediaDTO[]) => void;
};

/**
 * Publicador «Con IA»: fotos numeradas, la respuesta de la IA para pegar y «Copiar noticia para la IA» para pedir
 * cambios sobre la versión actual. Lo pegado se convierte con `parsePostMarkdown` (y pasa la misma validación del
 * servidor); título y bajada van a la pestaña Datos.
 */
export function AiWriterPanel({ body, media, onLoad }: AiWriterPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const answerId = useId();
  const [photos, setPhotos] = useState<MediaDTO[]>([]);
  const [answer, setAnswer] = useState("");
  const [notices, setNotices] = useState<{ error?: string; warnings: string[] }>({ warnings: [] });

  // Las imágenes que ya están en el texto también tienen número: si no, «Copiar noticia para la IA» las perdería.
  const missing = collectBodyMediaIds(body).filter((id) => media[id] && !photos.some((photo) => photo.id === id));
  const allPhotos = missing.length > 0 ? [...photos, ...missing.map((id) => media[id]!)] : photos;
  const photoIds = allPhotos.map((photo) => photo.id);
  const form = () => rootRef.current?.closest("form");

  function load() {
    if (!answer.trim()) {
      setNotices({ error: "Pega primero la respuesta de la IA.", warnings: [] });
      return;
    }
    const draft = parsePostMarkdown(answer, photoIds);
    setNotices({ error: draft.error, warnings: draft.warnings });
    if (!draft.body) return;

    const previous = { body, title: readFormText(form(), "title"), excerpt: readFormText(form(), "excerpt") };
    if (draft.title !== null) writeFormText(form(), "title", draft.title);
    if (draft.excerpt !== null) writeFormText(form(), "excerpt", draft.excerpt);
    onLoad(draft.body, allPhotos);
    toast.success("Texto cargado en la noticia. Revísalo antes de guardar.", {
      description: draft.warnings.join(" ") || undefined,
      // Tiempo para revisar el resultado y decidir si deshacer.
      duration: 15_000,
      action: {
        label: "Deshacer",
        onClick: () => {
          writeFormText(form(), "title", previous.title);
          writeFormText(form(), "excerpt", previous.excerpt);
          onLoad(previous.body, []);
        },
      },
    });
  }

  async function copyCurrent() {
    const markdown = postToMarkdown({ title: readFormText(form(), "title"), excerpt: readFormText(form(), "excerpt"), body }, photoIds);
    try {
      await navigator.clipboard.writeText(markdown || "(la noticia todavía está vacía)");
      toast.success("Noticia copiada. Pégasela a la IA junto con lo que quieres cambiar.");
    } catch {
      toast.error("No se pudo copiar. Revisa los permisos del navegador.");
    }
  }

  return (
    <div ref={rootRef} data-slot="ai-writer" className="flex flex-col gap-6 border border-border bg-card p-4">
      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">1. Fotos (opcional)</h3>
        <p className="text-sm text-muted-foreground">Súbelas en el orden que quieras. La IA las ubica con [FOTO 1], [FOTO 2]… y se insertan al cargar el texto.</p>
        <GalleryEditor key={missing.join(",")} media={allPhotos} onMediaChange={setPhotos} uploadLabels={UPLOAD_LABELS} numbered />
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor={answerId} className="font-semibold">
          2. Respuesta de la IA
        </label>
        <Textarea
          id={answerId}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={12}
          placeholder={"TÍTULO: …\nBAJADA: …\n\nPrimer párrafo de la noticia…"}
          aria-invalid={notices.error ? true : undefined}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">Pega la respuesta completa. Reemplaza el texto actual de la noticia (puedes deshacerlo).</p>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={load}>
          <FileInput aria-hidden /> Cargar en la noticia
        </Button>
        <Button type="button" variant="outline" onClick={copyCurrent}>
          <ClipboardCopy aria-hidden /> Copiar noticia para la IA
        </Button>
      </div>

      {notices.error ? <p role="alert" className="text-sm text-destructive">{notices.error}</p> : null}
      {notices.warnings.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm text-amber-300">
          {notices.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
