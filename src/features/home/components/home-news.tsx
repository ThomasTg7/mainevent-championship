import Link from "next/link";
import { PostCard } from "@/features/posts/components/post-card";
import { TopNews } from "@/features/posts/components/top-news";
import type { HomeDTO } from "../dto";

/**
 * «Noticias» de la home (maqueta): la principal con `PostCard variant="feature"` y «Top Noticias» numeradas, en la grilla
 * `.news-grid` (1.9fr 1fr; una columna en celular). Sin ninguna noticia pública la sección no se dibuja. No lleva `priority`:
 * la imagen principal de la home es la portada.
 */
export function HomeNews({ news }: { news: HomeDTO["news"] }) {
  if (!news.main && news.top.length === 0) return null;

  return (
    <section id="noticias" aria-labelledby="home-news-title" className="py-[clamp(72px,10vw,140px)]">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
        <div data-reveal className="mb-11 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">Lo último</p>
            <h2 id="home-news-title" className="font-display text-[clamp(40px,6vw,78px)] uppercase leading-[.9] text-white">
              Noticias
            </h2>
          </div>
          <Link href="/noticias" className="inline-flex min-h-11 items-center border-b-2 border-yellow pb-1 font-cond text-sm font-extrabold uppercase tracking-[.1em] text-white">
            Todas las noticias <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="grid gap-7 lg:grid-cols-[1.9fr_1fr]">
          {news.main ? (
            <div data-reveal>
              <PostCard post={news.main} variant="feature" heading="h3" />
            </div>
          ) : null}
          <div data-reveal>
            <TopNews posts={news.top} />
          </div>
        </div>
      </div>
    </section>
  );
}
