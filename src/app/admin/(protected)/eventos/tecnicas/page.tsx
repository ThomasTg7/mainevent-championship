import type { Metadata } from "next";
import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { listTechniques } from "@/features/events/admin-queries";
import { TechniquesManager } from "@/features/events/components/techniques-manager";
import { requireAdmin } from "@/lib/require-admin";
import { adminPath } from "@/lib/site-urls";

export const metadata: Metadata = { title: "Técnicas de sumisión" };

export default async function AdminTecnicasPage() {
  await requireAdmin();
  const techniques = await listTechniques(db);

  return (
    <AdminPage
      title="Técnicas de sumisión"
      actions={
        <Button asChild variant="outline">
          <Link href={adminPath("/eventos")}>Volver a eventos</Link>
        </Button>
      }
    >
      <p className="max-w-2xl text-sm text-muted-foreground">
        Lista de técnicas que se eligen al registrar una pelea ganada por sumisión. Puedes agregar nuevas, cambiarles el nombre y ordenarlas; una técnica
        que ya se usó en un resultado no se puede eliminar.
      </p>
      <TechniquesManager techniques={techniques} />
    </AdminPage>
  );
}
