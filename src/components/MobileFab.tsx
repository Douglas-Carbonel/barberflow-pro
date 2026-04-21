import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  CalendarPlus,
  UserPlus,
  Scissors,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  { label: "Novo agendamento", icon: CalendarPlus, to: "/app/agenda" },
  { label: "Novo cliente", icon: UserPlus, to: "/app/clientes" },
  { label: "Novo serviço", icon: Scissors, to: "/app/servicos" },
];

const hiddenOn = ["/app/configuracoes", "/app/assinaturas"];

export default function MobileFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (hiddenOn.includes(location.pathname)) return null;

  const handle = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {open && (
        <button
          aria-label="Fechar"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-in fade-in"
        />
      )}

      <div
        className="md:hidden fixed right-4 z-50 flex flex-col items-end gap-3"
        style={{
          bottom: "calc(4rem + 1rem + env(safe-area-inset-bottom))",
        }}
      >
        {open &&
          quickActions.map((action, i) => (
            <button
              key={action.label}
              onClick={() => handle(action.to)}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full bg-card border border-border shadow-lg shadow-black/30 text-foreground text-sm font-medium hover:bg-secondary transition-all"
              style={{
                animation: `fabItem 0.2s ease-out ${i * 0.04}s backwards`,
              }}
              data-testid={`quick-action-${i}`}
            >
              {action.label}
              <span className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                <action.icon className="h-4 w-4 text-foreground" />
              </span>
            </button>
          ))}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar ações" : "Ações rápidas"}
          className={cn(
            "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center transition-all duration-200 active:scale-95",
            open && "rotate-45",
          )}
          data-testid="mobile-fab"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes fabItem {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
