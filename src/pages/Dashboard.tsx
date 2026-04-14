import { DollarSign, Calendar, Users, TrendingUp, Target, AlertTriangle, BarChart3, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '@/components/StatCard';
import { dashboardStats, revenueByDay, revenueByMonth, professionals, topServices } from '@/data/mockData';

const COLORS = ['hsl(35,95%,55%)', 'hsl(199,89%,48%)', 'hsl(142,71%,45%)', 'hsl(280,65%,60%)', 'hsl(0,72%,51%)'];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua barbearia • Janeiro 2024</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento Hoje"
          value={`R$ ${dashboardStats.todayRevenue.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Faturamento Mês"
          value={`R$ ${dashboardStats.monthRevenue.toLocaleString('pt-BR')}`}
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Agendamentos Hoje"
          value={dashboardStats.todayAppointments}
          subtitle={`${dashboardStats.occupancyRate}% de ocupação`}
          icon={<Calendar className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${dashboardStats.avgTicket}`}
          icon={<BarChart3 className="h-5 w-5 text-primary" />}
          trend={{ value: 5, positive: true }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clientes Novos"
          value={dashboardStats.newClientsMonth}
          subtitle="Este mês"
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Taxa de Retorno"
          value={`${dashboardStats.returnRate}%`}
          icon={<Percent className="h-5 w-5 text-primary" />}
          trend={{ value: 3, positive: true }}
        />
        <StatCard
          title="Metas Atingidas"
          value="3/5"
          subtitle="Profissionais no target"
          icon={<Target className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="No-shows"
          value={dashboardStats.noShows}
          subtitle={`${dashboardStats.cancelations} cancelamentos`}
          icon={<AlertTriangle className="h-5 w-5 text-warning" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(35,95%,55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(35,95%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,16%,16%)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(210,20%,95%)' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(35,95%,55%)" strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Revenue */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento da Semana</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueByDay}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(215,15%,55%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,16%,16%)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
              />
              <Bar dataKey="value" fill="hsl(35,95%,55%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Professionals */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Ranking de Profissionais</h3>
          <div className="space-y-3">
            {professionals.sort((a, b) => b.currentRevenue - a.currentRevenue).map((prof, i) => (
              <div key={prof.id} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i + 1}º
                </span>
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-primary">{prof.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{prof.name}</p>
                  <p className="text-[10px] text-muted-foreground">{prof.appointments} atendimentos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">R$ {prof.currentRevenue.toLocaleString('pt-BR')}</p>
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(prof.currentRevenue / prof.monthlyGoal) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Serviços Mais Vendidos</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topServices} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="count" strokeWidth={0}>
                    {topServices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {topServices.map((svc, i) => (
                <div key={svc.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-foreground flex-1 truncate">{svc.name}</span>
                  <span className="text-xs font-medium text-muted-foreground">{svc.count}x</span>
                  <span className="text-xs font-semibold text-foreground">R$ {svc.revenue.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
