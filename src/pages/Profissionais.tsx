import { professionals } from '@/data/mockData';
import { Plus, Star, TrendingUp, Calendar, Award } from 'lucide-react';

export default function Profissionais() {
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-sm text-muted-foreground">{professionals.length} profissionais ativos</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Novo Profissional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {professionals.map((prof, i) => {
          const progress = (prof.currentRevenue / prof.monthlyGoal) * 100;
          const goalMet = progress >= 100;

          return (
            <div key={prof.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{prof.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  {i < 3 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                      <Award className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{prof.name}</p>
                  <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs text-foreground font-medium">{prof.rating}</span>
                  </div>
                </div>
              </div>

              {/* Goal Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Meta Mensal</span>
                  <span className={`text-xs font-bold ${goalMet ? 'text-success' : 'text-foreground'}`}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${goalMet ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">R$ {prof.currentRevenue.toLocaleString('pt-BR')}</span>
                  <span className="text-[10px] text-muted-foreground">R$ {prof.monthlyGoal.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{prof.appointments}</p>
                  <p className="text-[10px] text-muted-foreground">Atend.</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{prof.commission}%</p>
                  <p className="text-[10px] text-muted-foreground">Comissão</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-primary">R$ {Math.round(prof.currentRevenue * prof.commission / 100).toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] text-muted-foreground">Ganhos</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
