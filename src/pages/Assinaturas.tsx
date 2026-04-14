import { membershipPlans } from '@/data/mockData';
import { CreditCard, Users, Check, Plus, Star } from 'lucide-react';

const subscribersList = [
  { id: '1', name: 'Thiago Lima', plan: 'Plano VIP', status: 'Ativo', usedThisMonth: '3/ilimitado', nextRenewal: '2024-02-13' },
  { id: '2', name: 'João Pedro Almeida', plan: 'Plano Corte', status: 'Ativo', usedThisMonth: '1/2', nextRenewal: '2024-02-10' },
  { id: '3', name: 'Diego Martins', plan: 'Plano Premium', status: 'Ativo', usedThisMonth: '5/ilimitado', nextRenewal: '2024-02-08' },
  { id: '4', name: 'Gabriel Santos', plan: 'Plano Corte', status: 'Ativo', usedThisMonth: '2/2', nextRenewal: '2024-02-05' },
  { id: '5', name: 'Ricardo Souza', plan: 'Plano Premium', status: 'Pendente', usedThisMonth: '0/ilimitado', nextRenewal: '2024-01-20' },
];

export default function Assinaturas() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinaturas & Fidelização</h1>
          <p className="text-sm text-muted-foreground">Receita recorrente e planos de membership</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Novo Plano
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Assinantes Ativos</p>
          <p className="text-2xl font-bold text-foreground mt-1">85</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Receita Recorrente</p>
          <p className="text-2xl font-bold text-primary mt-1">R$ 8.490</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-bold text-foreground mt-1">R$ 99,88</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Churn Rate</p>
          <p className="text-2xl font-bold text-success mt-1">3,2%</p>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {membershipPlans.map((plan, i) => (
          <div key={plan.id} className={`glass-card rounded-xl p-5 ${i === 2 ? 'border-primary/50 glow-primary' : ''}`}>
            {i === 2 && (
              <div className="flex items-center gap-1 mb-3">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Mais Popular</span>
              </div>
            )}
            <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            <p className="text-3xl font-bold text-primary">
              R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-sm text-muted-foreground font-normal">/mês</span>
            </p>
            <ul className="mt-4 space-y-2">
              {plan.benefits.map(b => (
                <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-success flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{plan.subscribers} assinantes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribers */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Assinantes Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-[10px] font-medium text-muted-foreground uppercase">Cliente</th>
                <th className="text-left py-2 text-[10px] font-medium text-muted-foreground uppercase">Plano</th>
                <th className="text-center py-2 text-[10px] font-medium text-muted-foreground uppercase">Uso</th>
                <th className="text-center py-2 text-[10px] font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-right py-2 text-[10px] font-medium text-muted-foreground uppercase">Renovação</th>
              </tr>
            </thead>
            <tbody>
              {subscribersList.map(sub => (
                <tr key={sub.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 text-sm text-foreground">{sub.name}</td>
                  <td className="py-3 text-sm text-muted-foreground">{sub.plan}</td>
                  <td className="py-3 text-sm text-center text-foreground">{sub.usedThisMonth}</td>
                  <td className="py-3 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sub.status === 'Ativo' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-right text-muted-foreground">{new Date(sub.nextRenewal).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
