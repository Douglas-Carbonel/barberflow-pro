import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Scissors } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const titles: Record<string, string> = {
  "/app": "Início",
  "/app/agenda": "Agenda",
  "/app/clientes": "Clientes",
  "/app/servicos": "Serviços",
  "/app/profissionais": "Profissionais",
  "/app/metas": "Metas",
  "/app/relatorios": "Relatórios",
  "/app/financeiro": "Financeiro",
  "/app/assinaturas": "Assinaturas",
  "/app/configuracoes": "Configurações",
};

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useAuth();

  const isHome = location.pathname === "/app";
  const title = titles[location.pathname] ?? "BarberFlow";

  return (
    <header
      className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          {isHome ? (
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {tenant?.logo_url ? (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Scissors className="h-5 w-5 text-primary-foreground" />
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="-ml-2 p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Voltar"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">{title}</h1>
            {isHome && (
              <p className="text-[11px] text-muted-foreground truncate">
                {tenant?.name ?? "Minha Barbearia"}
              </p>
            )}
          </div>
        </div>

        <button
          className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
        </button>
      </div>
    </header>
  );
}
