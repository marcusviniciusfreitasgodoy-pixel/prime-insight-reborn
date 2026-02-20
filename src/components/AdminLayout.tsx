import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BairroProvider } from "@/contexts/BairroContext";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoSymbol from "@/assets/godoy-logo-symbol.png";

export function AdminLayout() {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logout realizado", description: "Você foi desconectado com sucesso." });
    navigate("/auth");
  };

  return (
    <BairroProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 border-b border-border bg-primary sticky top-0 z-50 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-primary-foreground hover:bg-accent/20" />
                <img src={logoSymbol} alt="Godoy Prime" className="h-8 w-auto" />
                <span className="text-sm font-semibold text-primary-foreground tracking-wider hidden sm:inline">GODOY PRIME</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-primary-foreground/70 truncate max-w-[150px] hidden sm:inline">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-accent/20"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BairroProvider>
  );
}
