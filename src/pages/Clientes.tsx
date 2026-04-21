import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Phone, Mail, Calendar, Tag, Loader2, Pencil, Trash2 } from 'lucide-react';
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
import type { Client } from '@/types/database';

const tagColors: Record<string, string> = {
  'VIP': 'bg-primary/20 text-primary',
  'Premium': 'bg-info/20 text-info',
  'Recorrente': 'bg-success/20 text-success',
  'Inativo': 'bg-destructive/20 text-destructive',
};

interface ClientForm {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  notes: string;
  tags: string;
}

const emptyForm: ClientForm = { name: '', phone: '', email: '', birthday: '', notes: '', tags: '' };

export default function Clientes() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients', tenant?.id],
    enabled: !!tenant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients').select('*').eq('tenant_id', tenant!.id)
        .eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ClientForm) => {
      if (!tenant?.id) throw new Error('Sem tenant');
      const tags = input.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const payload = {
        name: input.name.trim(),
        phone: input.phone.trim() || null,
        email: input.email.trim() || null,
        birthday: input.birthday || null,
        notes: input.notes.trim() || null,
        tags,
      };
      if (editingId) {
        const { error } = await supabase.from('clients').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert({ tenant_id: tenant.id, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/clients', tenant?.id] });
      toast({ title: editingId ? 'Cliente atualizado' : 'Cliente criado' });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/clients', tenant?.id] });
      toast({ title: 'Cliente removido' });
      setDeleteId(null);
    },
    onError: (err: Error) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const allTags = Array.from(new Set(clients.flatMap((c) => c.tags ?? [])));

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search);
    const matchTag = selectedTag === 'all' || (c.tags ?? []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      email: c.email ?? '',
      birthday: c.birthday ?? '',
      notes: c.notes ?? '',
      tags: (c.tags ?? []).join(', '),
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
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Clientes</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-clients-count">
            {isLoading ? 'Carregando...' : `${clients.length} clientes cadastrados`}
          </p>
        </div>
        <button
          onClick={openNew}
          data-testid="button-new-client"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit"
        >
          <Plus className="h-4 w-4" /> Novo Cliente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-clients"
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedTag === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            Todos
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              data-testid={`button-filter-tag-${tag}`}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedTag === tag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando clientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground" data-testid="text-empty-clients">
            {clients.length === 0
              ? 'Nenhum cliente cadastrado ainda. Clique em "Novo Cliente" para começar.'
              : 'Nenhum cliente corresponde aos filtros.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              data-testid={`card-client-${client.id}`}
              className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors group relative"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(client)}
                  data-testid={`button-edit-client-${client.id}`}
                  className="p-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                  title="Editar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setDeleteId(client.id)}
                  data-testid={`button-delete-client-${client.id}`}
                  className="p-1.5 rounded-md bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                  title="Excluir"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pr-14">
                  <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                  {client.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {(client.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className={`text-[10px] border-none ${tagColors[tag] || 'bg-secondary text-secondary-foreground'}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {client.birthday && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    Aniversário: {new Date(client.birthday).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="input-client-name"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Telefone</label>
                <input
                  type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="input-client-phone" placeholder="(11) 99999-9999"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Aniversário</label>
                <input
                  type="date" value={form.birthday}
                  onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                  data-testid="input-client-birthday"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">E-mail</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                data-testid="input-client-email"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags (separadas por vírgula)
              </label>
              <input
                type="text" value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                data-testid="input-client-tags" placeholder="VIP, Recorrente"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                data-testid="input-client-notes" rows={2}
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <DialogFooter>
              <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit" disabled={saveMutation.isPending}
                data-testid="button-save-client"
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
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O cliente será removido da lista. Os agendamentos vinculados continuam preservados no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete-client"
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
