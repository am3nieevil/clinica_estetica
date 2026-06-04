import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Identificador único do usuário. Para auth local, usa o próprio email como openId. */
  openId: varchar("openId", { length: 320 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de Clientes
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  dataNascimento: timestamp("dataNascimento"),
  rua: varchar("rua", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// Tabela de Profissionais
export const profissionais = mysqlTable("profissionais", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  especialidade: varchar("especialidade", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  rua: varchar("rua", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  uf: varchar("uf", { length: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profissional = typeof profissionais.$inferSelect;
export type InsertProfissional = typeof profissionais.$inferInsert;

// Tabela de Serviços
export const servicos = mysqlTable("servicos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  duracao: int("duracao").notNull(), // em minutos
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Servico = typeof servicos.$inferSelect;
export type InsertServico = typeof servicos.$inferInsert;

// Tabela de Associação entre Profissionais e Serviços
export const profissionalServicos = mysqlTable("profissional_servicos", {
  id: int("id").autoincrement().primaryKey(),
  profissionalId: int("profissionalId").notNull(),
  servicoId: int("servicoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfissionalServico = typeof profissionalServicos.$inferSelect;
export type InsertProfissionalServico = typeof profissionalServicos.$inferInsert;

// Tabela de Agendamentos (sem servicoId — usa tabela agendamento_servicos para múltiplos)
export const agendamentos = mysqlTable("agendamentos", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  dataHora: timestamp("dataHora").notNull(),
  duracao: int("duracao").notNull(), // soma das durações dos serviços, em minutos
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }).notNull(), // soma dos valores dos serviços
  status: mysqlEnum("status", ["confirmado", "cancelado", "concluido"]).default("confirmado").notNull(),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agendamento = typeof agendamentos.$inferSelect;
export type InsertAgendamento = typeof agendamentos.$inferInsert;

// Tabela de Serviços por Agendamento (relação N:N entre agendamentos e serviços)
export const agendamentoServicos = mysqlTable("agendamento_servicos", {
  id: int("id").autoincrement().primaryKey(),
  agendamentoId: int("agendamentoId").notNull(),
  servicoId: int("servicoId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgendamentoServico = typeof agendamentoServicos.$inferSelect;
export type InsertAgendamentoServico = typeof agendamentoServicos.$inferInsert;
