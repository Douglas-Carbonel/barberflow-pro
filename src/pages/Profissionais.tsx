import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Mail, Phone, Loader2, Percent, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Professional } from '@/types/database';

interface ProfForm {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  commission_rate: string;
  work_start: string;
  work_end: string;
}

const emptyForm: ProfForm = {
  name: '', specialty: '', phone: '', email: '',
  commission_rate: '50', work_start: '09:00', work_end: '18:00',
};

export default function Profissionais() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const tenantId = tenant?.id;

  const { data: professionals = [], isLoading } = useQuery<Professional[]>({
    queryKey: ['/api/professionals', tenantId],
    enabled: !!tenantId,
    queryFn: () => api<Professional[]>('/api/professionals'),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ProfForm) => {
      if (!tenantId) throw new Error('Sem tenant');
      const commission = parseFloat(input.commission_rate.replace(',', '.'));
      if (isNaN(commission) || commission < 0 || commission > 100) {
        throw new Error('Comissão inválida (0-100)');
      }
      const payload = {
        name: input.name.trim(),
        specialty: input.specialty.trim() || null,
        phone: input.phone.trim() || null,
        email: input.email.trim() || null,
        commission_rate: commission,
        work_start: input.work_start + ':00',
        work_end: input.work_end + ':00',
      };
      if (editingId) {
        await api(`/api/professionals/${editingId}`, { method: 'PATCH', body: payload });
      } else {
        await api('/api/professionals', { method: 'POST', body: payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/professionals', tenantId] });
      toast({ title: editingId ? 'Profissional atualizado' : 'Profissional cadastrado' });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/professionals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/professionals', tenantId] });
      toast({ title: 'Profissional removido' });
      setDeleteId(null);
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Professional) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      specialty: p.specialty ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      commission_rate: String(p.commission_rate ?? 50),
      work_start: p.work_start.slice(0, 5),
      work_end: p.work_end.slice(0, 5),
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Profissionais</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-professionals-count">
            {isLoading ? 'Carregando...' : `${professionals.length} profissionais ativos`}
          </p>
        </div>
        <button
          onClick={openNew}
          data-testid="button-new-professional"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 w-fit"
        >
          <Plus className="h-4 w-4" /> Novo Profissional
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando...
        </div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground" data-testid="text-empty-professionals">
            Nenhum profissional cadastrado. Adicione sua equipe para começar a agendar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {professionals.map((prof) => (
            <div
              key={prof.id}
              data-testid={`card-professional-${prof.id}`}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors group relative"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(prof)}
                  data-testid={`button-edit-professional-${prof.id}`}
                  className="p-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeleteId(prof.id)}
                  data-testid={`button-delete-professional-${prof.id}`}
                  className="p-1.5 rounded-md bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-start gap-3 pr-14">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {prof.avatar_url ? (
                    <img src={prof.avatar_url} alt={prof.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {prof.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{prof.name}</p>
                  {prof.specialty && (
                    <p className="text-xs text-muted-foreground truncate">{prof.specialty}</p>
                  )}
                  {Number(prof.rating) > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <span className="text-xs text-foreground font-medium">{Number(prof.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {prof.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{prof.phone}</span>
                  </div>
                )}
                {prof.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">{prof.email}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
                    <Percent className="h-3 w-3" />{Number(prof.commission_rate).toFixed(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Comissão</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">
                    {prof.work_start.slice(0, 5)} - {prof.work_end.slice(0, 5)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Horário</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-prof-name"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Especialidade</label>
              <input
                type="text" value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                data-testid="input-prof-specialty" placeholder="Ex: Barbeiro, Cabeleireiro"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Telefone</label>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="input-prof-phone" placeholder="(11) 99999-9999"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">E-mail</label>
                <input
                  type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  data-testid="input-prof-email"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Comissão %</label>
                <input
                  type="text" inputMode="decimal" value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  data-testid="input-prof-commission"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <input
                  type="time" value={form.work_start}
                  onChange={(e) => setForm({ ...form, work_start: e.target.value })}
                  data-testid="input-prof-start"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <input
                  type="time" value={form.work_end}
                  onChange={(e) => setForm({ ...form, work_end: e.target.value })}
                  data-testid="input-prof-end"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit" disabled={saveMutation.isPending}
                data-testid="button-save-professional"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional será desativado e não aparecerá mais nas listas. Os agendamentos passados ficam preservados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete-professional"
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
