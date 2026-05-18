# Clínica Estética — Sistema de Agendamento

Sistema web completo para gerenciamento de agendamentos de clínica estética. Inclui CRUD de clientes, profissionais, serviços e agendamentos, com autenticação local por e-mail e senha — **sem dependência do Manus OAuth**.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 + shadcn/ui |
| Backend | Node.js + Express + tRPC 11 |
| Banco de dados | MySQL / TiDB (via Drizzle ORM) |
| Autenticação | JWT local (bcryptjs + jose) |
| Testes | Vitest |

---

## Pré-requisitos

Instale as ferramentas abaixo antes de começar:

- [Node.js 20+](https://nodejs.org/) — runtime JavaScript
- [pnpm](https://pnpm.io/installation) — gerenciador de pacotes (`npm install -g pnpm`)
- [MySQL 8+](https://dev.mysql.com/downloads/) ou [TiDB](https://tidbcloud.com/) — banco de dados relacional
- [Git](https://git-scm.com/) — controle de versão

> **Windows:** todos os comandos abaixo funcionam no PowerShell, Git Bash ou Terminal do VS Code.
> **macOS/Linux:** use o terminal padrão.

---

## Instalação e configuração local

### 1. Clonar o repositório

```bash
git clone https://github.com/am3nieevil/clinica_estetica.git
cd clinica_estetica
```

### 2. Instalar as dependências

```bash
pnpm install
```

### 3. Criar o arquivo `.env`

Crie um arquivo chamado `.env` na **raiz do projeto** com o seguinte conteúdo:

```env
# ─── Banco de dados ───────────────────────────────────────────────────────────
# Formato: mysql://usuario:senha@host:porta/nome_do_banco
DATABASE_URL="mysql://root:suasenha@localhost:3306/clinica_estetica"

# ─── Autenticação JWT ─────────────────────────────────────────────────────────
# Chave secreta para assinar os tokens de sessão.
# Use qualquer string longa e aleatória. Nunca compartilhe este valor.
JWT_SECRET="troque-por-uma-chave-secreta-longa-e-aleatoria"

# ─── Variáveis do Vite (frontend) ─────────────────────────────────────────────
# Estas variáveis são necessárias para o build do frontend.
# Para uso local, os valores abaixo são suficientes.
VITE_APP_ID="local"
VITE_APP_TITLE="Clínica Estética"
VITE_OAUTH_PORTAL_URL="http://localhost:3000"
VITE_FRONTEND_FORGE_API_KEY="local"
VITE_FRONTEND_FORGE_API_URL="http://localhost:3000"

# ─── Informações do proprietário (opcional) ───────────────────────────────────
OWNER_OPEN_ID="admin@clinica.com"
OWNER_NAME="Administrador"
```

> **Dica:** Para gerar um `JWT_SECRET` seguro, execute no terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Criar o banco de dados

Acesse o MySQL e crie o banco:

```sql
CREATE DATABASE clinica_estetica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Criar as tabelas

```bash
pnpm db:push
```

Este comando gera e aplica as migrações automaticamente. As seguintes tabelas serão criadas:

| Tabela | Descrição |
|---|---|
| `users` | Usuários do sistema (login local) |
| `clientes` | Clientes/pacientes da clínica |
| `profissionais` | Profissionais (esteticistas) |
| `servicos` | Serviços oferecidos |
| `profissional_servicos` | Associação entre profissionais e serviços |
| `agendamentos` | Agendamentos de atendimentos |

### 6. Iniciar o servidor de desenvolvimento

```bash
pnpm dev
```

Acesse o sistema em: **http://localhost:3000**

---

## Primeiro acesso

1. Acesse **http://localhost:3000**
2. Clique em **"Entrar no sistema"** ou navegue para **http://localhost:3000/login**
3. Vá na aba **"Criar conta"**
4. Preencha nome, e-mail e senha (mínimo 6 caracteres)
5. Clique em **"Criar conta"** — você será redirecionado automaticamente para o dashboard

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `pnpm dev` | Inicia o servidor de desenvolvimento (hot reload) |
| `pnpm build` | Gera o build de produção |
| `pnpm start` | Inicia o servidor em modo produção (requer build) |
| `pnpm test` | Executa os testes unitários |
| `pnpm db:push` | Gera e aplica as migrações do banco de dados |

---

## Estrutura do projeto

```
clinica_estetica/
├── client/
│   └── src/
│       ├── pages/          ← Telas do sistema (Dashboard, Clientes, etc.)
│       ├── components/     ← Componentes reutilizáveis (DashboardLayout, etc.)
│       ├── _core/hooks/    ← Hook useAuth para estado de autenticação
│       └── const.ts        ← Configurações do frontend (URL de login)
├── server/
│   ├── _core/
│   │   ├── localAuth.ts        ← Autenticação local (JWT + bcrypt)
│   │   ├── localAuthRoutes.ts  ← Rotas POST /api/auth/login e /register
│   │   ├── context.ts          ← Contexto tRPC (lê sessão do cookie)
│   │   └── index.ts            ← Entry point do servidor Express
│   ├── routers.ts          ← Todas as procedures tRPC (CRUD completo)
│   └── db.ts               ← Funções de acesso ao banco de dados
├── drizzle/
│   └── schema.ts           ← Definição das tabelas do banco de dados
└── .env                    ← Variáveis de ambiente (NÃO commitar)
```

---

## Como a autenticação funciona

O sistema usa **autenticação local** com e-mail e senha, sem dependência de serviços externos:

1. **Registro:** `POST /api/auth/login` — a senha é hasheada com `bcryptjs` (10 rounds) antes de salvar no banco.
2. **Login:** `POST /api/auth/register` — compara a senha informada com o hash armazenado. Em caso de sucesso, gera um token JWT assinado com `JWT_SECRET` e salva em um cookie HTTP-only.
3. **Sessão:** A cada requisição ao `/api/trpc`, o servidor lê o cookie, verifica o JWT e injeta o usuário no contexto tRPC.
4. **Logout:** Limpa o cookie de sessão.

---

## Funcionalidades do sistema

- **Dashboard** — Visão geral com estatísticas e agenda do dia
- **Clientes** — CRUD completo com busca por nome, telefone e e-mail
- **Profissionais** — CRUD com campo de cidade e status ativo/inativo
- **Serviços** — Catálogo com nome, descrição, valor e duração
- **Associações** — Vincula profissionais aos serviços que realizam
- **Agendamentos** — Marcação com busca por cliente/profissional/serviço, validação de data passada e conflito de horário

---

## Validações de negócio

| Regra | Descrição |
|---|---|
| Data no passado | Não permite agendar em data/hora anterior ao momento atual |
| Conflito de horário | Não permite dois agendamentos para o mesmo profissional no mesmo horário |
| Campos obrigatórios | Nome do cliente, profissional e serviço são obrigatórios |
| Senha mínima | A senha deve ter ao menos 6 caracteres |
| E-mail único | Não permite dois usuários com o mesmo e-mail |

---

## Solução de problemas

**Erro: `Cannot connect to database`**
Verifique se o MySQL está rodando e se a `DATABASE_URL` no `.env` está correta.

**Erro: `Port 3000 is busy`**
O servidor tentará automaticamente a porta 3001, 3002, etc. Verifique o terminal para ver qual porta foi usada.

**Erro ao executar `pnpm db:push`**
Certifique-se de que o banco de dados `clinica_estetica` foi criado antes de executar o comando.

**Tela de login não redireciona após login**
Limpe os cookies do navegador e tente novamente.
