import { useState } from 'react';
import { clients } from '@/data/mockData';
import { Search, Plus, Phone, Calendar, DollarSign, Star, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const tagColors: Record<string, string> = {
  'VIP': 'bg-primary/20 text-primary',
  'Premium': 'bg-info/20 text-info',
  'Recorrente': 'bg-success/20 text-success',
  'Inativo': 'bg-destructive/20 text-destructive',
};

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const allTags = [...new Set(clients.flatMap(c => c.tags))];

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchTag = selectedTag === 'all' || c.tags.includes(selectedTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} clientes cadastrados</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit">
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedTag === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => (
          <div key={client.id} className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">{client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{client.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{client.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {client.tags.map(tag => (
                <Badge key={tag} variant="outline" className={`text-[10px] border-none ${tagColors[tag] || 'bg-secondary text-secondary-foreground'}`}>
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{client.visits}</p>
                <p className="text-[10px] text-muted-foreground">Visitas</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">R$ {client.totalSpent.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">{client.frequency}</p>
                <p className="text-[10px] text-muted-foreground">Freq.</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">{client.favoriteProfessional}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Última: {new Date(client.lastVisit).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
