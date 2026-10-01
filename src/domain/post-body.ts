import { embedCanonicalUrl, EMBED_PROVIDERS, parseEmbedUrl } from "./embed";

// Cuerpo de una noticia: JSON de Tiptap restringido a los nodos que el sitio sabe mostrar (spec §4.8). Esta lista es
// la única fuente: el editor solo ofrece estos nodos, la action rechaza lo demás y el renderer ignora lo desconocido.

export type PostMark = { type: string; attrs?: Record<string, unknown> };
export type PostNode = { type: string; attrs?: Record<string, unknown>; content?: PostNode[]; text?: string; marks?: PostMark[] };
export type PostBody = { type: "doc"; content?: PostNode[] };

export const EMPTY_POST_BODY: PostBody = { type: "doc", content: [{ type: "paragraph" }] };

const MAX_DEPTH = 12;
const MAX_NODES = 5000;
const MAX_TEXT_LENGTH = 50_000;
const MAX_HREF_LENGTH = 2000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INLINE = new Set(["text", "hardBreak"]);
const LISTS = new Set(["bulletList", "orderedList"]);
const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "blockquote", "horizontalRule", "image", "embed"]);
const MARKS = new Set(["bold", "italic", "link"]);

/** Qué nodos pueden ir dentro de cada nodo; los que no figuran no llevan contenido. */
const CHILDREN: Record<string, ReadonlySet<string>> = {
  doc: BLOCKS,
  paragraph: INLINE,
  heading: INLINE,
  bulletList: new Set(["listItem"]),
  orderedList: new Set(["listItem"]),
  listItem: new Set(["paragraph", ...LISTS]),
  blockquote: BLOCKS,
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Enlaces permitidos: http(s), correo o una ruta del propio sitio. Nunca `javascript:` ni `data:`. */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== "string" || href.length === 0 || href.length > MAX_HREF_LENGTH) return false;
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("\\");
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(href).protocol);
  } catch {
    return false;
  }
}

function isValidEmbed(attrs: unknown): boolean {
  if (!isRecord(attrs)) return false;
  const { provider, id } = attrs;
  if (typeof provider !== "string" || typeof id !== "string" || !(EMBED_PROVIDERS as readonly string[]).includes(provider)) return false;
  // El id debe sobrevivir al ida y vuelta por el enlace público: así no puede traer nada más que el id.
  const parsed = parseEmbedUrl(embedCanonicalUrl({ provider: provider as (typeof EMBED_PROVIDERS)[number], id }));
  return parsed !== null && parsed.provider === provider && parsed.id === id;
}

function isValidMarks(marks: unknown): boolean {
  if (marks === undefined) return true;
  if (!Array.isArray(marks)) return false;
  return marks.every((mark) => isRecord(mark) && typeof mark.type === "string" && MARKS.has(mark.type) && (mark.type !== "link" || (isRecord(mark.attrs) && isSafeHref(mark.attrs.href))));
}

function isValidAttrs(node: Record<string, unknown>): boolean {
  switch (node.type) {
    case "heading":
      return isRecord(node.attrs) && (node.attrs.level === 2 || node.attrs.level === 3);
    case "image":
      return isRecord(node.attrs) && typeof node.attrs.mediaId === "string" && UUID.test(node.attrs.mediaId);
    case "embed":
      return isValidEmbed(node.attrs);
    default:
      return true;
  }
}

function isValidNode(node: unknown, allowed: ReadonlySet<string>, depth: number, counter: { nodes: number }): boolean {
  if (depth > MAX_DEPTH || !isRecord(node) || typeof node.type !== "string" || !allowed.has(node.type)) return false;
  counter.nodes += 1;
  if (counter.nodes > MAX_NODES) return false;

  if (node.type === "text") {
    return typeof node.text === "string" && node.text.length > 0 && node.text.length <= MAX_TEXT_LENGTH && isValidMarks(node.marks);
  }
  if (!isValidAttrs(node)) return false;

  const childTypes = CHILDREN[node.type];
  if (node.content === undefined) return true;
  if (!childTypes || !Array.isArray(node.content)) return false;
  return node.content.every((child) => isValidNode(child, childTypes, depth + 1, counter));
}

/** `true` solo si el JSON es un documento hecho únicamente de los nodos, marcas y atributos permitidos. */
export function validatePostBody(body: unknown): body is PostBody {
  if (!isRecord(body) || body.type !== "doc") return false;
  if (body.content === undefined) return true;
  if (!Array.isArray(body.content)) return false;
  const counter = { nodes: 0 };
  return body.content.every((child) => isValidNode(child, BLOCKS, 1, counter));
}

/** Ids de las imágenes que aparecen dentro del cuerpo, sin repetir y en el orden en que salen. */
export function collectBodyMediaIds(body: unknown): string[] {
  const ids = new Set<string>();
  const visit = (node: unknown, depth: number) => {
    if (depth > MAX_DEPTH + 1 || !isRecord(node)) return;
    if (node.type === "image" && isRecord(node.attrs) && typeof node.attrs.mediaId === "string") ids.add(node.attrs.mediaId);
    if (Array.isArray(node.content)) for (const child of node.content) visit(child, depth + 1);
  };
  visit(body, 0);
  return [...ids];
}
