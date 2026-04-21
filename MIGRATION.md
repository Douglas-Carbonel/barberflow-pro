# Migração Supabase → Backend próprio (Node/Express)

Este documento descreve a estratégia de saída gradual do Supabase no frontend
do BarberFlow, sem quebrar o sistema em produção, e preparando o terreno para
trocar o Supabase por Postgres puro mais adiante.

---

## 1. Como o Supabase é usado hoje

Mapeamento do código atual (todas as ocorrências de `supabase.*`):

| Arquivo | Tipo de uso |
|---|---|
| `src/integrations/supabase/client.ts` | Inicialização do client (URL + anon key) |
| `src/contexts/AuthContext.tsx` | `auth.getSession`, `auth.onAuthStateChange`, `auth.signIn/signUp/signOut` + leitura de `profiles`, `tenants`, `user_roles` |
| `src/pages/Onboarding.tsx` | INSERT em `tenants`, `profiles` (update), `user_roles`, `tenant_subscriptions`, `service_categories`, `services`, `professionals` |
| `src/pages/Clientes.tsx` | CRUD de `clients` (já migrado para `/api/clients` ✅) |
| `src/pages/Servicos.tsx` | CRUD de `services` e `service_categories` |
| `src/pages/Profissionais.tsx` | CRUD de `professionals` |
| `src/pages/Agenda.tsx` | CRUD de `appointments` (queries de listagem ainda diretas no Supabase) |

### Tabelas tocadas

`tenants`, `profiles`, `user_roles`, `tenant_subscriptions`, `professionals`,
`services`, `service_categories`, `clients`, `appointments`, `payments`,
`commissions`, `goals`, `membership_plans`, `client_memberships`.

### Pontos mais acoplados (vão doer mais)

1. **`AuthContext`** — não é só uma chamada de query: ele mistura sessão do
   Supabase Auth com a leitura de `profiles/tenants/user_roles`. É o último a
   migrar, porque o JWT do Supabase é justamente o que autentica todas as
   outras chamadas durante a fase de transição.
2. **`Onboarding.tsx`** — orquestra 6 inserts em sequência, com dependências
   entre eles (tenant → profile.update → user_role → subscription → categories
   → services → professionals). Idealmente vira um único endpoint
   `POST /api/onboarding` transacional.
3. **`Agenda.tsx`** — além do CRUD, faz joins implícitos (cliente, serviço,
   profissional). A API precisa devolver os agendamentos já “hidratados”
   para evitar N+1 no frontend.

---

## 2. Arquitetura da transição

```
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│  ├─ Auth: continua falando direto com Supabase Auth          │
│  └─ Dados: fala apenas com /api/* (via src/lib/api.ts)       │
└──────────────────┬───────────────────────────────────────────┘
                   │ Authorization: Bearer <jwt do Supabase>
                   ▼
┌──────────────────────────────────────────────────────────────┐
│ Express (server/)                                            │
│  ├─ requireAuth   → valida JWT no Supabase Auth              │
│  ├─ requireTenant → resolve tenant_id do profile             │
│  └─ supabase por requisição → mantém RLS ativo               │
└──────────────────┬───────────────────────────────────────────┘
                   ▼
              Supabase (Postgres + RLS)
```

**Por que esse desenho?**

- **Sem big bang.** O frontend pode ser migrado uma página por vez. As que
  ainda chamam `supabase.from(...)` continuam funcionando.
- **RLS continua de pé.** Mesmo um bug na API não vaza dados entre tenants,
  porque o client Supabase do servidor é criado com o JWT do usuário, então
  o Postgres continua aplicando as policies.
- **Sem novas secrets agora.** Reaproveitamos `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` que já existem. Service role key fica para depois,
  e só se for realmente necessário (por ex. operações administrativas).
- **Pronto para trocar de banco.** Quando substituirmos o Supabase por
  Postgres + Drizzle, **só os arquivos em `server/` mudam**. O frontend não
  enxerga essa troca.

---

## 3. Estrutura inicial do backend (já criada)

```
server/
├── index.ts                — bootstrap Express, monta as rotas
├── tsconfig.json
├── README.md
├── lib/
│   └── supabase.ts         — supabaseForRequest(jwt)
├── middleware/
│   ├── auth.ts             — requireAuth, requireTenant (+ AuthedRequest)
│   └── error.ts            — errorHandler único
└── routes/
    ├── health.ts                — GET /api/health
    ├── me.ts                    — GET /api/me  (profile + tenant + role)
    ├── clients.ts               — CRUD /api/clients
    ├── professionals.ts         — CRUD /api/professionals
    ├── services.ts              — CRUD /api/services
    ├── service-categories.ts    — CRUD /api/service-categories
    └── appointments.ts          — CRUD /api/appointments  (joins client/professional/service)
```

Frontend ganhou:

```
src/lib/api.ts              — fetch wrapper que injeta o JWT automaticamente
```

E o dev script roda os dois processos em paralelo:

```
npm run dev
  → web (Vite, porta 5000)
  → api (tsx watch server/index.ts, porta 3001)
```

