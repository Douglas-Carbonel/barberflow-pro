import { goals, professionals } from '@/data/mockData';
import { Target, TrendingUp, AlertTriangle, Award, Trophy } from 'lucide-react';

export default function Metas() {
  const revenueGoals = goals.filter(g => g.type === 'Faturamento' && g.professional !== 'Unidade Centro');
  const unitGoal = goals.find(g => g.professional === 'Unidade Centro');
  const unitProgress = unitGoal ? (unitGoal.current / unitGoal.target) * 100 : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Metas & Performance</h1>
        <p className="text-sm text-muted-foreground">Acompanhamento em tempo real • Janeiro 2024</p>
      </div>

      {/* Unit Goal */}
      {unitGoal && (
        <div className="glass-card rounded-xl p-6 glow-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Meta da Unidade</h3>
              <p className="text-xs text-muted-foreground">{unitGoal.professional} • {unitGoal.period}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-gradient">{unitProgress.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">
                R$ {unitGoal.current.toLocaleString('pt-BR')} / R$ {unitGoal.target.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(unitProgress, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Faltam R$ {(unitGoal.target - unitGoal.current).toLocaleString('pt-BR')} para atingir a meta
          </p>
        </div>
      )}

      {/* Individual Rankings */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ranking Individual de Faturamento</h2>
        <div className="space-y-3">
          {revenueGoals
            .sort((a, b) => (b.current / b.target) - (a.current / a.target))
            .map((goal, i) => {
              const progress = (goal.current / goal.target) * 100;
              const met = progress >= 100;
              const near = progress >= 80 && !met;
              const low = progress < 60;

              return (
                <div key={goal.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {i + 1}º
                    </span>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {goal.professional.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{goal.professional}</p>
                        {met && <Award className="h-4 w-4 text-success" />}
                        {low && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${met ? 'bg-success' : near ? 'bg-primary' : low ? 'bg-destructive' : 'bg-info'}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-bold ${met ? 'text-success' : low ? 'text-destructive' : 'text-foreground'}`}>
                        {progress.toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        R$ {goal.current.toLocaleString('pt-BR')} / R$ {goal.target.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{revenueGoals.filter(g => g.current >= g.target).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Metas Atingidas</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{revenueGoals.filter(g => g.current / g.target >= 0.8 && g.current < g.target).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Quase Lá (80%+)</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{revenueGoals.filter(g => g.current / g.target < 0.6).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Atenção (&lt;60%)</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            R$ {revenueGoals.reduce((acc, g) => acc + g.current, 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Gerado</p>
        </div>
      </div>
    </div>
  );
}
