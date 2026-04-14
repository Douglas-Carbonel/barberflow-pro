import { financialSummary, professionals } from '@/data/mockData';
import { DollarSign, CreditCard, Smartphone, Banknote, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/StatCard';

const paymentData = [
  { name: 'Pix', value: financialSummary.month.pix, color: 'hsl(142,71%,45%)' },
  { name: 'Crédito', value: financialSummary.month.credit, color: 'hsl(35,95%,55%)' },
  { name: 'Débito', value: financialSummary.month.debit, color: 'hsl(199,89%,48%)' },
  { name: 'Dinheiro', value: financialSummary.month.cash, color: 'hsl(280,65%,60%)' },
];

const recentTransactions = [
  { id: '1', client: 'João Pedro', service: 'Corte + Barba', amount: 70, method: 'Pix', time: '09:50', professional: 'Carlos Silva' },
  { id: '2', client: 'Marcos V.', service: 'Degradê Premium', amount: 55, method: 'Crédito', time: '10:10', professional: 'André Costa' },
  { id: '3', client: 'Gabriel S.', service: 'Barba', amount: 35, method: 'Débito', time: '10:20', professional: 'Rafael Mendes' },
  { id: '4', client: 'Thiago Lima', service: 'Combo VIP', amount: 110, method: 'Pix', time: '11:10', professional: 'Carlos Silva' },
  { id: '5', client: 'Ricardo S.', service: 'Corte', amount: 45, method: 'Dinheiro', time: '11:00', professional: 'Felipe Santos' },
  { id: '6', client: 'Pedro H.', service: 'Corte', amount: 45, method: 'Pix', time: '11:30', professional: 'André Costa' },
];

const methodIcons: Record<string, typeof DollarSign> = {
  'Pix': Smartphone,
  'Crédito': CreditCard,
  'Débito': CreditCard,
  'Dinheiro': Banknote,
};

export default function Financeiro() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Controle financeiro • Janeiro 2024</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Hoje"
          value={`R$ ${financialSummary.today.revenue.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={{ value: 15, positive: true }}
        />
        <StatCard
          title="Receita Mensal"
          value={`R$ ${financialSummary.month.revenue.toLocaleString('pt-BR')}`}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Comissões"
          value={`R$ ${financialSummary.commissions.toLocaleString('pt-BR')}`}
          subtitle="Total do mês"
          icon={<ArrowDownRight className="h-5 w-5 text-destructive" />}
        />
        <StatCard
          title="Lucro Líquido"
          value={`R$ ${(financialSummary.month.revenue - financialSummary.commissions).toLocaleString('pt-BR')}`}
          icon={<ArrowUpRight className="h-5 w-5 text-success" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Payment Methods Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Formas de Pagamento</h3>
          <div className="flex flex-col items-center">
            <div className="w-36 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {paymentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3 w-full">
              {paymentData.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-foreground">{p.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">R$ {p.value.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Transações Recentes</h3>
          <div className="space-y-2">
            {recentTransactions.map(tx => {
              const Icon = methodIcons[tx.method] || DollarSign;
              return (
                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.client}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.service} • {tx.professional}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">+ R$ {tx.amount}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.time} • {tx.method}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Commissions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Comissões por Profissional</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-[10px] font-medium text-muted-foreground uppercase">Profissional</th>
                <th className="text-right py-2 text-[10px] font-medium text-muted-foreground uppercase">Faturamento</th>
                <th className="text-right py-2 text-[10px] font-medium text-muted-foreground uppercase">% Comissão</th>
                <th className="text-right py-2 text-[10px] font-medium text-muted-foreground uppercase">Valor</th>
              </tr>
            </thead>
            <tbody>
              {professionals.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-primary">{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <span className="text-sm text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-right text-sm text-foreground">R$ {p.currentRevenue.toLocaleString('pt-BR')}</td>
                  <td className="text-right text-sm text-muted-foreground">{p.commission}%</td>
                  <td className="text-right text-sm font-semibold text-primary">R$ {Math.round(p.currentRevenue * p.commission / 100).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
