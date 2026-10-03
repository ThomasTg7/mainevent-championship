import type { ReactNode } from "react";
import { db } from "@/db";
import { countNewInbox } from "@/features/inbox/queries";
import { requireAdmin } from "@/lib/require-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const newInbox = await countNewInbox(db);

  return (
    <SidebarProvider>
      <AdminSidebar email={admin.email} newInbox={newInbox} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
