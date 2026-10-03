"use client";

import { adminPath } from "@/lib/site-urls";
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const SECTIONS = [
  { href: adminPath("/"), label: "Inicio", icon: Home },
  { href: adminPath("/peleadores"), label: "Peleadores", icon: Swords },
  { href: adminPath("/divisiones"), label: "Divisiones", icon: Layers },
  { href: adminPath("/eventos"), label: "Eventos", icon: Calendar },
  { href: adminPath("/noticias"), label: "Noticias", icon: Newspaper },
  { href: adminPath("/rankings"), label: "Rankings", icon: Trophy },
  { href: adminPath("/patrocinadores"), label: "Patrocinadores", icon: Handshake },
  { href: adminPath("/bandeja"), label: "Bandeja", icon: Inbox },
  { href: adminPath("/configuracion"), label: "Configuración", icon: Settings },
  { href: adminPath("/usuarios"), label: "Usuarios", icon: UserCog },
  { href: adminPath("/papelera"), label: "Papelera", icon: Trash2 },
  { href: adminPath("/historial"), label: "Historial", icon: History },
];

function isActive(pathname: string, href: string): boolean {
  return href === adminPath("/") ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ email, newInbox = 0 }: { email: string; /** Mensajes de la bandeja que nadie ha respondido. */ newInbox?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  async function signOut() {
    await authClient.signOut();
    router.replace(adminPath("/login"));
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href={adminPath("/")} className="flex items-center gap-2 px-1" onClick={() => setOpenMobile(false)}>
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
                  {section.href === adminPath("/bandeja") && newInbox > 0 ? <SidebarMenuBadge aria-label={`${newInbox} mensajes nuevos`}>{newInbox}</SidebarMenuBadge> : null}
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
