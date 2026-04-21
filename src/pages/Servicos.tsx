import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Percent, Loader2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Service, ServiceCategory } from '@/types/database';

interface NewService {
  name: string;
  category_id: string;
  description: string;
  price: string;
  duration: string;
  commission_rate: string;
}

const emptyForm: NewService = {
  name: '', category_id: '', description: '', price: '', duration: '30', commission_rate: '',
};

export default function Servicos() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [form, setForm] = useState<NewService>(emptyForm);
  const [newCatName, setNewCatName] = useState('');

  const tenantId = tenant?.id;

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service_categories', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('tenant_id', tenantId!)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as ServiceCategory[];
    },
  });

  const createService = useMutation({
    mutationFn: async (input: NewService) => {
      if (!tenantId) throw new Error('Sem tenant');
      const price = parseFloat(input.price.replace(',', '.'));
      const duration = parseInt(input.duration, 10);
      if (isNaN(price) || price < 0) throw new Error('Preço inválido');
      if (isNaN(duration) || duration <= 0) throw new Error('Duração inválida');
      const commission = input.commission_rate.trim()
        ? parseFloat(input.commission_rate.replace(',', '.'))
        : null;
      const { error } = await supabase.from('services').insert({
        tenant_id: tenantId,
        name: input.name.trim(),
        category_id: input.category_id || null,
        description: input.description.trim() || null,
        price,
        duration,
        commission_rate: commission,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/services', tenantId] });
      toast({ title: 'Serviço criado' });
      setForm(emptyForm);
      setOpen(false);
    },
    onError: (err: Error) =>
      toast({ title: 'Erro ao criar', description: err.message, variant: 'destructive' }),
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!tenantId) throw new Error('Sem tenant');
      const sort_order = (categories[categories.length - 1]?.sort_order ?? 0) + 1;
      const { error } = await supabase.from('service_categories').insert({
        tenant_id: tenantId,
        name: name.trim(),
        sort_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/service_categories', tenantId] });
      toast({ title: 'Categoria criada' });
      setNewCatName('');
      setOpenCat(false);
    },
    onError: (err: Error) =>
      toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    createService.mutate(form);
  };

  const grouped = categories.map((cat) => ({
    cat,
    items: services.filter((s) => s.category_id === cat.id),
  }));
  const uncategorized = services.filter((s) => !s.category_id);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Serviços</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-services-count">
            {isLoading ? 'Carregando...' : `${services.length} serviços • ${categories.length} categorias`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenCat(true)}
            data-testid="button-new-category"
            className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/70 flex items-center gap-2"
          >
            <Tag className="h-4 w-4" /> Categoria
          </button>
          <button
            onClick={() => setOpen(true)}
            data-testid="button-new-service"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Serviço
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando...
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground" data-testid="text-empty-services">
            Nenhum serviço cadastrado. Comece criando uma categoria e depois adicione serviços.
          </p>
        </div>
      ) : (
        <>
          {grouped.filter((g) => g.items.length > 0).map(({ cat, items }) => (
            <div key={cat.id}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{cat.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((svc) => (
                  <ServiceCard key={svc.id} service={svc} category={cat.name} />
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sem categoria</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {uncategorized.map((svc) => (
                  <ServiceCard key={svc.id} service={svc} category="—" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* New service dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-service-name"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                data-testid="select-service-category"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Preço (R$) *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  data-testid="input-service-price"
                  placeholder="50,00"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (min) *</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  data-testid="input-service-duration"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Comissão %</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  data-testid="input-service-commission"
                  placeholder="50"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="input-service-description"
                rows={2}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit"
                disabled={createService.isPending}
                data-testid="button-save-service"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {createService.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New category dialog */}
      <Dialog open={openCat} onOpenChange={setOpenCat}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCatName.trim()) return;
              createCategory.mutate(newCatName);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              data-testid="input-category-name"
              placeholder="Ex: Corte, Barba, Tratamento..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              autoFocus
            />
            <DialogFooter>
              <button type="button" onClick={() => setOpenCat(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit"
                disabled={createCategory.isPending}
                data-testid="button-save-category"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {createCategory.isPending ? 'Salvando...' : 'Criar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServiceCard({ service, category }: { service: Service; category: string }) {
  return (
    <div
      data-testid={`card-service-${service.id}`}
      className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{service.name}</p>
          <Badge variant="outline" className="text-[10px] border-none mt-1 bg-secondary text-secondary-foreground">{category}</Badge>
        </div>
        <p className="text-lg font-bold text-primary whitespace-nowrap">R$ {Number(service.price).toFixed(2)}</p>
      </div>
      {service.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{service.description}</p>
      )}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{service.duration}min</span>
        </div>
        {service.commission_rate != null && (
          <div className="flex items-center gap-1">
            <Percent className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{Number(service.commission_rate).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
