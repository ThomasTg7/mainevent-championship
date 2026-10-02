import Link from "next/link";
import { formatShortDate } from "@/lib/format-date";
import type { PostCardDTO } from "../dto";
import { PostCover } from "./post-cover";

export const POST_CARD_SIZES = {
  feature: "(min-width: 1320px) 860px, 92vw",
  default: "(min-width: 1024px) 400px, (min-width: 640px) 45vw, 92vw",
  compact: "(min-width: 640px) 300px, 78vw",
} as const;

type PostCardProps = {
  post: PostCardDTO;
  /** `feature`: la noticia grande; `default`: tarjeta de listado; `compact`: tarjeta angosta de carrusel. */
  variant: keyof typeof POST_CARD_SIZES;
  /** Nivel del título según donde esté la tarjeta (h2 bajo el h1 de una página, h3 dentro de una sección). */
  heading?: "h2" | "h3";
  /** Solo la imagen LCP de la página. */
  priority?: boolean;
};

// Interlineado del título ≥ 1: con menos, las tildes de las mayúsculas (É, Ó) suben sobre la categoría o la línea de arriba.
const TITLE_CLASS = {
  feature: "font-display text-[clamp(28px,3.6vw,50px)] uppercase leading-[1.04] text-white",
  default: "line-clamp-3 font-cond text-xl font-bold uppercase leading-[1.12] tracking-[.03em] text-white sm:text-[22px]",
  compact: "line-clamp-3 font-cond text-lg font-bold uppercase leading-[1.12] tracking-[.03em] text-white",
} as const;

/** Tarjeta de una noticia. Toda la tarjeta es un enlace a la noticia. */
export function PostCard({ post, variant, heading: Heading = "h3", priority = false }: PostCardProps) {
  const feature = variant === "feature";

  return (
    <article data-post={post.slug} className={`group relative flex h-full flex-col bg-surface transition-colors focus-within:outline-2 focus-within:outline-yellow ${feature ? "lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-center" : ""}`}>
      <PostCover cover={post.cover} sizes={POST_CARD_SIZES[variant]} priority={priority} />
      <div
        className={
          feature
            ? "relative z-10 mx-4 -mt-10 flex flex-col gap-3 border-t-[5px] border-yellow bg-surface p-6 sm:mx-9 sm:gap-4 sm:p-8 lg:m-0 lg:border-t-0 lg:border-l-[5px] lg:p-10"
            : "flex flex-1 flex-col gap-3 border-t-[3px] border-yellow p-4 sm:p-5"
        }
      >
        <p data-slot="post-card-meta" className="font-cond text-xs font-extrabold uppercase leading-snug tracking-[.14em] text-yellow">
          {post.category.name}
          <span className="font-semibold text-muted-foreground"> · {formatShortDate(new Date(post.date))}</span>
        </p>
        <Heading className={TITLE_CLASS[variant]}>
          <Link href={`/noticias/${post.slug}`} className="outline-none after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && variant !== "compact" ? (
          <p data-slot="post-card-excerpt" className={`text-muted-foreground ${feature ? "line-clamp-4 max-w-[60ch] sm:line-clamp-none" : "line-clamp-3 text-[15px]"}`}>
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </article>
  );
}
