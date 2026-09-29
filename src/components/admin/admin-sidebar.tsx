"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Handshake,
  History,
  Home,
  Inbox,
  Layers,
  LogOut,
  Newspaper,
  Settings,
  Swords,
  Trash2,
  Trophy,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const SECTIONS = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/peleadores", label: "Peleadores", icon: Swords },
  { href: "/admin/divisiones", label: "Divisiones", icon: Layers },
  { href: "/admin/eventos", label: "Eventos", icon: Calendar },
  { href: "/admin/noticias", label: "Noticias", icon: Newspaper },
  { href: "/admin/rankings", label: "Rankings", icon: Trophy },
  { href: "/admin/patrocinadores", label: "Patrocinadores", icon: Handshake },
  { href: "/admin/bandeja", label: "Bandeja", icon: Inbox },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCog },
  { href: "/admin/papelera", label: "Papelera", icon: Trash2 },
  { href: "/admin/historial", label: "Historial", icon: History },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  async function signOut() {
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/admin" className="flex items-center gap-2 px-1" onClick={() => setOpenMobile(false)}>
          <Logo size="sm" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECTIONS.map((section) => (
                <SidebarMenuItem key={section.href}>
                  <SidebarMenuButton asChild isActive={isActive(pathname, section.href)}>
                    <Link href={section.href} onClick={() => setOpenMobile(false)}>
                      <section.icon />
                      <span>{section.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3 gap-2">
        <span className="px-2 text-xs text-muted-foreground truncate">{email}</span>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
