import { AdminPage } from "@/components/admin/admin-page";

export default function AdminHomePage() {
  return (
    <AdminPage title="Inicio">
      <p className="text-muted-foreground">
        Aquí verás el próximo evento, la bandeja nueva, los borradores y programados, y accesos rápidos.
      </p>
    </AdminPage>
  );
}
