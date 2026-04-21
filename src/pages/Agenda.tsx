import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, List, LayoutGrid, CalendarDays, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

function buildDayStrip(centerIso: string, span = 21): string[] {
  // Returns an array of ISO dates centered on `centerIso`.
  const half = Math.floor(span / 2);
  const out: string[] = [];
  for (let i = -half; i <= half; i++) out.push(shiftDate(centerIso, i));
  return out;
}

const weekdayShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function dayParts(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return {
    day: d.getDate(),
    weekday: weekdayShort[d.getDay()],
    month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    isToday: iso === todayISO(),
  };
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
  const [view, setView] = useState<'lista' | 'grade'>('lista');
  const dayStripRef = useRef<HTMLDivElement>(null);
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
    queryFn: () => api<Professional[]>('/api/professionals'),
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services', tenantId],
    enabled: !!tenantId,
    queryFn: () => api<Service[]>('/api/services'),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients', tenantId],
    enabled: !!tenantId,
    queryFn: () => api<Client[]>('/api/clients'),
  });

  const { data: appointments = [], isLoading } = useQuery<JoinedAppointment[]>({
    queryKey: ['/api/appointments', tenantId, date],
    enabled: !!tenantId,
    queryFn: () =>
      api<JoinedAppointment[]>(`/api/appointments?date=${encodeURIComponent(date)}`),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: ApptForm) => {
      if (!tenantId) throw new Error('Sem tenant');
      // end_time / duration / price are now derived server-side from the chosen service.
      const payload = {
        client_id: input.client_id,
        professional_id: input.professional_id,
        service_id: input.service_id,
        date: input.date,
        start_time: input.start_time,
        status: input.status,
      };
      if (editingId) {
        await api(`/api/appointments/${editingId}`, { method: 'PATCH', body: payload });
      } else {
        await api('/api/appointments', { method: 'POST', body: payload });
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
    mutationFn: (id: string) => api(`/api/appointments/${id}`, { method: 'DELETE' }),
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

  const dayStrip = useMemo(() => buildDayStrip(date, 21), [date]);

  // Auto-scroll the day strip so the selected date is centered.
  useEffect(() => {
    const container = dayStripRef.current;
    if (!container) return;
    const selected = container.querySelector<HTMLElement>('[data-selected="true"]');
    if (!selected) return;
    const target =
      selected.offsetLeft - container.clientWidth / 2 + selected.clientWidth / 2;
    container.scrollTo({ left: target, behavior: 'smooth' });
  }, [date]);

  const dayCount = visibleAppointments.length;
  const dayRevenue = visibleAppointments
    .filter((a) => a.status !== 'cancelado' && a.status !== 'nao_compareceu')
    .reduce((sum, a) => sum + Number(a.price), 0);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header (title hidden on mobile - already in MobileHeader) */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

      {/* Mobile: month + nav arrows */}
      <div className="md:hidden flex items-center justify-between">
        <p className="text-sm font-semibold capitalize" data-testid="text-current-date">
          {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(todayISO())}
            data-testid="button-today"
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80"
          >
            Hoje
          </button>
          <label className="p-2 rounded-full bg-secondary hover:bg-secondary/80 cursor-pointer">
            <CalendarIcon className="h-4 w-4" />
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              data-testid="input-date"
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Day strip - horizontal scrollable date picker (mobile-first) */}
      <div className="-mx-4 md:mx-0">
        <div
          ref={dayStripRef}
          className="flex items-stretch gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
          data-testid="day-strip"
        >
          {dayStrip.map((iso) => {
            const p = dayParts(iso);
            const selected = iso === date;
            return (
              <button
                key={iso}
                onClick={() => setDate(iso)}
                data-selected={selected}
                data-testid={`day-${iso}`}
                className={`snap-center flex flex-col items-center justify-center min-w-[58px] py-2.5 rounded-2xl transition-all ${
                  selected
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-secondary/60 text-foreground hover:bg-secondary'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-medium ${
                    selected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {p.weekday}
                </span>
                <span className="text-xl font-bold leading-tight">{p.day}</span>
                {p.isToday && !selected && (
                  <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter + view toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-secondary/60 rounded-full pl-3 pr-1 py-1 flex-1 min-w-0">
          <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            data-testid="select-professional"
            className="bg-transparent text-foreground text-xs border-none outline-none flex-1 min-w-0 py-1.5"
          >
            <option value="all">Todos profissionais</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center bg-secondary/60 rounded-full p-1">
          <button
            onClick={() => setView('lista')}
            data-testid="view-lista"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === 'lista'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Lista</span>
          </button>
          <button
            onClick={() => setView('grade')}
            data-testid="view-grade"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              view === 'grade'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Grade</span>
          </button>
        </div>
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-secondary/40 p-3">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Agendamentos</p>
          <p className="text-xl font-bold text-foreground" data-testid="text-day-count">{dayCount}</p>
        </div>
        <div className="rounded-2xl bg-secondary/40 p-3">
          <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Receita prevista</p>
          <p className="text-xl font-bold text-foreground" data-testid="text-day-revenue">
            R$ {dayRevenue.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Content by view mode */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Carregando agenda...
        </div>
      ) : view === 'lista' ? (
        // ===== LIST VIEW (mobile-first timeline) =====
        <div className="space-y-2">
          {visibleAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">Sem agendamentos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Toque no botão + para criar um novo.
              </p>
              <button
                onClick={openNew}
                data-testid="button-new-appointment-empty"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Criar agendamento
              </button>
            </div>
          ) : (
            visibleAppointments.map((appt) => (
              <button
                key={appt.id}
                type="button"
                onClick={() => openEdit(appt)}
                data-testid={`row-appointment-${appt.id}`}
                className="w-full flex items-stretch gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors text-left"
              >
                <div className="flex flex-col items-center justify-center min-w-[58px] rounded-xl bg-secondary/60 px-2 py-2">
                  <p className="text-base font-bold text-foreground leading-none">
                    {appt.start_time.slice(0, 5)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {appt.duration}min
                  </p>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {appt.client?.name ?? '—'}
                    </p>
                    <span className="text-sm font-bold text-foreground flex-shrink-0">
                      R$ {Number(appt.price).toFixed(0)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {appt.service?.name ?? '—'} • {appt.professional?.name ?? '—'}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[appt.status]} border-none`}
                    >
                      {statusLabels[appt.status]}
                    </Badge>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(appt);
                        }}
                        data-testid={`button-edit-appointment-${appt.id}`}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(appt.id);
                        }}
                        data-testid={`button-delete-appointment-${appt.id}`}
                        className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      ) : (
        // ===== GRID VIEW (desktop-style; horizontal scroll on mobile) =====
        <div className="glass-card rounded-2xl overflow-hidden">
          {visibleProfessionals.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground" data-testid="text-no-professionals">
                Cadastre profissionais para usar a agenda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div
                  className="grid border-b border-border bg-card/60"
                  style={{ gridTemplateColumns: `56px repeat(${visibleProfessionals.length}, 1fr)` }}
                >
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
                  const appts = visibleAppointments.filter(
                    (a) => a.start_time.slice(0, 5) === time,
                  );
                  return (
                    <div
                      key={time}
                      className="grid border-b border-border/50 hover:bg-accent/30 transition-colors"
                      style={{ gridTemplateColumns: `56px repeat(${visibleProfessionals.length}, 1fr)` }}
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
                                <p className="text-[11px] font-medium truncate">
                                  {appt.client?.name ?? '—'}
                                </p>
                                <p className="text-[10px] opacity-80 truncate">
                                  {appt.service?.name ?? '—'}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span className="text-[9px]">{appt.duration}min</span>
                                  <span className="text-[9px] ml-auto font-medium">
                                    R$ {Number(appt.price).toFixed(0)}
                                  </span>
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
      )}

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
