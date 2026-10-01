import Link from "@tiptap/extension-link";
import { Extension, mergeAttributes, Node, type AnyExtension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { embedCanonicalUrl, embedFromAttrs, parseEmbedUrl } from "@/domain/embed";
import { isSafeHref } from "@/domain/post-body";
import type { MediaDTO } from "@/features/media/dto";

// Los únicos nodos y marcas del editor son los de `domain/post-body.ts`. Lo que se pega (Word, Google Docs, una web) se
// lee con estas mismas reglas: lo que no está aquí (estilos, tablas, subrayado, código, imágenes de otro sitio) se pierde.

const PROVIDER_NAME = { instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok" } as const;

/** Publicación de Instagram, YouTube o TikTok: guarda solo `{ provider, id }`. En el editor se ve como una tarjeta. */
export const EmbedNode = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { provider: { default: null }, id: { default: null } };
  },

  // Solo el HTML que genera este mismo editor (copiar y pegar dentro de él); un pegado externo no trae estos atributos.
  parseHTML() {
    return [
      {
        tag: "div[data-embed-provider][data-embed-id]",
        getAttrs: (element) => {
          const embed = embedFromAttrs({ provider: element.getAttribute("data-embed-provider"), id: element.getAttribute("data-embed-id") });
          return embed ? { provider: embed.provider, id: embed.id } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-embed-provider": HTMLAttributes.provider, "data-embed-id": HTMLAttributes.id })];
  },

  addNodeView() {
    return ({ node }) => {
      const embed = embedFromAttrs(node.attrs);
      const dom = document.createElement("div");
      dom.className = "my-4 flex flex-col gap-1 border border-dashed border-border bg-card px-4 py-3 text-sm";
      dom.contentEditable = "false";
      const title = document.createElement("strong");
      title.textContent = embed ? `Publicación de ${PROVIDER_NAME[embed.provider]}` : "Publicación no válida";
      const detail = document.createElement("span");
      detail.className = "break-all text-muted-foreground";
      detail.textContent = embed ? embedCanonicalUrl(embed) : "";
      dom.append(title, detail);
      return { dom };
    };
  },
});

export type MediaLookup = (mediaId: string) => MediaDTO | undefined;

/** Imagen del cuerpo: guarda solo `{ mediaId }` (el texto alternativo vive en la imagen, no en el nodo). */
export function createImageNode(getMedia: MediaLookup) {
  return Node.create({
    name: "image",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return { mediaId: { default: null } };
    },

    parseHTML() {
      return [{ tag: "figure[data-media-id]", getAttrs: (element) => ({ mediaId: element.getAttribute("data-media-id") }) }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["figure", mergeAttributes({ "data-media-id": HTMLAttributes.mediaId })];
    },

    addNodeView() {
      return ({ node }) => {
        const dom = document.createElement("figure");
        dom.className = "my-4";
        dom.contentEditable = "false";
        const media = getMedia(String(node.attrs.mediaId));
        if (media) {
          const image = document.createElement("img");
          const variant = media.variants.find((item) => item.width >= 800) ?? media.variants.at(-1);
          image.src = variant?.url ?? media.originalUrl;
          image.alt = media.alt;
          image.className = "h-auto max-h-96 w-auto max-w-full";
          dom.append(image);
        } else {
          dom.className += " border border-dashed border-border p-4 text-sm text-muted-foreground";
          dom.textContent = "Imagen no disponible";
        }
        return { dom };
      };
    },
  });
}

/** Pegar un enlace de una red sola, en un párrafo vacío, lo convierte en una publicación incrustada. */
export const PasteEmbed = Extension.create({
  name: "pasteEmbed",

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("pasteEmbed"),
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain")?.trim() ?? "";
            if (!text || /\s/.test(text)) return false;
            const embed = parseEmbedUrl(text);
            const { selection } = view.state;
            if (!embed || !selection.empty || selection.$from.parent.type.name !== "paragraph" || selection.$from.parent.content.size !== 0) return false;
            const { $from } = selection;
            return editor.chain().focus().insertContentAt({ from: $from.before(), to: $from.after() }, { type: "embed", attrs: embed }).run();
          },
        },
      }),
    ];
  },
});

/** El enlace guarda solo `href`: al pegar se pierden `class`, `title` y el resto de atributos de la página de origen. */
const SafeLink = Link.extend({
  addAttributes() {
    return { href: { default: null } };
  },
});

export function createPostExtensions(getMedia: MediaLookup): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      // Fuera de lo permitido: subrayado, tachado, código y bloques de código.
      underline: false,
      strike: false,
      code: false,
      codeBlock: false,
      // El enlace se configura aparte (mismas reglas que el servidor).
      link: false,
    }),
    SafeLink.configure({
      openOnClick: false,
      autolink: false,
      linkOnPaste: true,
      defaultProtocol: "https",
      isAllowedUri: (url) => isSafeHref(url),
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    EmbedNode,
    createImageNode(getMedia),
    PasteEmbed,
  ];
}
