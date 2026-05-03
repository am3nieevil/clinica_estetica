import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, InsertCliente, profissionais, InsertProfissional, servicos, InsertServico, agendamentos, InsertAgendamento, profissionalServicos } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Queries para Clientes
export async function getAllClientes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clientes).where(eq(clientes.ativo, true));
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(clientes).values(data);
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(clientes).set({ ativo: false }).where(eq(clientes.id, id));
}

// Queries para Profissionais
export async function getAllProfissionais() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(profissionais).where(eq(profissionais.ativo, true));
}

export async function getProfissionalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profissionais).where(eq(profissionais.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProfissional(data: InsertProfissional) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(profissionais).values(data);
}

export async function updateProfissional(id: number, data: Partial<InsertProfissional>) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(profissionais).set(data).where(eq(profissionais.id, id));
}

export async function deleteProfissional(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(profissionais).set({ ativo: false }).where(eq(profissionais.id, id));
}

// Queries para Serviços
export async function getAllServicos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(servicos).where(eq(servicos.ativo, true));
}

export async function getServicoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(servicos).where(eq(servicos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createServico(data: InsertServico) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(servicos).values(data);
}

export async function updateServico(id: number, data: Partial<InsertServico>) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(servicos).set(data).where(eq(servicos.id, id));
}

export async function deleteServico(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(servicos).set({ ativo: false }).where(eq(servicos.id, id));
}

// Queries para Agendamentos
export async function getAllAgendamentos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agendamentos);
}

export async function getAgendamentoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agendamentos).where(eq(agendamentos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAgendamento(data: InsertAgendamento) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(agendamentos).values(data);
}

export async function updateAgendamento(id: number, data: Partial<InsertAgendamento>) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.update(agendamentos).set(data).where(eq(agendamentos.id, id));
}

export async function deleteAgendamento(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.delete(agendamentos).where(eq(agendamentos.id, id));
}

// Queries para Associações Profissional-Serviço
export async function getServicosByProfissional(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(profissionalServicos).where(eq(profissionalServicos.profissionalId, profissionalId));
}

export async function associarServicoToProfissional(profissionalId: number, servicoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.insert(profissionalServicos).values({ profissionalId, servicoId });
}

export async function removerServicoFromProfissional(profissionalId: number, servicoId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return await db.delete(profissionalServicos).where(
    and(eq(profissionalServicos.profissionalId, profissionalId), eq(profissionalServicos.servicoId, servicoId))
  );
}