Vite faz proxy de `/api/*` para a porta 3001, então o frontend usa sempre URLs
relativas (`/api/clients`) — funciona igual em dev e em produção.

---

## 4. Endpoints a criar (em ordem de prioridade)

A ordem é por **risco baixo → risco alto**, sempre fazendo a página inteira
junto (endpoint + frontend) para reduzir o tempo em estado “meio migrado”.

### Fase A — CRUDs simples de cadastro (1 página por vez)

| # | Endpoint | Página | Status |
|---|---|---|---|
| ✅ 1 | `/api/clients` (GET, POST, PATCH, DELETE) | `Clientes.tsx` | migrado |
| ✅ 2 | `/api/professionals` (GET, POST, PATCH, DELETE) | `Profissionais.tsx` | migrado |
| ✅ 3 | `/api/services` + `/api/service-categories` | `Servicos.tsx` | migrado |

### Fase B — Recurso central com joins

| # | Endpoint | Página | Notas |
|---|---|---|---|
| ✅ 4 | `/api/appointments` | `Agenda.tsx` | GET embute `client(name)` / `professional(name)` / `service(name)` via PostgREST nested select; `end_time` / `duration` / `price` derivados server-side a partir do serviço |

### Fase C — Fluxo transacional

| # | Endpoint | Página | Notas |
|---|---|---|---|
| 5 | `POST /api/onboarding` | `Onboarding.tsx` | Faz tudo num só request; idealmente num RPC ou transação |
| ✅ 6 | `GET /api/me` | `AuthContext.tsx` | Substituiu as 3 queries de profile/tenant/role por uma só |

### Fase D — Substituição do Supabase Auth (último passo)

Quando todas as chamadas de dados estiverem em `/api/*`, o JWT deixa de
precisar vir do Supabase. Caminhos possíveis:

- **Opção mais simples:** continuar com Supabase Auth indefinidamente — ele é
  bom e gratuito até volume alto. Migra-se só o banco.
- **Opção própria:** implementar `POST /api/auth/login` + `POST /api/auth/register`
  emitindo nosso próprio JWT (jsonwebtoken + bcrypt), e mover usuários da
  tabela `auth.users` do Supabase para uma tabela `users` própria.

Recomendação: **adiar essa decisão**. Migrar dados primeiro tem ROI muito
maior do que migrar auth.

---

## 5. O que deve parar de chamar `supabase.from(...)`

Conforme cada endpoint da seção 4 ficar pronto, removemos o uso direto nos
arquivos abaixo:

- [x] `src/pages/Clientes.tsx` — migrado
- [x] `src/pages/Profissionais.tsx` — migrado
- [x] `src/pages/Servicos.tsx` — migrado (services + service-categories)
- [x] `src/pages/Agenda.tsx` — migrada (CRUD + listagem hidratada)
- [ ] `src/pages/Onboarding.tsx` — 7 chamadas
- [x] `src/contexts/AuthContext.tsx` — leitura de profile/tenant/role migrada para `GET /api/me` (auth.* permanece)

O arquivo `src/integrations/supabase/client.ts` só pode ser **deletado** depois
que `AuthContext` parar de importá-lo (Fase D).

---

## 6. Estratégia para não quebrar nada durante a transição

1. **Page-by-page, nunca em massa.** Cada PR migra uma página inteira:
   adiciona o endpoint no Express, troca as chamadas no React, testa, mescla.
2. **Mesmas chaves de cache do React Query.** As queries já usam
   `['/api/clients', tenant?.id]` — ao trocar a `queryFn` para o `api()`,
   o cache continua válido e a UI nem pisca.
3. **RLS como rede de segurança.** Como o client Supabase do servidor é
   criado com o JWT do usuário, qualquer bug de “esqueci o `.eq('tenant_id', …)`”
   é barrado pelo Postgres antes de vazar dado. A migração é **mais segura**
   nesse modelo do que escrever queries cruas direto.
4. **Endpoints aceitam erros do Supabase como erro 500.** O `errorHandler`
   centraliza isso. O frontend já mostra `err.message` no toast, então a UX
   de erro fica idêntica à de hoje.
5. **Rollback fácil.** Cada página migrada é um commit; se algo der errado,
   reverte o commit e a página volta a falar com Supabase direto.

---

## 7. Quando o Supabase puder sair de cena

O ponto em que faz sentido trocar Supabase por Postgres puro:

1. Todas as páginas migradas para `/api/*` ✅
2. `src/integrations/supabase/client.ts` removido ✅
3. Tabelas exportadas via `pg_dump` e importadas no Postgres novo
4. Substituir `supabaseForRequest(jwt)` em `server/lib/` por:
   - `pg` ou `drizzle-orm` para queries
   - jsonwebtoken para validar o JWT (se mantivermos Supabase Auth temporariamente)
   - ou nosso próprio auth (Fase D)
5. As policies de RLS viram `WHERE tenant_id = $1` em cada query do servidor.
   Recomendado: criar um helper `tenantScoped(db, tenantId)` para não esquecer.

Nesse momento o frontend não muda **uma única linha**.
