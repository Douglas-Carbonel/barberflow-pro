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
      className="md:hidden sticky top-0 z-30 bg-background/70 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0">
          {isHome ? (
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg shadow-primary/30">
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
              className="h-10 w-10 -ml-1 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors active:scale-95"
              aria-label="Voltar"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            {isHome ? (
              <>
                <p className="text-[11px] text-muted-foreground">Olá,</p>
                <h1 className="text-base font-semibold truncate leading-tight">
                  {tenant?.name ?? "Minha Barbearia"}
                </h1>
              </>
            ) : (
              <h1 className="text-lg font-semibold truncate">{title}</h1>
            )}
          </div>
        </div>

        <button
          className="relative h-10 w-10 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center transition-colors active:scale-95"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-background" />
        </button>
      </div>
    </header>
  );
}
