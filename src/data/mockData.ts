// BarberFlow Mock Data

export const professionals = [
  { id: '1', name: 'Carlos Silva', avatar: '', specialty: 'Corte & Barba', commission: 45, monthlyGoal: 12000, currentRevenue: 9800, appointments: 142, rating: 4.9 },
  { id: '2', name: 'André Costa', avatar: '', specialty: 'Corte Degradê', commission: 40, monthlyGoal: 10000, currentRevenue: 7200, appointments: 118, rating: 4.8 },
  { id: '3', name: 'Rafael Mendes', avatar: '', specialty: 'Barba & Design', commission: 45, monthlyGoal: 8000, currentRevenue: 8500, appointments: 95, rating: 4.7 },
  { id: '4', name: 'Lucas Oliveira', avatar: '', specialty: 'Pigmentação', commission: 50, monthlyGoal: 9000, currentRevenue: 5600, appointments: 76, rating: 4.6 },
  { id: '5', name: 'Felipe Santos', avatar: '', specialty: 'Corte Infantil', commission: 40, monthlyGoal: 7000, currentRevenue: 6100, appointments: 88, rating: 4.8 },
];

export const services = [
  { id: '1', name: 'Corte Masculino', category: 'Corte', price: 45, duration: 30, commission: 45, professionals: ['1','2','3','4','5'] },
  { id: '2', name: 'Barba', category: 'Barba', price: 35, duration: 20, commission: 45, professionals: ['1','3'] },
  { id: '3', name: 'Corte + Barba', category: 'Combo', price: 70, duration: 50, commission: 45, professionals: ['1','2','3'] },
  { id: '4', name: 'Sobrancelha', category: 'Acabamento', price: 15, duration: 10, commission: 40, professionals: ['1','2','3','4','5'] },
  { id: '5', name: 'Degradê Premium', category: 'Corte', price: 55, duration: 40, commission: 45, professionals: ['1','2'] },
  { id: '6', name: 'Pigmentação', category: 'Tratamento', price: 120, duration: 60, commission: 50, professionals: ['4'] },
  { id: '7', name: 'Hidratação Capilar', category: 'Tratamento', price: 40, duration: 25, commission: 40, professionals: ['1','3','5'] },
  { id: '8', name: 'Combo VIP', category: 'Combo', price: 110, duration: 70, commission: 45, professionals: ['1','3'] },
];

export const clients = [
  { id: '1', name: 'João Pedro Almeida', phone: '(11) 98765-4321', email: 'joao@email.com', birthday: '1992-03-15', lastVisit: '2024-01-10', visits: 24, totalSpent: 1680, favoriteProfessional: 'Carlos Silva', tags: ['VIP', 'Recorrente'], frequency: 'Quinzenal' },
  { id: '2', name: 'Marcos Vinícius', phone: '(11) 91234-5678', email: 'marcos@email.com', birthday: '1988-07-22', lastVisit: '2024-01-12', visits: 18, totalSpent: 1260, favoriteProfessional: 'André Costa', tags: ['Recorrente'], frequency: 'Mensal' },
  { id: '3', name: 'Gabriel Santos', phone: '(11) 99876-5432', email: 'gabriel@email.com', birthday: '1995-11-08', lastVisit: '2024-01-08', visits: 12, totalSpent: 840, favoriteProfessional: 'Rafael Mendes', tags: ['Premium'], frequency: 'Quinzenal' },
  { id: '4', name: 'Bruno Ferreira', phone: '(11) 93456-7890', email: 'bruno@email.com', birthday: '1990-05-30', lastVisit: '2023-12-15', visits: 6, totalSpent: 390, favoriteProfessional: 'Carlos Silva', tags: ['Inativo'], frequency: 'Esporádico' },
  { id: '5', name: 'Thiago Lima', phone: '(11) 97654-3210', email: 'thiago@email.com', birthday: '1993-09-12', lastVisit: '2024-01-13', visits: 32, totalSpent: 2240, favoriteProfessional: 'Carlos Silva', tags: ['VIP', 'Premium'], frequency: 'Semanal' },
  { id: '6', name: 'Ricardo Souza', phone: '(11) 94567-8901', email: 'ricardo@email.com', birthday: '1987-01-25', lastVisit: '2024-01-11', visits: 15, totalSpent: 1050, favoriteProfessional: 'Felipe Santos', tags: ['Recorrente'], frequency: 'Quinzenal' },
  { id: '7', name: 'Pedro Henrique', phone: '(11) 92345-6789', email: 'pedro@email.com', birthday: '1996-04-18', lastVisit: '2024-01-09', visits: 8, totalSpent: 560, favoriteProfessional: 'André Costa', tags: [], frequency: 'Mensal' },
  { id: '8', name: 'Diego Martins', phone: '(11) 96789-0123', email: 'diego@email.com', birthday: '1991-12-03', lastVisit: '2024-01-14', visits: 20, totalSpent: 1400, favoriteProfessional: 'Rafael Mendes', tags: ['VIP'], frequency: 'Quinzenal' },
];

export type AppointmentStatus = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado' | 'nao_compareceu';

export const statusColors: Record<AppointmentStatus, string> = {
  agendado: 'bg-info/20 text-info',
  confirmado: 'bg-success/20 text-success',
  em_atendimento: 'bg-primary/20 text-primary',
  concluido: 'bg-muted text-muted-foreground',
  cancelado: 'bg-destructive/20 text-destructive',
  nao_compareceu: 'bg-warning/20 text-warning',
};

export const statusLabels: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  nao_compareceu: 'Não Compareceu',
};

