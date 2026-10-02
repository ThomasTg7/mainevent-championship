import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui-gc/button";
import { getCachedPublicPostCategories, getCachedPublicPosts } from "@/features/posts/cached-queries";
import { PostCard } from "@/features/posts/components/post-card";
import { parsePageParam } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Noticias | Guerra Campal",
  description: "Anuncios, resultados, entrevistas y detrás de cámaras de Guerra Campal.",
};

const text = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

function listHref(category: string | undefined, page: number): string {
  const query = new URLSearchParams();
  if (category) query.set("categoria", category);
  if (page > 1) query.set("pagina", String(page));
  const search = query.toString();
  return search ? `/noticias?${search}` : "/noticias";
}

const FILTER_CLASS =
  "inline-flex min-h-11 items-center border px-4 font-cond text-sm font-extrabold uppercase tracking-[.1em] transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow";

export default async function NoticiasPage({ searchParams }: PageProps<"/noticias">) {
  const query = await searchParams;
  const page = parsePageParam(query.pagina);
  const requested = text(query.categoria);

  const categories = await getCachedPublicPostCategories();
  const active = categories.find((category) => category.slug === requested);
  // Una categoría que no existe no pasa por la caché (cada texto inventado sería una entrada de un solo uso).
  const { items, hasMore } = requested && !active ? { items: [], hasMore: false } : await getCachedPublicPosts(active?.slug, page);
  const [first, ...rest] = items;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pb-24 pt-[calc(76px+clamp(32px,6vw,72px))]">
      <header className="mb-10">
        <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">Lo último</p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] uppercase leading-[.9] text-white">{active ? active.name : "Noticias"}</h1>
      </header>

      {categories.length > 0 ? (
        <nav aria-label="Categorías de noticias" className="mb-10 flex flex-wrap gap-2">
          <Link href="/noticias" aria-current={active ? undefined : "page"} className={`${FILTER_CLASS} ${active ? "border-white/30 text-white hover:border-yellow" : "border-yellow bg-yellow text-black"}`}>
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={listHref(category.slug, 1)}
              aria-current={active?.id === category.id ? "page" : undefined}
              className={`${FILTER_CLASS} ${active?.id === category.id ? "border-yellow bg-yellow text-black" : "border-white/30 text-white hover:border-yellow"}`}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {first ? (
        <>
          {page === 1 ? (
            <div className="mb-8">
              <PostCard post={first} variant="feature" heading="h2" priority />
            </div>
          ) : null}
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(page === 1 ? rest : items).map((post) => (
              <li key={post.id}>
                <PostCard post={post} variant="default" heading="h2" />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-[clamp(26px,4.5vw,40px)] uppercase leading-none text-white">
            {active || requested ? "Todavía no hay noticias en esta categoría" : "Pronto publicaremos las primeras noticias"}
          </p>
          <Button variant="ghost" asChild>
            <Link href="/noticias">Ver todas las noticias</Link>
          </Button>
        </div>
      )}

      {page > 1 || hasMore ? (
        <nav aria-label="Paginación de noticias" className="mt-10 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Button variant="ghost" asChild>
              <Link href={listHref(active?.slug, page - 1)}>Anterior</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="font-cond font-bold uppercase tracking-[.1em] text-muted-foreground">Página {page}</span>
          {hasMore ? (
            <Button variant="ghost" asChild>
              <Link href={listHref(active?.slug, page + 1)}>Siguiente</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
