import { db } from "@/db";
import { AdminPage } from "@/components/admin/admin-page";
import { listTrash } from "@/features/trash/trash";
import { TrashManager } from "@/features/trash/components/trash-manager";

export default async function AdminPapeleraPage() {
  const items = await listTrash(db);

  return (
    <AdminPage title="Papelera">
      <TrashManager items={items} />
    </AdminPage>
  );
}
