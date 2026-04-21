import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Percent, Loader2, Tag, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Service, ServiceCategory } from '@/types/database';

interface ServiceForm {
  name: string;
  category_id: string;
  description: string;
  price: string;
  duration: string;
  commission_rate: string;
}

const emptyForm: ServiceForm = {
  name: '', category_id: '', description: '', price: '', duration: '30', commission_rate: '',
};

type DeleteTarget = { type: 'service' | 'category'; id: string; name: string } | null;

export default function Servicos() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const [openCat, setOpenCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const tenantId = tenant?.id;

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services').select('*').eq('tenant_id', tenantId!)
        .eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const { data: categories = [] } = useQuery<ServiceCategory[]>({
    queryKey: ['/api/service_categories', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories').select('*').eq('tenant_id', tenantId!).order('sort_order');
      if (error) throw error;
      return (data ?? []) as ServiceCategory[];
    },
  });

  const saveService = useMutation({
    mutationFn: async (input: ServiceForm) => {
      if (!tenantId) throw new Error('Sem tenant');
      const price = parseFloat(input.price.replace(',', '.'));
      const duration = parseInt(input.duration, 10);
      if (isNaN(price) || price < 0) throw new Error('Preço inválido');
      if (isNaN(duration) || duration <= 0) throw new Error('Duração inválida');
      const commission = input.commission_rate.trim()
        ? parseFloat(input.commission_rate.replace(',', '.')) : null;
      const payload = {
        name: input.name.trim(),
        category_id: input.category_id || null,
        description: input.description.trim() || null,
        price, duration, commission_rate: commission,
      };
      if (editingId) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert({ tenant_id: tenantId, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/services', tenantId] });
      toast({ title: editingId ? 'Serviço atualizado' : 'Serviço criado' });
      closeServiceDialog();
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const saveCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!tenantId) throw new Error('Sem tenant');
      if (editingCatId) {
        const { error } = await supabase.from('service_categories')
          .update({ name: name.trim() }).eq('id', editingCatId);
        if (error) throw error;
      } else {
        const sort_order = (categories[categories.length - 1]?.sort_order ?? 0) + 1;
        const { error } = await supabase.from('service_categories').insert({
          tenant_id: tenantId, name: name.trim(), sort_order,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/service_categories', tenantId] });
      qc.invalidateQueries({ queryKey: ['/api/services', tenantId] });
      toast({ title: editingCatId ? 'Categoria atualizada' : 'Categoria criada' });
      closeCatDialog();
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/services', tenantId] });
      toast({ title: 'Serviço removido' });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/service_categories', tenantId] });
      qc.invalidateQueries({ queryKey: ['/api/services', tenantId] });
      toast({ title: 'Categoria removida' });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast({
      title: 'Erro ao remover',
      description: err.message.includes('foreign')
        ? 'Existem serviços nesta categoria. Mova-os antes de excluir.'
        : err.message,
      variant: 'destructive',
    }),
  });

  const openNewService = () => {
    setEditingId(null); setForm(emptyForm); setOpen(true);
  };

  const openEditService = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      category_id: s.category_id ?? '',
      description: s.description ?? '',
      price: String(s.price),
      duration: String(s.duration),
      commission_rate: s.commission_rate != null ? String(s.commission_rate) : '',
    });
    setOpen(true);
  };

  const closeServiceDialog = () => {
    setOpen(false); setEditingId(null); setForm(emptyForm);
  };

  const openNewCat = () => {
    setEditingCatId(null); setCatName(''); setOpenCat(true);
  };

  const openEditCat = (c: ServiceCategory) => {
    setEditingCatId(c.id); setCatName(c.name); setOpenCat(true);
  };

  const closeCatDialog = () => {
    setOpenCat(false); setEditingCatId(null); setCatName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    saveService.mutate(form);
  };

  const grouped = categories.map((cat) => ({
    cat, items: services.filter((s) => s.category_id === cat.id),
  }));
  const uncategorized = services.filter((s) => !s.category_id);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'service') deleteService.mutate(deleteTarget.id);
    else deleteCategory.mutate(deleteTarget.id);
  };

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
            onClick={openNewCat}
            data-testid="button-new-category"
            className="px-3 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/70 flex items-center gap-2"
          >
            <Tag className="h-4 w-4" /> Categoria
          </button>
          <button
            onClick={openNewService}
            data-testid="button-new-service"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Novo Serviço
          </button>
        </div>
      </div>

      {/* Categories management list */}
      {categories.length > 0 && (
        <div className="glass-card rounded-xl p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
            Categorias
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                data-testid={`chip-category-${cat.id}`}
                className="flex items-center gap-1 bg-secondary rounded-full pl-3 pr-1 py-1 group"
              >
                <span className="text-xs text-foreground">{cat.name}</span>
                <button
                  onClick={() => openEditCat(cat)}
                  data-testid={`button-edit-category-${cat.id}`}
                  className="p-1 rounded-full hover:bg-background text-muted-foreground hover:text-foreground"
                  title="Editar categoria"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                  data-testid={`button-delete-category-${cat.id}`}
                  className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  title="Excluir categoria"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  <ServiceCard
                    key={svc.id} service={svc} category={cat.name}
                    onEdit={() => openEditService(svc)}
                    onDelete={() => setDeleteTarget({ type: 'service', id: svc.id, name: svc.name })}
                  />
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sem categoria</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {uncategorized.map((svc) => (
                  <ServiceCard
                    key={svc.id} service={svc} category="—"
                    onEdit={() => openEditService(svc)}
                    onDelete={() => setDeleteTarget({ type: 'service', id: svc.id, name: svc.name })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Service dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && closeServiceDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input
                type="text" value={form.name}
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
                  type="text" inputMode="decimal" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  data-testid="input-service-price" placeholder="50,00"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (min) *</label>
                <input
                  type="number" min={5} step={5} value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  data-testid="input-service-duration"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Comissão %</label>
                <input
                  type="text" inputMode="decimal" value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  data-testid="input-service-commission" placeholder="50"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                data-testid="input-service-description" rows={2}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={closeServiceDialog} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit" disabled={saveService.isPending}
                data-testid="button-save-service"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saveService.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category dialog */}
      <Dialog open={openCat} onOpenChange={(o) => !o && closeCatDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCatId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!catName.trim()) return;
              saveCategory.mutate(catName);
            }}
            className="space-y-3"
          >
            <input
              type="text" value={catName}
              onChange={(e) => setCatName(e.target.value)}
              data-testid="input-category-name"
              placeholder="Ex: Corte, Barba, Tratamento..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              autoFocus
            />
            <DialogFooter>
              <button type="button" onClick={closeCatDialog} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit" disabled={saveCategory.isPending}
                data-testid="button-save-category"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saveCategory.isPending ? 'Salvando...' : (editingCatId ? 'Salvar' : 'Criar')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteTarget?.type === 'category' ? 'categoria' : 'serviço'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'category'
                ? `A categoria "${deleteTarget?.name}" será removida. Os serviços dela ficarão sem categoria.`
                : `O serviço "${deleteTarget?.name}" será removido. Agendamentos passados ficam preservados.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              data-testid="button-confirm-delete-service"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ServiceCard({
  service, category, onEdit, onDelete,
}: {
  service: Service; category: string;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div
      data-testid={`card-service-${service.id}`}
      className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors group relative"
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onEdit}
          data-testid={`button-edit-service-${service.id}`}
          className="p-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          data-testid={`button-delete-service-${service.id}`}
          className="p-1.5 rounded-md bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          title="Excluir"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-3 pr-14">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{service.name}</p>
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
