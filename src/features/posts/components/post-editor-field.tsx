"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FormField } from "@/components/admin/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostBody } from "@/domain/post-body";
import type { MediaDTO } from "@/features/media/dto";

// Tiptap solo se descarga en el formulario de noticias, y recién cuando se monta el editor.
const PostEditor = dynamic(() => import("../editor/post-editor").then((module) => module.PostEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full" />,
});

type PostEditorFieldProps = {
  initial: PostBody;
  media: Record<string, MediaDTO>;
  error?: string;
};

/** El cuerpo de la noticia: el editor y un campo oculto `body` con el JSON que se envía al guardar. */
export function PostEditorField({ initial, media, error }: PostEditorFieldProps) {
  const [body, setBody] = useState(initial);
  return (
    <FormField id="post-body" label="Texto de la noticia" error={error} hint="Usa la barra para títulos, formato, imágenes y publicaciones de redes. Pegar un link de YouTube, Instagram o TikTok en una línea vacía lo incrusta.">
      <input type="hidden" name="body" value={JSON.stringify(body)} />
      <PostEditor value={initial} onChange={setBody} media={media} invalid={Boolean(error)} />
    </FormField>
  );
}
