import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { revenueByMonth, topServices, professionals, clients } from '@/data/mockData';
import { Download, Filter } from 'lucide-react';

const COLORS = ['hsl(35,95%,55%)', 'hsl(199,89%,48%)', 'hsl(142,71%,45%)', 'hsl(280,65%,60%)', 'hsl(0,72%,51%)'];

const clientRetention = [
  { month: 'Ago', rate: 65 }, { month: 'Set', rate: 68 }, { month: 'Out', rate: 70 },
  { month: 'Nov', rate: 73 }, { month: 'Dez', rate: 71 }, { month: 'Jan', rate: 72 },
];

const appointmentsPerDay = [
  { day: 'Seg', count: 14 }, { day: 'Ter', count: 18 }, { day: 'Qua', count: 16 },
  { day: 'Qui', count: 20 }, { day: 'Sex', count: 22 }, { day: 'Sáb', count: 28 },
];

export default function Relatorios() {
  const [period, setPeriod] = useState('month');

  const inactiveClients = clients.filter(c => c.tags.includes('Inativo'));
  const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise completa do negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-secondary text-foreground text-xs rounded-lg px-3 py-2 border-none outline-none"
          >
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="quarter">Trimestre</option>
          </select>
          <button className="px-3 py-2 bg-secondary text-foreground rounded-lg text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Month */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Evolução do Faturamento</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByMonth}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,16%,16%)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} />
              <Bar dataKey="value" fill="hsl(35,95%,55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Retention Rate */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Taxa de Retenção</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={clientRetention}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 80]} tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,16%,16%)', borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, 'Retenção']} />
              <Line type="monotone" dataKey="rate" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(142,71%,45%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments per Day */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Atendimentos por Dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={appointmentsPerDay}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,16%,16%)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="hsl(199,89%,48%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Services Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Serviços Mais Vendidos</h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topServices} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="revenue" strokeWidth={0}>
                    {topServices.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {topServices.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-foreground flex-1">{s.name}</span>
                  <span className="text-xs font-semibold text-foreground">R$ {s.revenue.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients & Revenue by Professional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Clientes</h3>
          <div className="space-y-2">
            {topClients.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <span className="text-xs font-bold text-primary w-5">{i + 1}º</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">{c.visits} visitas • {c.frequency}</p>
                </div>
                <span className="text-sm font-bold text-foreground">R$ {c.totalSpent.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Faturamento por Profissional</h3>
          <div className="space-y-2">
            {professionals.sort((a, b) => b.currentRevenue - a.currentRevenue).map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.currentRevenue / professionals[0].currentRevenue) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">R$ {p.currentRevenue.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
