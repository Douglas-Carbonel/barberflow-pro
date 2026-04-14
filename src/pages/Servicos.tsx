import { services } from '@/data/mockData';
import { Plus, Clock, DollarSign, Users, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryColors: Record<string, string> = {
  'Corte': 'bg-primary/20 text-primary',
  'Barba': 'bg-info/20 text-info',
  'Combo': 'bg-success/20 text-success',
  'Tratamento': 'bg-warning/20 text-warning',
  'Acabamento': 'bg-muted text-muted-foreground',
};

export default function Servicos() {
  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-sm text-muted-foreground">{services.length} serviços • {categories.length} categorias</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Novo Serviço
        </button>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {services.filter(s => s.category === cat).map(svc => (
              <div key={svc.id} className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{svc.name}</p>
                    <Badge variant="outline" className={`text-[10px] border-none mt-1 ${categoryColors[svc.category]}`}>{svc.category}</Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">R$ {svc.price}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{svc.duration}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{svc.commission}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{svc.professionals.length} prof.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
