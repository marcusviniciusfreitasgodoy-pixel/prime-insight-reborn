import { Loader2 } from "lucide-react";
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
  { title: "Avaliação Imobiliária", url: "/admin/avaliacao-imobiliaria", icon: null },
  { title: "Histórico Avaliações", url: "/admin/historico-avaliacoes", icon: null },
  { title: "Vistoria Digital", url: "/admin/vistoria-digital", icon: null },
];

const adminItems = [
  { title: "Calibrador Avaliação", url: "/admin/calibrador-avaliacao", icon: null },
  { title: "Leads", url: "/admin/leads", icon: null },
  { title: "Usuários", url: "/admin/usuarios", icon: null },
  { title: "Feedbacks", url: "/admin/feedbacks", icon: null },
];

// Icon mapping for dynamic usage
import { Calculator, History, ClipboardCheck, Settings, Users, UserCog, MessageSquare } from "lucide-react";
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Avaliação Imobiliária": Calculator,
  "Histórico Avaliações": History,
  "Vistoria Digital": ClipboardCheck,
  "Calibrador Avaliação": Settings,
  "Leads": Users,
  "Usuários": UserCog,
  "Feedbacks": MessageSquare,
};

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin, isLoading, role } = useAuthContext();

  // Double-check: verify both isAdmin flag and explicit role match for robustness
  const showAdminMenu = isAdmin === true && role === "admin";

  const renderGroup = (label: string, items: typeof toolItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/60 px-4">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = iconMap[item.title];
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/admin"}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent rounded-md transition-colors"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                  >
                    {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                    {open && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent className="pt-2">
        {renderGroup("Ferramentas", toolItems)}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-sidebar-foreground/40" />
          </div>
        ) : (
          showAdminMenu && renderGroup("Administração", adminItems)
        )}
      </SidebarContent>
    </Sidebar>
  );
}
