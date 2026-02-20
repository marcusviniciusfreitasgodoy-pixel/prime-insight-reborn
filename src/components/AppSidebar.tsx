import { Home, ClipboardCheck, FileText, MapPin, Users, UserCog, Search, Calculator, Settings, History, Brain, BarChart3, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
import { useAuthContext } from "@/contexts/AuthContext";

const toolItems = [
  { title: "Avaliação Imobiliária", url: "/admin/avaliacao-imobiliaria", icon: Calculator },
  { title: "Histórico Avaliações", url: "/admin/historico-avaliacoes", icon: History },
  { title: "Vistoria Digital", url: "/admin/vistoria-digital", icon: ClipboardCheck },
];

const adminItems = [
  { title: "Calibrador Avaliação", url: "/admin/calibrador-avaliacao", icon: Settings },
  { title: "Leads", url: "/admin/leads", icon: Users },
  { title: "Usuários", url: "/admin/usuarios", icon: UserCog },
  { title: "Feedbacks", url: "/admin/feedbacks", icon: MessageSquare },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin } = useAuthContext();

  const renderGroup = (label: string, items: typeof toolItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/60 px-4">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent rounded-md transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {open && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent className="pt-2">
        {renderGroup("Ferramentas", toolItems)}
        {isAdmin && renderGroup("Administração", adminItems)}
      </SidebarContent>
    </Sidebar>
  );
}
