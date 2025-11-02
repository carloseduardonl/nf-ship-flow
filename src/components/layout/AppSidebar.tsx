import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  CheckCheck,
  Building2,
  Users,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeliveries } from "@/hooks/useDeliveries";

interface AppSidebarProps {
  userRole?: string;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { yourTurnDeliveries } = useDeliveries();

  const isActive = (path: string) => currentPath === path;

  const mainItems = [
    { title: "Minhas Entregas", url: "/dashboard", icon: LayoutDashboard },
    { title: "Nova Entrega", url: "/entregas/nova", icon: Plus },
    { 
      title: "Sua Vez", 
      url: "/entregas/sua-vez", 
      icon: Clock, 
      badge: yourTurnDeliveries.length 
    },
    { title: "Confirmadas", url: "/entregas/confirmadas", icon: CheckCircle },
    { title: "Em Trânsito", url: "/entregas/em-transito", icon: Truck },
    { title: "Concluídas", url: "/entregas/concluidas", icon: CheckCheck },
  ];

  const secondaryItems = [
    { title: "Empresas Parceiras", url: "/parceiros", icon: Building2 },
    ...(userRole === "ADMIN"
      ? [{ title: "Equipe", url: "/equipe", icon: Users }]
      : []),
    { title: "Configurações", url: "/configuracoes", icon: Settings },
  ];

  const getNavClass = (active: boolean) =>
    active
      ? "bg-primary/10 text-primary hover:bg-primary/15"
      : "hover:bg-accent";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.badge !== undefined && item.badge > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
