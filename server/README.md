# server/

API Express que **gradualmente** vai substituir as chamadas diretas ao Supabase
no frontend. Hoje o Supabase ainda é a fonte de verdade para banco e auth — esta
camada existe para isolar o frontend dele.

## Arquitetura atual

```
Browser  ─►  Vite dev (porta 5000)  ─►  proxy /api  ─►  Express (porta 3001)
                                                              │
                                                              ▼
                                                        Supabase (RLS)
```

- O frontend continua autenticando direto no Supabase.
- Para chamadas de dados, ele chama `/api/...` enviando o JWT do Supabase em
  `Authorization: Bearer <token>`.
- O middleware `requireAuth` valida o JWT, resolve o `tenant_id` e cria um
  client Supabase **escopado por requisição**, mantendo o RLS ativo (defesa em
  profundidade).

## Estrutura de pastas

```
server/
  index.ts                — bootstrap do Express
  lib/
    supabase.ts           — factory de client Supabase por requisição
  middleware/
    auth.ts               — requireAuth, requireTenant
    error.ts              — handler único de erros
  routes/
    health.ts             — GET /api/health
    clients.ts            — CRUD de clientes (exemplo já implementado)
```

## Rodando localmente

`npm run dev` sobe o frontend (Vite) e a API (tsx watch) em paralelo.

- Frontend: <http://localhost:5000>
- API:       <http://localhost:3001/api/health>

Variáveis usadas pela API (já presentes no projeto):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Próximos endpoints a implementar (ordem sugerida)

Ver `MIGRATION.md` na raiz do projeto.
