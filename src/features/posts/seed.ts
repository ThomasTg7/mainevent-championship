import { inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { events } from "@/db/schema/events";
import { fighters } from "@/db/schema/fighters";
import { postCategories, postEvents, postFighters, posts } from "@/db/schema/posts";
import { bodyHasEmbed, type PostBody, type PostNode } from "@/domain/post-body";
import { slugify } from "@/domain/slug";

/** Categorías iniciales (spec §4.8); la promotora las edita desde el panel. */
export const POST_CATEGORIES = ["Anuncios", "Resultados", "Entrevistas", "Detrás de cámaras"] as const;

export async function seedPostCategories(db: Db): Promise<void> {
  await db
    .insert(postCategories)
    .values(POST_CATEGORIES.map((name, sortOrder) => ({ name, slug: slugify(name), sortOrder })))
    .onConflictDoNothing({ target: postCategories.slug });
}

const text = (value: string): PostNode => ({ type: "text", text: value });
const paragraph = (value: string): PostNode => ({ type: "paragraph", content: [text(value)] });
const heading = (value: string): PostNode => ({ type: "heading", attrs: { level: 2 }, content: [text(value)] });
const quote = (value: string): PostNode => ({ type: "blockquote", content: [paragraph(value)] });
const youtube = (id: string): PostNode => ({ type: "embed", attrs: { provider: "youtube", id } });
const doc = (...content: PostNode[]): PostBody => ({ type: "doc", content });

type SeedPost = {
  title: string;
  excerpt: string;
  category: (typeof POST_CATEGORIES)[number];
  daysAgo: number;
  featured?: boolean;
  body: PostBody;
  fighters?: string[];
  events?: string[];
};

const SEED_POSTS: SeedPost[] = [
  {
    title: "Pérez defiende el cinturón ante Soto",
    excerpt: "El campeón de peso ligero enfrenta al retador #1 en la pelea más esperada del año. Todo lo que tienes que saber antes de la noche.",
    category: "Anuncios",
    daysAgo: 1,
    featured: true,
    fighters: ["matias-perez", "diego-soto"],
    events: ["guerra-campal-5"],
    body: doc(
      paragraph("Matías «El Toro» Pérez pone en juego el cinturón de peso ligero ante Diego «La Sombra» Soto en la estelar de Guerra Campal 5."),
      heading("Dos estilos opuestos"),
      paragraph("Pérez llega con una racha de nocauts y una lucha que ha aplastado a todos sus rivales. Soto, zurdo y veloz, construyó su récord a punta de contragolpes."),
      quote("«Cada pelea es una final», dijo el campeón al cierre del último entrenamiento abierto."),
      paragraph("Revisa la cartelera completa y los horarios en la página del evento."),
    ),
  },
  {
    title: "Así fue: Rojas somete en el primer round",
    excerpt: "Camila Rojas cerró la pelea con una guillotina a los 3:10 y se mantiene invicta en la promotora.",
    category: "Resultados",
    daysAgo: 3,
    fighters: ["camila-rojas", "javiera-munoz"],
    events: ["guerra-campal-1"],
    body: doc(
      paragraph("La campeona peso paja no necesitó más de tres minutos: derribó, tomó la espalda y encontró la guillotina."),
      youtube("dQw4w9WgXcQ"),
      paragraph("Muñoz, que había empezado fuerte, no pudo salir de la posición."),
    ),
  },
  {
    title: "Cartelera completa de Guerra Campal 5 confirmada",
    excerpt: "Seis peleas, cuatro divisiones y la defensa del cinturón en la estelar.",
    category: "Anuncios",
    daysAgo: 5,
    events: ["guerra-campal-5"],
    body: doc(paragraph("La promotora confirmó las peleas de la próxima velada."), heading("Las peleas"), paragraph("La cartelera estelar la encabeza la defensa de Pérez.")),
  },
  {
    title: "Soto: «Vengo a llevarme el cinturón a Argentina»",
    excerpt: "El retador habló de su preparación y de lo que cambió desde su última derrota.",
    category: "Entrevistas",
    daysAgo: 7,
    fighters: ["diego-soto"],
    body: doc(paragraph("Soto entrenó ocho semanas en Mendoza antes de viajar."), quote("«Estudié cada pelea de Pérez. Hay un hueco y lo voy a encontrar.»")),
  },
  {
    title: "Fuentes sube al #3 del peso wélter",
    excerpt: "La victoria por decisión mayoritaria lo deja a un paso de la pelea por el título.",
    category: "Resultados",
    daysAgo: 10,
    fighters: ["ignacio-fuentes"],
    events: ["guerra-campal-3"],
    body: doc(paragraph("Con una actuación sólida, Fuentes se consolida entre los mejores de su división.")),
  },
  {
    title: "Un día en el campamento del campeón",
    excerpt: "Dos sesiones diarias, sparring y mucha disciplina: así prepara Pérez su defensa.",
    category: "Detrás de cámaras",
    daysAgo: 12,
    fighters: ["matias-perez"],
    body: doc(paragraph("Despierta a las 6:00 y entrena dos veces al día."), heading("La rutina"), paragraph("Lucha por la mañana, golpeo por la tarde y recuperación al final.")),
  },
  {
    title: "Rojas: «Quiero defender el título cada año»",
    excerpt: "La campeona peso paja habló de su camino y de su próximo objetivo.",
    category: "Entrevistas",
    daysAgo: 16,
    fighters: ["camila-rojas"],
    body: doc(paragraph("Camila Rojas no baja el ritmo."), quote("«Quiero que el cinturón se quede en casa.»")),
  },
  {
    title: "Resumen de Guerra Campal 4",
    excerpt: "Una noche con tres finalizaciones y una pelea del año candidata.",
    category: "Resultados",
    daysAgo: 20,
    featured: true,
    events: ["guerra-campal-4"],
    body: doc(paragraph("Repasa los resultados de la última velada, pelea por pelea.")),
  },
  {
    title: "Entradas para Guerra Campal 5: tramos y puntos de venta",
    excerpt: "Cuánto cuestan, dónde comprarlas y qué incluye cada tramo.",
    category: "Anuncios",
    daysAgo: 24,
    events: ["guerra-campal-5"],
    body: doc(paragraph("Las entradas están a la venta en la ticketera oficial y en la boletería del recinto.")),
  },
  {
    title: "Detrás de cámaras: así fue el pesaje",
    excerpt: "Balanza, careos y un par de sorpresas.",
    category: "Detrás de cámaras",
    daysAgo: 30,
    events: ["guerra-campal-4"],
    body: doc(paragraph("Todos los peleadores dieron el peso en la primera pasada.")),
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** 10 noticias ficticias (incluye las de la maqueta), con peleadores y eventos del seed. Idempotente (por slug). */
export async function seedPosts(db: Db, now: Date = new Date()): Promise<void> {
  await seedPostCategories(db);
  const categories = await db.select({ id: postCategories.id, slug: postCategories.slug }).from(postCategories);
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  const fighterSlugs = [...new Set(SEED_POSTS.flatMap((post) => post.fighters ?? []))];
  const eventSlugs = [...new Set(SEED_POSTS.flatMap((post) => post.events ?? []))];
  const [fighterRows, eventRows] = await Promise.all([
    fighterSlugs.length ? db.select({ id: fighters.id, slug: fighters.slug }).from(fighters).where(inArray(fighters.slug, fighterSlugs)) : [],
    eventSlugs.length ? db.select({ id: events.id, slug: events.slug }).from(events).where(inArray(events.slug, eventSlugs)) : [],
  ]);
  const fighterIdBySlug = new Map(fighterRows.map((row) => [row.slug, row.id]));
  const eventIdBySlug = new Map(eventRows.map((row) => [row.slug, row.id]));

  for (const post of SEED_POSTS) {
    const categoryId = categoryBySlug.get(slugify(post.category));
    if (!categoryId) throw new Error(`Falta la categoría ${post.category}`);
    const [created] = await db
      .insert(posts)
      .values({
        slug: slugify(post.title),
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        categoryId,
        featured: post.featured ?? false,
        hasMedia: bodyHasEmbed(post.body),
        status: "published",
        createdAt: new Date(now.getTime() - post.daysAgo * DAY_MS),
      })
      .onConflictDoNothing({ target: posts.slug })
      .returning({ id: posts.id });
    if (!created) continue;

    const fighterIds = (post.fighters ?? []).flatMap((slug) => fighterIdBySlug.get(slug) ?? []);
    const eventIds = (post.events ?? []).flatMap((slug) => eventIdBySlug.get(slug) ?? []);
    if (fighterIds.length) await db.insert(postFighters).values(fighterIds.map((fighterId) => ({ postId: created.id, fighterId })));
    if (eventIds.length) await db.insert(postEvents).values(eventIds.map((eventId) => ({ postId: created.id, eventId })));
  }
}
