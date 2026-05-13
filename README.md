# Estética Pro — Sistema de Agendamento Estético

Aplicação web completa para gerenciamento de uma clínica ou profissional autônomo de estética. Permite cadastrar clientes, profissionais, serviços e agendamentos com validações de negócio, busca em tempo real e controle de associações entre profissionais e serviços.

---

## Funcionalidades

- **Dashboard** com estatísticas do dia (agendamentos, clientes, serviços, profissionais)
- **CRUD de Clientes** — cadastro, edição, busca e exclusão
- **CRUD de Profissionais** — com campo de cidade, especialidade e status ativo/inativo
- **CRUD de Serviços** — com valor, duração e descrição
- **Agendamentos** — criação com busca em tempo real por cliente, profissional e serviço; validação de data/hora passada e conflito de horário
- **Listagem de Agendamentos** — com filtros por status e busca
- **Associações Profissional ↔ Serviço** — define quais serviços cada profissional pode realizar

---

## Tecnologias

| Camada | Tecnologia |
| :--- | :--- |
| Frontend | React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Backend | Node.js + Express + tRPC 11 |
| Banco de Dados | MySQL (via Drizzle ORM) |
| Autenticação | Manus OAuth (JWT em cookie) |
| Testes | Vitest |
| Build | Vite 7 |
| Gerenciador de pacotes | pnpm |

---

## Estrutura do Projeto

```
agendamento-estetico-telas/
├── client/
│   └── src/
│       ├── pages/           ← Telas da aplicação
│       │   ├── Dashboard.tsx
│       │   ├── Clientes.tsx
│       │   ├── Profissionais.tsx
│       │   ├── Servicos.tsx
│       │   ├── Agendamento.tsx      ← Formulário de novo agendamento
│       │   ├── Agendamentos.tsx     ← Listagem de agendamentos
│       │   └── ProfissionalServicos.tsx ← Associações
│       ├── components/
│       │   ├── DashboardLayout.tsx  ← Layout com sidebar
│       │   └── ui/                  ← Componentes shadcn/ui
│       └── App.tsx                  ← Rotas
├── drizzle/
│   └── schema.ts            ← Tabelas do banco de dados
├── server/
│   ├── routers.ts           ← Procedures tRPC (API)
│   ├── db.ts                ← Funções de consulta ao banco
│   ├── storage.ts           ← Helpers de armazenamento S3
│   └── agendamento.validacoes.test.ts ← Testes unitários
└── shared/                  ← Tipos e constantes compartilhados
```

---

## Banco de Dados — Tabelas

| Tabela | Descrição |
| :--- | :--- |
| `users` | Usuários autenticados via OAuth |
| `clientes` | Clientes da clínica |
| `profissionais` | Profissionais/esteticistas |
| `servicos` | Serviços/procedimentos oferecidos |
| `profissional_servicos` | Associação N:N entre profissionais e serviços |
| `agendamentos` | Agendamentos com status (pendente/confirmado/cancelado/concluído) |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado na sua máquina:

- [Node.js](https://nodejs.org/) versão **22 ou superior**
- [pnpm](https://pnpm.io/installation) versão **10 ou superior**
- Acesso a um banco de dados **MySQL** (local ou em nuvem, ex: PlanetScale, Railway, TiDB)

---

## Passo a Passo para Rodar Localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/am3nieevil/clinica_estetica.git
cd clinica_estetica
```

### 2. Instalar as dependências

```bash
pnpm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de dados MySQL (obrigatório)
DATABASE_URL="mysql://usuario:senha@host:3306/nome_do_banco"

# Segredo para assinar os cookies de sessão (qualquer string longa e aleatória)
JWT_SECRET="sua-chave-secreta-aqui-minimo-32-caracteres"

# Autenticação OAuth (necessário para login — veja nota abaixo)
VITE_APP_ID="seu-app-id-manus"
OAUTH_SERVER_URL="https://oauth.manus.space"
VITE_OAUTH_PORTAL_URL="https://portal.manus.space"
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"

# APIs internas (deixe em branco se não usar IA/storage)
BUILT_IN_FORGE_API_URL=""
BUILT_IN_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_KEY=""
VITE_FRONTEND_FORGE_API_URL=""
```

> **Nota sobre autenticação:** Este projeto usa Manus OAuth. Se você quiser rodar sem autenticação para desenvolvimento local, pode comentar as rotas protegidas em `server/routers.ts` e usar `publicProcedure` em vez de `protectedProcedure`.

### 4. Criar as tabelas no banco de dados

```bash
pnpm db:push
```

Este comando gera as migrações e aplica o schema no banco de dados configurado em `DATABASE_URL`.

### 5. Rodar o servidor de desenvolvimento

```bash
pnpm dev
```

O servidor iniciará em `http://localhost:3000`. O frontend e o backend rodam juntos na mesma porta.

---

## Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `pnpm dev` | Inicia o servidor de desenvolvimento (frontend + backend) |
| `pnpm build` | Gera o build de produção |
| `pnpm start` | Inicia o servidor em modo produção (requer build) |
| `pnpm test` | Executa os testes unitários com Vitest |
| `pnpm db:push` | Gera e aplica as migrações do banco de dados |
| `pnpm check` | Verifica erros de TypeScript |
| `pnpm format` | Formata o código com Prettier |

---

## Como Adicionar Novas Funcionalidades

O projeto segue um fluxo de 4 passos para cada nova feature:

1. **Schema** — Adicione ou altere tabelas em `drizzle/schema.ts` e execute `pnpm db:push`
2. **Banco** — Adicione funções de consulta em `server/db.ts`
3. **API** — Crie procedures tRPC em `server/routers.ts` (use `publicProcedure` ou `protectedProcedure`)
4. **Frontend** — Crie a página em `client/src/pages/`, registre a rota em `client/src/App.tsx` e adicione ao menu em `client/src/components/DashboardLayout.tsx`

---

## Testes

```bash
pnpm test
```

Os testes estão em `server/agendamento.validacoes.test.ts` e cobrem as validações críticas de negócio:

- Rejeição de agendamentos em datas/horários passados
- Detecção de conflito de horário entre profissionais
- Validação de campos obrigatórios (cliente, profissional, serviço)
- Regras de duração e sobreposição de atendimentos

---

## Próximas Funcionalidades Planejadas (Backlog)

- [ ] Grade de disponibilidade por profissional (dias e horários de trabalho)
- [ ] Filtro de serviços por profissional no formulário de agendamento
- [ ] Edição de agendamentos existentes
- [ ] Histórico de atendimentos por cliente
- [ ] Notificações de lembrete (e-mail/WhatsApp) antes do agendamento

---

## Licença

MIT
