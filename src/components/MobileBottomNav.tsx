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
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile, tenant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setMoreOpen(false);
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
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        data-testid="mobile-bottom-nav"
      >
        <ul className="grid grid-cols-5 h-14">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <RouterNavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 h-full transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground/70 hover:text-foreground",
                  )
                }
                data-testid={`tab-${tab.label.toLowerCase()}`}
              >
                {({ isActive }) => (
                  <>
                    <tab.icon
                      className="h-6 w-6"
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </>
                )}
              </RouterNavLink>
            </li>
          ))}
          <li>
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-1 h-full w-full text-muted-foreground/70 hover:text-foreground transition-colors"
              data-testid="tab-mais"
            >
              <Menu className="h-6 w-6" strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 max-h-[85vh] overflow-y-auto"
        >
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="p-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground">
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

          <div className="px-2 pb-4">
            {moreItems.map((item) => (
              <RouterNavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-foreground hover:bg-secondary/60",
                  )
                }
                data-testid={`more-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </RouterNavLink>
            ))}

            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              data-testid="button-logout-mobile"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
