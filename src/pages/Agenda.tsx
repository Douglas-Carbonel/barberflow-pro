import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2 } from 'lucide-react';
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
import type { Client, Professional, Service, AppointmentStatus } from '@/types/database';

const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

const statusColors: Record<AppointmentStatus, string> = {
  agendado: 'bg-info/20 text-info',
  confirmado: 'bg-primary/20 text-primary',
  em_atendimento: 'bg-warning/20 text-warning',
  concluido: 'bg-success/20 text-success',
  cancelado: 'bg-destructive/20 text-destructive',
  nao_compareceu: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não compareceu',
};

interface JoinedAppointment {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  client_id: string;
  professional_id: string;
  service_id: string;
  client: { name: string } | null;
  professional: { name: string } | null;
  service: { name: string } | null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(iso: string, days: number) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatLongDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;
}

interface ApptForm {
  client_id: string;
  professional_id: string;
  service_id: string;
  date: string;
  start_time: string;
  status: AppointmentStatus;
}

export default function Agenda() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [date, setDate] = useState<string>(todayISO());
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ApptForm>({
    client_id: '', professional_id: '', service_id: '',
    date: todayISO(), start_time: '09:00', status: 'agendado',
  });

  const tenantId = tenant?.id;

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['/api/professionals', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals').select('*').eq('tenant_id', tenantId!)
        .eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as Professional[];
    },
  });

  const { data: services = [] } = useQuery<Service[]>({
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

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients').select('*').eq('tenant_id', tenantId!)
        .eq('is_active', true).order('name');
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });

  const { data: appointments = [], isLoading } = useQuery<JoinedAppointment[]>({
    queryKey: ['/api/appointments', tenantId, date],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, date, start_time, end_time, duration, price, status,
          client_id, professional_id, service_id,
          client:clients(name),
          professional:professionals(name),
          service:services(name)
        `)
        .eq('tenant_id', tenantId!)
        .eq('date', date)
        .order('start_time');
      if (error) throw error;
      return (data ?? []) as unknown as JoinedAppointment[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ApptForm) => {
      if (!tenantId) throw new Error('Sem tenant');
      const service = services.find((s) => s.id === input.service_id);
      if (!service) throw new Error('Serviço inválido');
      const end_time = addMinutesToTime(input.start_time, service.duration);
      const payload = {
        client_id: input.client_id,
        professional_id: input.professional_id,
        service_id: input.service_id,
        date: input.date,
        start_time: input.start_time + ':00',
        end_time,
        duration: service.duration,
        price: service.price,
        status: input.status,
      };
      if (editingId) {
        const { error } = await supabase.from('appointments').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments')
          .insert({ tenant_id: tenantId, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/appointments', tenantId] });
      toast({ title: editingId ? 'Agendamento atualizado' : 'Agendamento criado' });
      closeDialog();
    },
    onError: (err: Error) =>
      toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/appointments', tenantId] });
      toast({ title: 'Agendamento excluído' });
      setDeleteId(null);
    },
    onError: (err: Error) =>
      toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const visibleProfessionals = useMemo(() => {
    if (selectedProfessional === 'all') return professionals;
    return professionals.filter((p) => p.id === selectedProfessional);
  }, [professionals, selectedProfessional]);

  const visibleAppointments = useMemo(() => {
    if (selectedProfessional === 'all') return appointments;
    return appointments.filter((a) => a.professional_id === selectedProfessional);
  }, [appointments, selectedProfessional]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      client_id: '', professional_id: '', service_id: '',
      date, start_time: '09:00', status: 'agendado',
    });
    setOpen(true);
  };

  const openEdit = (a: JoinedAppointment) => {
    setEditingId(a.id);
    setForm({
      client_id: a.client_id,
      professional_id: a.professional_id,
      service_id: a.service_id,
      date: a.date,
      start_time: a.start_time.slice(0, 5),
      status: a.status,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.professional_id || !form.service_id) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Agenda</h1>
          <p className="text-sm text-muted-foreground capitalize" data-testid="text-current-date">
            {formatLongDate(date)}
          </p>
        </div>
        <button
          onClick={openNew}
          data-testid="button-new-appointment"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 w-fit"
        >
          <Plus className="h-4 w-4" /> Novo Agendamento
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1">
          <button onClick={() => setDate(shiftDate(date, -1))} data-testid="button-prev-day" className="p-1 hover:text-foreground text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setDate(todayISO())} data-testid="button-today" className="text-xs font-medium text-foreground px-2 hover:text-primary">
            Hoje
          </button>
          <button onClick={() => setDate(shiftDate(date, 1))} data-testid="button-next-day" className="p-1 hover:text-foreground text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <input
          type="date" value={date}
          onChange={(e) => setDate(e.target.value)}
          data-testid="input-date"
          className="bg-secondary text-foreground text-xs rounded-lg px-3 py-2 border-none outline-none"
        />

        <select
          value={selectedProfessional}
          onChange={(e) => setSelectedProfessional(e.target.value)}
          data-testid="select-professional"
          className="bg-secondary text-foreground text-xs rounded-lg px-3 py-2 border-none outline-none"
        >
          <option value="all">Todos os profissionais</option>
          {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando agenda...
          </div>
        ) : visibleProfessionals.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-muted-foreground" data-testid="text-no-professionals">
              Cadastre profissionais para usar a agenda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${visibleProfessionals.length}, 1fr)` }}>
                <div className="p-3 text-[10px] text-muted-foreground uppercase">Hora</div>
                {visibleProfessionals.map((prof) => (
                  <div key={prof.id} className="p-3 text-center border-l border-border">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                      <span className="text-[10px] font-semibold text-primary">
                        {prof.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{prof.name.split(' ')[0]}</p>
                  </div>
                ))}
              </div>

              {timeSlots.map((time) => {
                const appts = visibleAppointments.filter((a) => a.start_time.slice(0, 5) === time);
                return (
                  <div
                    key={time}
                    className="grid border-b border-border/50 hover:bg-accent/30 transition-colors"
                    style={{ gridTemplateColumns: `60px repeat(${visibleProfessionals.length}, 1fr)` }}
                  >
                    <div className="p-2 text-[11px] text-muted-foreground font-mono">{time}</div>
                    {visibleProfessionals.map((prof) => {
                      const appt = appts.find((a) => a.professional_id === prof.id);
                      return (
                        <div key={prof.id} className="p-1 border-l border-border/50 min-h-[48px]">
                          {appt && (
                            <button
                              type="button"
                              onClick={() => openEdit(appt)}
                              data-testid={`card-appointment-${appt.id}`}
                              className={`w-full text-left rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity ${statusColors[appt.status]}`}
                              title="Clique para editar"
                            >
                              <p className="text-[11px] font-medium truncate">{appt.client?.name ?? '—'}</p>
                              <p className="text-[10px] opacity-80 truncate">{appt.service?.name ?? '—'}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                <span className="text-[9px]">{appt.duration}min</span>
                                <span className="text-[9px] ml-auto font-medium">R$ {Number(appt.price).toFixed(0)}</span>
                              </div>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Agendamentos do Dia</h3>
        {appointments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center" data-testid="text-empty-appointments">
            Nenhum agendamento neste dia.
          </p>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                data-testid={`row-appointment-${appt.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="text-center min-w-[45px]">
                  <p className="text-sm font-bold text-foreground">{appt.start_time.slice(0, 5)}</p>
                  <p className="text-[10px] text-muted-foreground">{appt.duration}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{appt.client?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.service?.name ?? '—'} • {appt.professional?.name ?? '—'}
                  </p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${statusColors[appt.status]} border-none`}>
                  {statusLabels[appt.status]}
                </Badge>
                <span className="text-sm font-semibold text-foreground">R$ {Number(appt.price).toFixed(0)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(appt)}
                    data-testid={`button-edit-appointment-${appt.id}`}
                    className="p-1.5 rounded-md bg-background hover:bg-background/70 text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteId(appt.id)}
                    data-testid={`button-delete-appointment-${appt.id}`}
                    className="p-1.5 rounded-md bg-background hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Cliente *</label>
              <select
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                data-testid="select-client"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="">Selecione...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Profissional *</label>
              <select
                value={form.professional_id}
                onChange={(e) => setForm({ ...form, professional_id: e.target.value })}
                data-testid="select-form-professional"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="">Selecione...</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Serviço *</label>
              <select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                data-testid="select-form-service"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="">Selecione...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — R$ {Number(s.price).toFixed(2)} ({s.duration}min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Data *</label>
                <input
                  type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  data-testid="input-form-date"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Horário *</label>
                <input
                  type="time" value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  data-testid="input-form-start-time"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentStatus })}
                data-testid="select-form-status"
                className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                {(Object.keys(statusLabels) as AppointmentStatus[]).map((s) => (
                  <option key={s} value={s}>{statusLabels[s]}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDeleteId(editingId);
                  }}
                  data-testid="button-delete-from-edit"
                  className="px-4 py-2 text-sm text-destructive hover:text-destructive/80 mr-auto"
                >
                  Excluir
                </button>
              )}
              <button type="button" onClick={closeDialog} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button
                type="submit" disabled={saveMutation.isPending}
                data-testid="button-save-appointment"
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
            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O agendamento será removido permanentemente. Para apenas marcar como cancelado, use o status "Cancelado" na edição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete-appointment"
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
