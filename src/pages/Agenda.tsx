import { useState } from 'react';
import { appointments, professionals, statusColors, statusLabels, type AppointmentStatus } from '@/data/mockData';
import { Clock, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

export default function Agenda() {
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [view, setView] = useState<'day' | 'week'>('day');

  const filtered = selectedProfessional === 'all'
    ? appointments
    : appointments.filter(a => a.professional === selectedProfessional);

  const profList = [...new Set(appointments.map(a => a.professional))];

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Terça-feira, 15 de Janeiro 2024</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setView('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Dia
          </button>
          <button
            onClick={() => setView('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Semana
          </button>
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-lg px-2 py-1">
          <ChevronLeft className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          <span className="text-xs font-medium text-foreground px-2">Hoje</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>

        <select
          value={selectedProfessional}
          onChange={(e) => setSelectedProfessional(e.target.value)}
          className="bg-secondary text-foreground text-xs rounded-lg px-3 py-2 border-none outline-none"
        >
          <option value="all">Todos os profissionais</option>
          {profList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Day View - Column per professional */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${profList.length}, 1fr)` }}>
              <div className="p-3 text-[10px] text-muted-foreground uppercase">Hora</div>
              {profList.map(prof => (
                <div key={prof} className="p-3 text-center border-l border-border">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                    <span className="text-[10px] font-semibold text-primary">{prof.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{prof.split(' ')[0]}</p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            {timeSlots.map(time => {
              const appts = filtered.filter(a => a.time === time);
              return (
                <div
                  key={time}
                  className="grid border-b border-border/50 hover:bg-accent/30 transition-colors"
                  style={{ gridTemplateColumns: `60px repeat(${profList.length}, 1fr)` }}
                >
                  <div className="p-2 text-[11px] text-muted-foreground font-mono">{time}</div>
                  {profList.map(prof => {
                    const appt = appts.find(a => a.professional === prof);
                    return (
                      <div key={prof} className="p-1 border-l border-border/50 min-h-[48px]">
                        {appt && (
                          <div className={`rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity ${statusColors[appt.status]}`}>
                            <p className="text-[11px] font-medium truncate">{appt.client}</p>
                            <p className="text-[10px] opacity-80 truncate">{appt.service}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              <span className="text-[9px]">{appt.duration}min</span>
                              <span className="text-[9px] ml-auto font-medium">R$ {appt.price}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming List */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Próximos Agendamentos</h3>
        <div className="space-y-2">
          {appointments.slice(0, 6).map(appt => (
            <div key={appt.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="text-center min-w-[45px]">
                <p className="text-sm font-bold text-foreground">{appt.time}</p>
                <p className="text-[10px] text-muted-foreground">{appt.duration}min</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{appt.client}</p>
                <p className="text-xs text-muted-foreground truncate">{appt.service} • {appt.professional}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${statusColors[appt.status]} border-none`}>
                {statusLabels[appt.status]}
              </Badge>
              <span className="text-sm font-semibold text-foreground">R$ {appt.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
