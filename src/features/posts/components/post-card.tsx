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

/** Tarjeta de una noticia. Toda la tarjeta es un enlace a la noticia. */
export function PostCard({ post, variant, heading: Heading = "h3", priority = false }: PostCardProps) {
  const feature = variant === "feature";
  const compact = variant === "compact";

  return (
    <article data-post={post.slug} className={`group relative flex flex-col bg-surface transition-colors focus-within:outline-2 focus-within:outline-yellow ${compact ? "h-full" : ""} ${feature ? "lg:grid lg:grid-cols-[1.5fr_1fr] lg:items-center" : ""}`}>
      <PostCover cover={post.cover} sizes={POST_CARD_SIZES[variant]} priority={priority} />
      <div className={feature ? "relative z-10 -mt-10 mr-4 ml-4 border-t-[5px] border-yellow bg-surface p-6 sm:mx-9 sm:p-8 lg:m-0 lg:border-t-0 lg:border-l-[5px] lg:p-10" : "flex flex-1 flex-col gap-2 border-t-[3px] border-yellow p-4 sm:p-5"}>
        <p className="font-cond text-xs font-extrabold uppercase tracking-[.14em] text-yellow">
          {post.category.name}
          <span className="font-semibold text-muted-foreground"> · {formatShortDate(new Date(post.date))}</span>
        </p>
        <Heading
          className={
            feature
              ? "font-display text-[clamp(28px,3.6vw,50px)] uppercase leading-[.95] text-white"
              : `font-cond font-bold uppercase leading-[1.1] tracking-[.03em] text-white ${compact ? "text-lg" : "text-xl sm:text-[22px]"}`
          }
        >
          <Link href={`/noticias/${post.slug}`} className="outline-none after:absolute after:inset-0">
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && !compact ? <p className={`text-muted-foreground ${feature ? "max-w-[60ch]" : "line-clamp-3 text-[15px]"}`}>{post.excerpt}</p> : null}
      </div>
    </article>
  );
}
