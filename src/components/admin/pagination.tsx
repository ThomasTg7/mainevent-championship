import Link from "next/link";
import { Button } from "@/components/ui/button";

type PaginationProps = {
  basePath: string;
  page: number;
  hasMore: boolean;
};

export function Pagination({ basePath, page, hasMore }: PaginationProps) {
  if (page === 1 && !hasMore) {
    return null;
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Button asChild variant="outline">
          <Link href={page === 2 ? basePath : `${basePath}?pagina=${page - 1}`}>Anterior</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground">Página {page}</span>
      {hasMore ? (
        <Button asChild variant="outline">
          <Link href={`${basePath}?pagina=${page + 1}`}>Siguiente</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
