import { useState } from "react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Menu,
  Scissors,
  UserCog,
  Target,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const tabs = [
  { to: "/app", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/app/agenda", label: "Agenda", icon: Calendar },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/financeiro", label: "Financeiro", icon: DollarSign },
];

const moreItems = [
  { to: "/app/servicos", label: "Serviços", icon: Scissors },
  { to: "/app/profissionais", label: "Profissionais", icon: UserCog },
  { to: "/app/metas", label: "Metas", icon: Target },
  { to: "/app/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/app/assinaturas", label: "Assinaturas", icon: CreditCard },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

export default function MobileBottomNav() {
  const [open, setOpen] = useState(false);
  const { profile, tenant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="mobile-bottom-nav"
    >
      <ul className="grid grid-cols-5 h-16">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <RouterNavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 h-full text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
              data-testid={`tab-${tab.label.toLowerCase()}`}
            >
              {({ isActive }) => (
                <>
                  <tab.icon
                    className={cn(
                      "h-5 w-5",
                      isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                    )}
                  />
                  <span>{tab.label}</span>
                </>
              )}
            </RouterNavLink>
          </li>
        ))}

        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center gap-1 h-full w-full text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="tab-mais"
              >
                <Menu className="h-5 w-5" />
                <span>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl p-0 max-h-[85vh] overflow-y-auto"
            >
              <SheetHeader className="p-4 border-b border-border text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-base truncate">
                        {profile?.full_name ?? "Usuário"}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant?.name ?? "Minha Barbearia"}
                      </p>
                    </div>
                  </div>
                  <SheetClose className="p-2 rounded-full hover:bg-secondary">
                    <X className="h-4 w-4" />
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="p-2">
                {moreItems.map((item) => (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      )
                    }
                    data-testid={`more-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </RouterNavLink>
                ))}

                <div className="my-2 border-t border-border" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
