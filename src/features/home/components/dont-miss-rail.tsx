"use client";

import { useRef } from "react";
import { PostCard } from "@/features/posts/components/post-card";
import type { PostCardDTO } from "@/features/posts/dto";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * «No te lo pierdas» (maqueta): las últimas noticias con video, publicación de una red o galería en un carrusel con imán.
 * Las flechas ←/→ mueven una tarjeta; la lista se enfoca con el teclado (y se recorre con sus flechas) y se desliza con el
 * dedo. Sin noticias con video o galería no se dibuja.
 */
export function DontMissRail({ posts }: { posts: PostCardDTO[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useReducedMotion();
  if (posts.length === 0) return null;

  function scrollByCard(direction: -1 | 1) {
    const list = listRef.current;
    const card = list?.querySelector("li");
    if (!list || !card) return;
    list.scrollBy({ left: direction * (card.getBoundingClientRect().width + 20), behavior: reducedMotion ? "auto" : "smooth" });
  }

  return (
    <section id="no-te-lo-pierdas" aria-labelledby="home-dont-miss-title" className="bg-surface py-[clamp(72px,10vw,140px)]">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
        <div data-reveal className="mb-11 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">Videos y galerías</p>
            <h2 id="home-dont-miss-title" className="font-display text-[clamp(40px,6vw,78px)] uppercase leading-[.9] text-white">
              No te lo pierdas
            </h2>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-label="Anterior" onClick={() => scrollByCard(-1)} className="grid size-[46px] place-items-center border-2 border-border transition-colors hover:border-yellow hover:bg-yellow hover:text-black focus-visible:outline-2 focus-visible:outline-yellow">
              <span aria-hidden>←</span>
            </button>
            <button type="button" aria-label="Siguiente" onClick={() => scrollByCard(1)} className="grid size-[46px] place-items-center border-2 border-border transition-colors hover:border-yellow hover:bg-yellow hover:text-black focus-visible:outline-2 focus-visible:outline-yellow">
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
        <ul
          ref={listRef}
          // El recuadro con scroll es enfocable para poder recorrerlo con el teclado.
          tabIndex={0}
          aria-label="Videos y galerías"
          data-reveal
          className="-mx-[clamp(16px,4vw,64px)] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(16px,4vw,64px)] pb-3 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-yellow [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post) => (
            <li key={post.id} className="w-[min(78vw,300px)] shrink-0 snap-start">
              <PostCard post={post} variant="compact" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
