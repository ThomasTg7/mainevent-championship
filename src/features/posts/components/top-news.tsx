import Link from "next/link";
import type { PostCardDTO } from "../dto";

/** «Top Noticias» (maqueta): lista numerada con el número en amarillo. La usa la home (Plan 06). */
export function TopNews({ posts }: { posts: PostCardDTO[] }) {
  if (posts.length === 0) return null;

  return (
    <aside aria-labelledby="top-news-title" className="border-t-[5px] border-yellow bg-surface px-7 py-8">
      <h2 id="top-news-title" className="mb-3.5 font-display text-[34px] uppercase leading-none text-white">
        Top <span className="text-yellow">Noticias</span>
      </h2>
      <ol>
        {posts.map((post, index) => (
          <li key={post.id} className="group relative grid grid-cols-[38px_1fr] items-start gap-3.5 border-b border-border py-4 last:border-b-0">
            <span aria-hidden className="grid size-[38px] place-items-center bg-yellow font-display text-xl text-black transition-transform duration-300 ease-gc group-hover:-rotate-[8deg] group-hover:scale-110">
              {index + 1}
            </span>
            <div>
              <span className="mb-0.5 block font-cond text-[11px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">{post.category.name}</span>
              <Link href={`/noticias/${post.slug}`} className="font-cond text-[17px] font-bold uppercase leading-[1.15] tracking-[.03em] text-white outline-none transition-colors after:absolute after:inset-0 group-hover:text-yellow focus-visible:text-yellow">
                {post.title}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
