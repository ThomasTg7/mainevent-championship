import { db } from "@/db";
import { AdminPage } from "@/components/admin/admin-page";
import { listAllowedEmails } from "@/features/admin-users/queries";
import { UsersManager } from "@/features/admin-users/components/users-manager";

export default async function AdminUsuariosPage() {
  const emails = await listAllowedEmails(db);

  return (
    <AdminPage title="Usuarios">
      <UsersManager emails={emails} />
    </AdminPage>
  );
}
