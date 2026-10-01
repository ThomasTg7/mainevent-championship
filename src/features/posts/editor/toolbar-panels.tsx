"use client";

import type { Editor } from "@tiptap/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseEmbedUrl } from "@/domain/embed";
import { isSafeHref } from "@/domain/post-body";

/** «example.com» se completa con https://; las rutas del sitio (`/eventos`) se dejan como están. */
function withProtocol(text: string): string {
  return /^([a-z][a-z0-9+.-]*:|\/)/i.test(text) ? text : `https://${text}`;
}

type PanelProps = { editor: Editor; onClose: () => void };

/** Poner o quitar el enlace del texto seleccionado. */
export function LinkPanel({ editor, onClose }: PanelProps) {
  const [url, setUrl] = useState(() => (editor.getAttributes("link").href as string | undefined) ?? "");
  const [error, setError] = useState<string | null>(null);
  const hasLink = editor.isActive("link");

  function apply(event: FormEvent) {
    event.preventDefault();
    const href = withProtocol(url.trim());
    if (!url.trim() || !isSafeHref(href)) {
      setError("Escribe un enlace válido (https://…).");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-2 border-b border-border bg-card p-3" aria-label="Enlace">
      <label htmlFor="post-link-url" className="text-sm font-medium">
        Enlace del texto seleccionado
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="post-link-url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          type="url"
          inputMode="url"
          placeholder="https://…"
          autoComplete="off"
          autoCapitalize="none"
          aria-invalid={error ? true : undefined}
          className="sm:flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit">Aplicar</Button>
          {hasLink ? (
            <Button type="button" variant="outline" onClick={remove}>
              Quitar enlace
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Selecciona primero el texto que será el enlace.</p>
      )}
    </form>
  );
}

/** Pegar el link de una publicación de Instagram, YouTube o TikTok. */
export function EmbedPanel({ editor, onClose }: PanelProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function insert(event: FormEvent) {
    event.preventDefault();
    const embed = parseEmbedUrl(url);
    if (!embed) {
      setError("Link no reconocido. Pega el link de una publicación de Instagram, YouTube o TikTok.");
      return;
    }
    editor.chain().focus().insertContent({ type: "embed", attrs: embed }).run();
    onClose();
  }

  return (
    <form onSubmit={insert} className="flex flex-col gap-2 border-b border-border bg-card p-3" aria-label="Publicación de una red social">
      <label htmlFor="post-embed-url" className="text-sm font-medium">
        Link de Instagram, YouTube o TikTok
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="post-embed-url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setError(null);
          }}
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=…"
          autoComplete="off"
          autoCapitalize="none"
          aria-invalid={error ? true : undefined}
          className="sm:flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit">Insertar</Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">También puedes pegar el link solo en una línea vacía del texto.</p>
      )}
    </form>
  );
}
