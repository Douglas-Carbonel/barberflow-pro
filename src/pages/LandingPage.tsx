import { Scissors, Calendar, Users, BarChart3, Target, Star, ArrowRight, Check, Sparkles, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Agendamento visual por profissional, drag & drop, status em tempo real.' },
  { icon: Users, title: 'CRM de Clientes', desc: 'Histórico completo, tags, preferências e controle de fidelização.' },
  { icon: BarChart3, title: 'Relatórios Gerenciais', desc: 'Faturamento, retenção, ticket médio, ranking e exportação.' },
  { icon: Target, title: 'Metas & Performance', desc: 'Acompanhe metas individuais e da unidade em tempo real.' },
  { icon: Shield, title: 'Gestão Financeira', desc: 'Fechamento de caixa, comissões e formas de pagamento.' },
  { icon: Sparkles, title: 'Assinaturas', desc: 'Receita recorrente com planos de membership e fidelização.' },
];

const plans = [
  { name: 'Starter', price: 'R$ 79', period: '/mês', features: ['1 profissional', 'Agenda básica', 'CRM de clientes', 'Relatórios simples'], popular: false },
  { name: 'Pro', price: 'R$ 149', period: '/mês', features: ['Até 10 profissionais', 'Agenda completa', 'CRM avançado', 'Metas e performance', 'Relatórios completos', 'Financeiro'], popular: true },
  { name: 'Multiunidade', price: 'R$ 299', period: '/mês', features: ['Profissionais ilimitados', 'Múltiplas unidades', 'Tudo do Pro', 'API personalizada', 'Suporte prioritário', 'Onboarding dedicado'], popular: false },
];

const testimonials = [
  { name: 'Rodrigo Barbosa', role: 'Dono • Barbearia Vintage', text: 'O BarberFlow transformou a gestão da minha barbearia. Agora tenho controle total do faturamento e das metas da equipe.' },
  { name: 'Fernanda Lima', role: 'Gerente • Studio Hair', text: 'A agenda é incrível e os relatórios me ajudam a tomar decisões muito mais rápidas. Recomendo demais!' },
  { name: 'Marcos Vieira', role: 'Barbeiro Autônomo', text: 'Mesmo sendo autônomo, o sistema me ajudou a organizar meus clientes e aumentar meu faturamento em 40%.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">BarberFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/register" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Teste Grátis 15 dias
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">A plataforma #1 para barbearias</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
            Sua barbearia no <br /><span className="text-gradient">próximo nível</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
            Gerencie agenda, equipe, clientes, metas e faturamento em uma única plataforma premium. Feito para quem leva a barbearia a sério.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link to="/register" className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
              Começar Gratuitamente <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl text-sm font-medium hover:bg-accent transition-colors">
              Ver Funcionalidades
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Sem cartão de crédito • 15 dias grátis • Cancele quando quiser</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Tudo que sua barbearia precisa</h2>
            <p className="text-muted-foreground mt-2">Ferramentas profissionais em uma plataforma intuitiva</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors group">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Planos para cada tamanho</h2>
            <p className="text-muted-foreground mt-2">Escolha o plano ideal para o seu negócio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`glass-card rounded-xl p-6 ${plan.popular ? 'border-primary/50 glow-primary relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Mais Popular</span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-foreground mt-2">
                  {plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-6 w-full py-2.5 rounded-lg text-sm font-medium text-center block transition-opacity hover:opacity-90 ${plan.popular ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                >
                  Testar 15 dias grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">O que dizem nossos clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="glass-card rounded-xl p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground">Pronto para transformar sua barbearia?</h2>
          <p className="text-muted-foreground mt-3">Comece gratuitamente e veja o resultado em dias.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity mt-6">
            Testar 15 Dias Grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Scissors className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">BarberFlow</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 BarberFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
