import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { applyBrandingColor, resetBrandingColor } from "@/lib/theme";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function AppLayout() {
  const { profile, tenant } = useAuth();

  useEffect(() => {
    applyBrandingColor(tenant?.primary_color);
    return () => resetBrandingColor();
  }, [tenant?.primary_color]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <MobileHeader />

          {/* Desktop header */}
          <header className="hidden md:flex h-14 items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-48"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-foreground">
                  {tenant?.name ?? "Minha Barbearia"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {profile?.full_name ?? ""}
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6">
            <Outlet />
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
