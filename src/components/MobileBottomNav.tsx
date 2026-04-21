import { useState } from "react";
import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Plus,
  Menu,
  Scissors,
  UserCog,
  Target,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  X,
  DollarSign,
  UserPlus,
  CalendarPlus,
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

const quickActions = [
  { label: "Novo agendamento", icon: CalendarPlus, to: "/app/agenda" },
  { label: "Novo cliente", icon: UserPlus, to: "/app/clientes" },
  { label: "Novo serviço", icon: Scissors, to: "/app/servicos" },
];

export default function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const { profile, tenant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setMoreOpen(false);
    await signOut();
    navigate("/login");
  };

  const handleQuickAction = (to: string) => {
    setFabOpen(false);
    navigate(to);
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const navItem = (
    item: (typeof tabs)[number] | { onClick: () => void; label: string; icon: typeof Menu },
    key: string,
  ) => {
    if ("to" in item) {
      return (
        <RouterNavLink
          key={key}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-[10px] font-medium transition-all duration-200",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
          data-testid={`tab-${item.label.toLowerCase()}`}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute inset-x-3 inset-y-1.5 rounded-full bg-primary/15 -z-10" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110",
                )}
              />
              <span>{item.label}</span>
            </>
          )}
        </RouterNavLink>
      );
    }
    return (
      <button
        key={key}
        onClick={item.onClick}
        className="relative flex flex-col items-center justify-center gap-0.5 h-full flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`tab-${item.label.toLowerCase()}`}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Backdrop blur fade above the nav so content doesn't crash into it */}
      <div
        className="md:hidden pointer-events-none fixed bottom-0 inset-x-0 h-28 z-30 bg-gradient-to-t from-background via-background/80 to-transparent"
        aria-hidden
      />

      {/* Quick action FAB menu */}
      {fabOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setFabOpen(false)}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-32 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {quickActions.map((action, i) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.to)}
                className="flex items-center gap-3 px-4 py-3 rounded-full bg-card border border-border shadow-lg shadow-black/40 text-foreground text-sm font-medium hover:bg-secondary transition-all"
                style={{
                  animation: `slideUpFab 0.25s ease-out ${i * 0.05}s backwards`,
                }}
                data-testid={`quick-action-${i}`}
              >
                <action.icon className="h-4 w-4 text-primary" />
                {action.label}
              </button>
            ))}
          </div>
          <style>{`
            @keyframes slideUpFab {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Floating pill nav */}
      <nav
        className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
        style={{
          bottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
        data-testid="mobile-bottom-nav"
      >
        <div className="pointer-events-auto relative flex items-center h-16 w-[min(92vw,420px)] rounded-full bg-card/85 backdrop-blur-xl border border-border/70 shadow-2xl shadow-black/50 px-2">
          {navItem(tabs[0], "t0")}
          {navItem(tabs[1], "t1")}

          {/* Center FAB */}
          <div className="flex items-center justify-center px-1">
            <button
              onClick={() => setFabOpen((v) => !v)}
              className={cn(
                "relative h-14 w-14 -translate-y-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center transition-all duration-300 active:scale-95",
                fabOpen && "rotate-45",
              )}
              aria-label="Ações rápidas"
              data-testid="fab-quick-action"
            >
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-0" />
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </button>
          </div>

          {navItem(tabs[2], "t2")}
          {navItem(
            { onClick: () => setMoreOpen(true), label: "Mais", icon: Menu },
            "more",
          )}

          {/* More sheet */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <span className="hidden" />
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl p-0 max-h-[85vh] overflow-y-auto border-t border-border"
            >
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border" />
              <SheetHeader className="p-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
                      <span className="text-sm font-bold text-primary-foreground">
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

              <div className="px-3 pb-6">
                <div className="grid grid-cols-3 gap-2">
                  {moreItems.map((item) => (
                    <RouterNavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all",
                          isActive
                            ? "bg-primary/15 text-primary"
                            : "bg-secondary/60 text-foreground hover:bg-secondary",
                        )
                      }
                      data-testid={`more-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[11px] font-medium text-center leading-tight">
                        {item.label}
                      </span>
                    </RouterNavLink>
                  ))}
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  data-testid="button-logout-mobile"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-semibold">Sair da conta</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
