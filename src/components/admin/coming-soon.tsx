import { requireAdmin } from "@/lib/require-admin";
import { AdminPage } from "./admin-page";

export async function ComingSoonPage({ title }: { title: string }) {
  await requireAdmin();

  return (
    <AdminPage title={title}>
      <p className="text-muted-foreground">Esta sección estará disponible pronto.</p>
    </AdminPage>
  );
}
