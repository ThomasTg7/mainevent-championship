"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addAllowedEmailAction, removeAllowedEmailAction, type AllowedEmailActionState } from "../actions";
import type { AllowedEmailRow } from "../queries";

const initialState: AllowedEmailActionState = {};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date);
}

export function UsersManager({ emails }: { emails: AllowedEmailRow[] }) {
  const [state, formAction, isAdding] = useActionState(async (_prev: AllowedEmailActionState, formData: FormData) => {
    const result = await addAllowedEmailAction(formData);
    if (!result.error) {
      toast.success("Correo agregado a la lista blanca");
    }
    return result;
  }, initialState);

  const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
  const [isRemoving, startRemoving] = useTransition();

  function confirmRemove() {
    if (!emailToRemove) {
      return;
    }
    const email = emailToRemove;
    startRemoving(async () => {
      const result = await removeAllowedEmailAction(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Correo quitado de la lista blanca");
      }
      setEmailToRemove(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col sm:flex-row gap-3 sm:items-start">
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="email" className="sr-only">
            Correo
          </Label>
          <Input id="email" name="email" type="email" placeholder="nuevo@correo.cl" required />
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={isAdding} className="shrink-0">
          Agregar
        </Button>
      </form>

      {/* Tabla en escritorio */}
      <Table className="hidden sm:table">
        <TableHeader>
          <TableRow>
            <TableHead>Correo</TableHead>
            <TableHead>Agregado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emails.map((row) => (
            <TableRow key={row.email}>
              <TableCell>{row.email}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isRemoving}
                  onClick={() => setEmailToRemove(row.email)}
                >
                  Quitar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Tarjetas apiladas en móvil */}
      <div className="flex flex-col gap-3 sm:hidden">
        {emails.map((row) => (
          <div key={row.email} className="border border-border bg-card p-4 flex flex-col gap-2">
            <span className="font-medium break-all">{row.email}</span>
            <span className="text-sm text-muted-foreground">Agregado el {formatDate(row.createdAt)}</span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={() => setEmailToRemove(row.email)}
              className="self-start"
            >
              Quitar
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={emailToRemove !== null} onOpenChange={(open) => !open && setEmailToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitar administrador</DialogTitle>
            <DialogDescription>
              {emailToRemove} perderá el acceso al panel de inmediato. Esta acción se puede revertir agregando el
              correo de nuevo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEmailToRemove(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" disabled={isRemoving} onClick={confirmRemove}>
              Quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
