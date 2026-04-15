import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Scissors, Store, Clock, Wrench, Users, CreditCard,
  ChevronRight, ChevronLeft, Check, Plus, X
} from 'lucide-react';

interface OnboardingData {
  barbershopName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
  workingDays: number[];
  services: { name: string; price: number; duration: number }[];
  professionals: { name: string; specialty: string }[];
  plan: 'starter' | 'pro' | 'multi_unidade';
}

const DAYS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const DEFAULT_SERVICES = [
  { name: 'Corte Masculino', price: 45, duration: 30 },
  { name: 'Barba', price: 35, duration: 20 },
  { name: 'Corte + Barba', price: 70, duration: 50 },
  { name: 'Sobrancelha', price: 15, duration: 10 },
];

const PLANS = [
  { id: 'starter' as const, name: 'Starter', price: 'Grátis', desc: 'Até 3 profissionais', features: ['1 unidade', 'Agenda básica', 'Relatórios simples'] },
  { id: 'pro' as const, name: 'Pro', price: 'R$ 99/mês', desc: 'Profissionais ilimitados', features: ['1 unidade', 'Metas e gamificação', 'Relatórios completos', 'Membership'] },
  { id: 'multi_unidade' as const, name: 'Multi-Unidade', price: 'R$ 249/mês', desc: 'Múltiplas unidades', features: ['Unidades ilimitadas', 'Tudo do Pro', 'Dashboard consolidado', 'API'] },
];

