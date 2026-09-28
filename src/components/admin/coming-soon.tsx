import { AdminPage } from "./admin-page";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <AdminPage title={title}>
      <p className="text-muted-foreground">Esta sección estará disponible en un próximo plan.</p>
    </AdminPage>
  );
}
