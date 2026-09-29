import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui-gc/button";
import { countryName } from "@/domain/units";
import { FighterCard } from "@/features/fighters/components/fighter-card";
import { FighterFilters } from "@/features/fighters/components/fighter-filters";
import { getCachedPublicFighters, getCachedPublicFilterOptions } from "@/features/fighters/cached-queries";
import { fightersHref, parsePublicFilters } from "@/features/fighters/public-filters";

export const metadata: Metadata = {
  title: "Peleadores | Guerra Campal",
  description: "Todo el plantel de Guerra Campal: busca por nombre o apodo y filtra por división, país y estado.",
};

/** Pantallas de la primera fila: 2 columnas en celular, 3 en tablet, 4 en escritorio. */
const FIRST_ROW = 4;

export default async function PeleadoresPage({ searchParams }: PageProps<"/peleadores">) {
  const { filters, page } = parsePublicFilters(await searchParams);
  const [{ items, hasMore }, options] = await Promise.all([getCachedPublicFighters(filters, page), getCachedPublicFilterOptions()]);

  const countries = options.nationalities.map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const isFiltered = Boolean(filters.q || filters.division || filters.nationality || filters.gender || filters.status !== "active");

  return (
    <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pb-24 pt-[calc(76px+clamp(32px,6vw,72px))]">
      <header className="mb-10">
        <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">
          El plantel
        </p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] uppercase leading-[.9] text-white">Peleadores</h1>
      </header>

      <div className="mb-10">
        <FighterFilters filters={filters} divisions={options.divisions} countries={countries} />
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {items.map((fighter, index) => (
            <li key={fighter.id}>
              <FighterCard fighter={fighter} priority={index < FIRST_ROW && page === 1} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-5 border border-dashed border-border px-6 py-16 text-center">
          <p className="font-display text-[clamp(28px,5vw,44px)] uppercase leading-none text-white">
            {isFiltered ? "Sin resultados" : "Pronto presentaremos al plantel"}
          </p>
          <p className="max-w-md font-cond uppercase tracking-[.06em] text-muted-foreground">
            {isFiltered ? "No encontramos peleadores con esos filtros. Prueba con otra búsqueda." : "Estamos preparando las fichas de nuestros peleadores. Vuelve pronto."}
          </p>
          {isFiltered ? (
            <Button variant="primary" asChild>
              <Link href="/peleadores">Ver todos los peleadores</Link>
            </Button>
          ) : null}
        </div>
      )}

      {page > 1 || hasMore ? (
        <nav aria-label="Paginación" className="mt-10 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Button variant="ghost" asChild>
              <Link href={fightersHref(filters, page - 1)}>Anterior</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="font-cond font-bold uppercase tracking-[.1em] text-muted-foreground">Página {page}</span>
          {hasMore ? (
            <Button variant="ghost" asChild>
              <Link href={fightersHref(filters, page + 1)}>Siguiente</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