const STEPS = ['Barbearia', 'Horários', 'Serviços', 'Equipe', 'Plano'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    barbershopName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    openingTime: '08:00',
    closingTime: '20:00',
    workingDays: [1, 2, 3, 4, 5, 6],
    services: [...DEFAULT_SERVICES],
    professionals: [{ name: '', specialty: '' }],
    plan: 'starter',
  });
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const updateData = (partial: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...partial }));

  const toggleDay = (day: number) => {
    updateData({
      workingDays: data.workingDays.includes(day)
        ? data.workingDays.filter(d => d !== day)
        : [...data.workingDays, day].sort()
    });
  };

  const addService = () => updateData({ services: [...data.services, { name: '', price: 0, duration: 30 }] });
  const removeService = (i: number) => updateData({ services: data.services.filter((_, idx) => idx !== i) });
  const updateService = (i: number, field: string, value: string | number) => {
    const updated = [...data.services];
    updated[i] = { ...updated[i], [field]: value };
    updateData({ services: updated });
  };

  const addProfessional = () => updateData({ professionals: [...data.professionals, { name: '', specialty: '' }] });
  const removeProfessional = (i: number) => updateData({ professionals: data.professionals.filter((_, idx) => idx !== i) });
  const updateProfessional = (i: number, field: string, value: string) => {
    const updated = [...data.professionals];
    updated[i] = { ...updated[i], [field]: value };
    updateData({ professionals: updated });
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const slug = data.barbershopName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      // 1. Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.barbershopName,
          slug: slug + '-' + Date.now(),
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          opening_time: data.openingTime,
          closing_time: data.closingTime,
          working_days: data.workingDays,
          saas_plan: data.plan,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Link profile to tenant
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Create owner role
      await supabase.from('user_roles').insert({
        user_id: user.id,
        tenant_id: tenant.id,
        role: 'owner',
      });

      // 4. Create subscription with 15-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 15);

      await supabase.from('tenant_subscriptions').insert({
        tenant_id: tenant.id,
        plan: data.plan,
        status: 'trial',
        expires_at: trialEndsAt.toISOString(),
      });

      // 5. Create service categories + services
      const { data: category } = await supabase
        .from('service_categories')
        .insert({ tenant_id: tenant.id, name: 'Geral' })
        .select()
        .single();

      const validServices = data.services.filter(s => s.name.trim());
      if (validServices.length > 0 && category) {
        await supabase.from('services').insert(
          validServices.map(s => ({
            tenant_id: tenant.id,
            category_id: category.id,
            name: s.name,
            price: s.price,
            duration: s.duration,
          }))
        );
      }

      // 6. Create professionals
      const validPros = data.professionals.filter(p => p.name.trim());
      if (validPros.length > 0) {
        await supabase.from('professionals').insert(
          validPros.map(p => ({
            tenant_id: tenant.id,
            name: p.name,
            specialty: p.specialty || null,
          }))
        );
      }

      // Save tenant ID to show on success screen
      setCreatedTenantId(tenant.id);

      // Sign out so user goes through login
      await supabase.auth.signOut();

      toast({ title: 'Barbearia criada!', description: `Sua barbearia foi configurada com sucesso.` });
      setStep(STEPS.length); // go to success screen
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast({ title: 'Erro no cadastro', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return data.barbershopName.trim().length > 0;
    if (step === 1) return data.workingDays.length > 0;
    if (step === 2) return data.services.some(s => s.name.trim());
    return true;
  };

  // Success screen after onboarding
  if (createdTenantId) {
    const shortId = createdTenantId.split('-')[0].toUpperCase();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">BarberFlow</span>
          </div>

          <div className="glass-card rounded-xl p-8 space-y-6">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-foreground">Barbearia cadastrada!</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Sua barbearia <strong className="text-foreground">{data.barbershopName}</strong> foi criada com sucesso.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4 space-y-2">
              <p className="text-xs text-muted-foreground">ID da sua barbearia</p>
              <p className="text-lg font-mono font-bold text-primary tracking-wider">{shortId}</p>
              <p className="text-[10px] text-muted-foreground">ID completo: {createdTenantId}</p>
            </div>

            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary font-medium">✨ Período de teste: 15 dias grátis</p>
              <p className="text-[10px] text-muted-foreground mt-1">Aproveite todas as funcionalidades sem compromisso.</p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Ir para o Login <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">BarberFlow</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Configure sua barbearia</h1>
          <p className="text-xs text-muted-foreground mt-1">15 dias grátis • Sem cartão de crédito</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card rounded-xl p-6">
          {/* Step 0: Barbershop Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Dados da Barbearia</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da barbearia *</label>
                <input value={data.barbershopName} onChange={e => updateData({ barbershopName: e.target.value })}
                  placeholder="Ex: Barbearia Premium" required
                  className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                  <input value={data.phone} onChange={e => updateData({ phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Endereço</label>
                  <input value={data.address} onChange={e => updateData({ address: e.target.value })}
                    placeholder="Rua, número"
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade</label>
                  <input value={data.city} onChange={e => updateData({ city: e.target.value })}
                    placeholder="São Paulo"
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Estado</label>
                  <input value={data.state} onChange={e => updateData({ state: e.target.value })}
                    placeholder="SP"
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Schedule */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Horário de Funcionamento</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Abertura</label>
                  <input type="time" value={data.openingTime} onChange={e => updateData({ openingTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Fechamento</label>
                  <input type="time" value={data.closingTime} onChange={e => updateData({ closingTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Dias de funcionamento</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(d => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        data.workingDays.includes(d.value) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Serviços</h2>
                </div>
                <button onClick={addService} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {data.services.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
                    <input value={s.name} onChange={e => updateService(i, 'name', e.target.value)}
                      placeholder="Nome do serviço"
                      className="flex-1 px-3 py-1.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                    <input type="number" value={s.price} onChange={e => updateService(i, 'price', Number(e.target.value))}
                      placeholder="Preço"
                      className="w-20 px-3 py-1.5 bg-secondary rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary" />
                    <input type="number" value={s.duration} onChange={e => updateService(i, 'duration', Number(e.target.value))}
                      placeholder="Min"
                      className="w-16 px-3 py-1.5 bg-secondary rounded-lg border border-border text-sm text-foreground outline-none focus:border-primary" />
                    <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Team */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Equipe</h2>
                </div>
                <button onClick={addProfessional} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              <div className="space-y-3">
                {data.professionals.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
                    <input value={p.name} onChange={e => updateProfessional(i, 'name', e.target.value)}
                      placeholder="Nome do profissional"
                      className="flex-1 px-3 py-1.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                    <input value={p.specialty} onChange={e => updateProfessional(i, 'specialty', e.target.value)}
                      placeholder="Especialidade"
                      className="flex-1 px-3 py-1.5 bg-secondary rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
                    {data.professionals.length > 1 && (
                      <button onClick={() => removeProfessional(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Você pode pular e adicionar depois.</p>
            </div>
          )}

          {/* Step 4: Plan */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Escolha seu plano</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => updateData({ plan: plan.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      data.plan === plan.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                    }`}>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-primary font-bold text-lg">{plan.price}</p>
                    <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border/50">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                Próximo <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={isSubmitting}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                {isSubmitting ? 'Criando...' : 'Finalizar'} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
