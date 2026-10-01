"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormActionState } from "@/lib/form-errors";
import type { TechniqueRow } from "../admin-queries";
import { deleteTechniqueAction, reorderTechniquesAction, saveTechniqueAction } from "../techniques-actions";

type Editing = { id: string | null; name: string } | null;

const usageLabel = (count: number) => (count === 0 ? "Sin usar" : count === 1 ? "Usada en 1 pelea" : `Usada en ${count} peleas`);

/** Catálogo editable de técnicas de sumisión: agregar, renombrar, ordenar (subir y bajar) y quitar las que no se usaron. */
export function TechniquesManager({ techniques }: { techniques: TechniqueRow[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<TechniqueRow | null>(null);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  // Refleja el orden al instante; si la action falla, React vuelve a la lista del servidor.
  const [optimistic, applyOrder] = useOptimistic(techniques, (current, orderedIds: string[]) =>
    orderedIds.flatMap((id) => current.filter((technique) => technique.id === id)),
  );

  function report(result: FormActionState): boolean {
    if (result.error) toast.error(result.error);
    else if (result.success) toast.success(result.success);
    return !result.error;
  }

  function move(index: number, delta: -1 | 1) {
    const ids = optimistic.map((technique) => technique.id);
    [ids[index], ids[index + delta]] = [ids[index + delta]!, ids[index]!];
    startTransition(async () => {
      applyOrder(ids);
      report(await reorderTechniquesAction(ids));
    });
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      if (report(await saveTechniqueAction({ name: newName }))) setNewName("");
    });
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      if (report(await saveTechniqueAction({ id: editing.id, name: editing.name }))) setEditing(null);
    });
  }

  function confirmRemove() {
    if (!removing) return;
    startTransition(async () => {
      report(await deleteTechniqueAction(removing.id));
      setRemoving(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={add} className="flex flex-wrap items-end gap-3" aria-label="Agregar técnica">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5 sm:max-w-sm">
          <Label htmlFor="technique-new">Nueva técnica</Label>
          <Input id="technique-new" value={newName} maxLength={60} onChange={(event) => setNewName(event.target.value)} placeholder="Ej.: Ezekiel" autoComplete="off" />
        </div>
        <Button type="submit" disabled={isPending || newName.trim() === ""}>
          <Plus aria-hidden /> Agregar
        </Button>
      </form>

      {optimistic.length === 0 ? (
        <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aún no hay técnicas. Agrega la primera arriba.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {optimistic.map((technique, index) => (
            <li key={technique.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border bg-card p-3">
              <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
                <span data-testid="technique-name" className="font-medium break-words">{technique.name}</span>
                <span className="text-sm text-muted-foreground">{usageLabel(technique.usedCount)}</span>
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <Button type="button" variant="outline" size="icon" disabled={isPending || index === 0} aria-label={`Subir ${technique.name}`} onClick={() => move(index, -1)}>
                  <ArrowUp aria-hidden />
                </Button>
                <Button type="button" variant="outline" size="icon" disabled={isPending || index === optimistic.length - 1} aria-label={`Bajar ${technique.name}`} onClick={() => move(index, 1)}>
                  <ArrowDown aria-hidden />
                </Button>
                <Button type="button" variant="outline" disabled={isPending} onClick={() => setEditing({ id: technique.id, name: technique.name })} aria-label={`Renombrar ${technique.name}`}>
                  <Pencil aria-hidden /> Renombrar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  disabled={isPending || technique.usedCount > 0}
                  title={technique.usedCount > 0 ? "Se usó en peleas: no se puede eliminar" : undefined}
                  aria-label={`Eliminar ${technique.name}`}
                  onClick={() => setRemoving(technique)}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <form onSubmit={saveEdit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Renombrar técnica</DialogTitle>
              <DialogDescription>El cambio se ve en todos los resultados donde se usó.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="technique-edit">Nombre</Label>
              <Input id="technique-edit" value={editing?.name ?? ""} maxLength={60} onChange={(event) => setEditing((current) => (current ? { ...current, name: event.target.value } : current))} autoComplete="off" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || (editing?.name.trim() ?? "") === ""}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar técnica</DialogTitle>
            <DialogDescription>«{removing?.name}» dejará de estar en la lista. Como no se usó en ninguna pelea, no afecta a ningún resultado.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoving(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={confirmRemove}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