export const appointments = [
  { id: '1', client: 'João Pedro Almeida', professional: 'Carlos Silva', service: 'Corte + Barba', date: '2024-01-15', time: '09:00', duration: 50, price: 70, status: 'confirmado' as AppointmentStatus },
  { id: '2', client: 'Marcos Vinícius', professional: 'André Costa', service: 'Degradê Premium', date: '2024-01-15', time: '09:30', duration: 40, price: 55, status: 'agendado' as AppointmentStatus },
  { id: '3', client: 'Gabriel Santos', professional: 'Rafael Mendes', service: 'Barba', date: '2024-01-15', time: '10:00', duration: 20, price: 35, status: 'em_atendimento' as AppointmentStatus },
  { id: '4', client: 'Thiago Lima', professional: 'Carlos Silva', service: 'Combo VIP', date: '2024-01-15', time: '10:00', duration: 70, price: 110, status: 'agendado' as AppointmentStatus },
  { id: '5', client: 'Ricardo Souza', professional: 'Felipe Santos', service: 'Corte Masculino', date: '2024-01-15', time: '10:30', duration: 30, price: 45, status: 'agendado' as AppointmentStatus },
  { id: '6', client: 'Pedro Henrique', professional: 'André Costa', service: 'Corte Masculino', date: '2024-01-15', time: '11:00', duration: 30, price: 45, status: 'confirmado' as AppointmentStatus },
  { id: '7', client: 'Diego Martins', professional: 'Rafael Mendes', service: 'Corte + Barba', date: '2024-01-15', time: '11:00', duration: 50, price: 70, status: 'agendado' as AppointmentStatus },
  { id: '8', client: 'Bruno Ferreira', professional: 'Lucas Oliveira', service: 'Pigmentação', date: '2024-01-15', time: '11:00', duration: 60, price: 120, status: 'confirmado' as AppointmentStatus },
  { id: '9', client: 'João Pedro Almeida', professional: 'Carlos Silva', service: 'Sobrancelha', date: '2024-01-15', time: '14:00', duration: 10, price: 15, status: 'agendado' as AppointmentStatus },
  { id: '10', client: 'Marcos Vinícius', professional: 'Felipe Santos', service: 'Hidratação Capilar', date: '2024-01-15', time: '14:30', duration: 25, price: 40, status: 'agendado' as AppointmentStatus },
];

export const dashboardStats = {
  todayRevenue: 1850,
  monthRevenue: 42600,
  todayAppointments: 18,
  occupancyRate: 78,
  avgTicket: 62,
  newClientsMonth: 23,
  returnRate: 72,
  noShows: 4,
  cancelations: 6,
};

export const revenueByDay = [
  { day: 'Seg', value: 1200 }, { day: 'Ter', value: 1800 }, { day: 'Qua', value: 1500 },
  { day: 'Qui', value: 2100 }, { day: 'Sex', value: 2400 }, { day: 'Sáb', value: 3200 },
];

export const revenueByMonth = [
  { month: 'Jul', value: 28000 }, { month: 'Ago', value: 31000 }, { month: 'Set', value: 29500 },
  { month: 'Out', value: 34000 }, { month: 'Nov', value: 38000 }, { month: 'Dez', value: 41000 },
  { month: 'Jan', value: 42600 },
];

export const topServices = [
  { name: 'Corte + Barba', count: 245, revenue: 17150 },
  { name: 'Corte Masculino', count: 320, revenue: 14400 },
  { name: 'Degradê Premium', count: 180, revenue: 9900 },
  { name: 'Barba', count: 150, revenue: 5250 },
  { name: 'Pigmentação', count: 42, revenue: 5040 },
];

export const financialSummary = {
  today: { revenue: 1850, pix: 740, credit: 555, debit: 370, cash: 185 },
  month: { revenue: 42600, pix: 17040, credit: 12780, debit: 8520, cash: 4260 },
  commissions: 18270,
};

export const membershipPlans = [
  { id: '1', name: 'Plano Corte', price: 79.90, description: '2 cortes por mês', benefits: ['2 cortes/mês', 'Agendamento prioritário', '10% em extras'], subscribers: 45 },
  { id: '2', name: 'Plano Premium', price: 129.90, description: 'Corte + Barba ilimitados', benefits: ['Cortes ilimitados', 'Barbas ilimitadas', 'Sobrancelha inclusa', 'Prioridade total'], subscribers: 28 },
  { id: '3', name: 'Plano VIP', price: 199.90, description: 'Tudo incluso + tratamentos', benefits: ['Tudo do Premium', 'Hidratação mensal', 'Pigmentação com 30% off', 'Atendimento VIP'], subscribers: 12 },
];

export const goals = [
  { id: '1', professional: 'Carlos Silva', type: 'Faturamento', target: 12000, current: 9800, period: 'Mensal' },
  { id: '2', professional: 'André Costa', type: 'Faturamento', target: 10000, current: 7200, period: 'Mensal' },
  { id: '3', professional: 'Rafael Mendes', type: 'Faturamento', target: 8000, current: 8500, period: 'Mensal' },
  { id: '4', professional: 'Lucas Oliveira', type: 'Faturamento', target: 9000, current: 5600, period: 'Mensal' },
  { id: '5', professional: 'Felipe Santos', type: 'Faturamento', target: 7000, current: 6100, period: 'Mensal' },
  { id: '6', professional: 'Carlos Silva', type: 'Atendimentos', target: 160, current: 142, period: 'Mensal' },
  { id: '7', professional: 'André Costa', type: 'Atendimentos', target: 140, current: 118, period: 'Mensal' },
  { id: '8', professional: 'Unidade Centro', type: 'Faturamento', target: 50000, current: 42600, period: 'Mensal' },
];
