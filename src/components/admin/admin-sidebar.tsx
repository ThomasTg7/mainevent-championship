"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Handshake,
  History,
  Home,
  Inbox,
  Layers,
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
} from "@/components/ui/sidebar";

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

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/admin" className="flex items-center gap-2 px-1">
          <Logo size="sm" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECTIONS.map((section) => (
                <SidebarMenuItem key={section.href}>
                  <SidebarMenuButton asChild isActive={pathname === section.href}>
                    <Link href={section.href}>
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
      <SidebarFooter className="px-3 py-3 text-xs text-muted-foreground truncate">{email}</SidebarFooter>
    </Sidebar>
  );
}
