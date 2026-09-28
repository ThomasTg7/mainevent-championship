import { db } from "@/db";
import { AdminPage } from "@/components/admin/admin-page";
import { listRecentAudit } from "@/features/audit/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AdminHistorialPage() {
  const entries = await listRecentAudit(db);

  return (
    <AdminPage title="Historial">
      {entries.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay acciones registradas.</p>
      ) : (
        <>
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Elemento</TableHead>
                <TableHead>Resumen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell className="capitalize">{entry.action}</TableCell>
                  <TableCell>
                    {entry.entityType} · {entry.entityId}
                  </TableCell>
                  <TableCell>{entry.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 sm:hidden">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-border bg-card p-4 flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                <span className="font-medium capitalize">
                  {entry.action} · {entry.entityType}
                </span>
                <span className="text-sm">{entry.summary}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminPage>
  );
}
