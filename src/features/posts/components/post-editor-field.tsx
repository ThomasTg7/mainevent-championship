"use client";

import { PenLine, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostBody } from "@/domain/post-body";
import type { MediaDTO } from "@/features/media/dto";
import { AiHelpDialog } from "./ai-writer/ai-help-dialog";

// Tiptap solo se descarga en el formulario de noticias, y recién cuando se monta el editor.
const PostEditor = dynamic(() => import("../editor/post-editor").then((module) => module.PostEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

// El publicador «Con IA» se descarga la primera vez que se elige.
const AiWriterPanel = dynamic(() => import("./ai-writer/ai-writer-panel").then((module) => module.AiWriterPanel), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

type Mode = "write" | "ai";

type PostEditorFieldProps = {
  initial: PostBody;
  media: Record<string, MediaDTO>;
  error?: string;
};

/**
 * El cuerpo de la noticia con dos publicadores: «Escribir» (el editor) y «Con IA» (pegar la respuesta de una IA). Los dos
 * escriben el mismo cuerpo, que viaja en el campo oculto `body` al guardar.
 */
export function PostEditorField({ initial, media: initialMedia, error }: PostEditorFieldProps) {
  const [body, setBody] = useState(initial);
  const [media, setMedia] = useState(initialMedia);
  // Cargar un texto desde la IA vuelve a montar el editor con ese contenido (`version`).
  const [editorContent, setEditorContent] = useState({ doc: initial, version: 0 });
  const [mode, setMode] = useState<Mode>("write");
  const [aiOpened, setAiOpened] = useState(false);

  function addMedia(items: MediaDTO[]) {
    setMedia((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.id, item])) }));
  }

  function loadFromAi(doc: PostBody, photos: MediaDTO[]) {
    addMedia(photos);
    setEditorContent((current) => ({ doc, version: current.version + 1 }));
    setBody(doc);
    setMode("write");
  }

  function chooseMode(next: Mode) {
    setMode(next);
    if (next === "ai") setAiOpened(true);
  }

  return (
    <FormField id="post-body" label="Texto de la noticia" error={error} hint="Escribe en el editor o usa «Con IA». Pegar un link de YouTube, Instagram o TikTok en una línea vacía lo incrusta.">
      <input type="hidden" name="body" value={JSON.stringify(body)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Cómo escribir la noticia" className="flex gap-1">
          <Button type="button" variant={mode === "write" ? "default" : "outline"} aria-pressed={mode === "write"} onClick={() => chooseMode("write")}>
            <PenLine aria-hidden /> Escribir
          </Button>
          <Button type="button" variant={mode === "ai" ? "default" : "outline"} aria-pressed={mode === "ai"} onClick={() => chooseMode("ai")}>
            <Sparkles aria-hidden /> Con IA
          </Button>
        </div>
        <AiHelpDialog />
      </div>
      <div hidden={mode !== "write"}>
        <PostEditor
          key={editorContent.version}
          value={editorContent.doc}
          onChange={setBody}
          onMediaAdded={(item) => addMedia([item])}
          media={media}
          invalid={Boolean(error)}
        />
      </div>
      {aiOpened ? (
        <div hidden={mode !== "ai"}>
          <AiWriterPanel body={body} media={media} onLoad={loadFromAi} />
        </div>
      ) : null}
    </FormField>
  );
}
