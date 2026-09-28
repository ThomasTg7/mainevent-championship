import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/require-admin";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return <>{children}</>;
}
