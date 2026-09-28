"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { restoreAction } from "../actions";
import type { TrashItem } from "../trash";

export function TrashManager({ items }: { items: TrashItem[] }) {
  const [isRestoring, startRestoring] = useTransition();

  function handleRestore(item: TrashItem) {
    startRestoring(async () => {
      const result = await restoreAction(item.entityType, item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Elemento restaurado");
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">La papelera está vacía.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={`${item.entityType}:${item.id}`}
          className="border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p className="font-medium">{item.entityType}</p>
            <p className="text-sm text-muted-foreground">
              Eliminado el {new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(item.deletedAt)}
            </p>
          </div>
          <Button type="button" size="sm" disabled={isRestoring} onClick={() => handleRestore(item)}>
            Restaurar
          </Button>
        </div>
      ))}
    </div>
  );
}
