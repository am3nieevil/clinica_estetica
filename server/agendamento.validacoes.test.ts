import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock do módulo db para isolar os testes
vi.mock("./db", () => ({
  getAllClientes: vi.fn().mockResolvedValue([]),
  getAllProfissionais: vi.fn().mockResolvedValue([]),
  getAllServicos: vi.fn().mockResolvedValue([]),
  getAllAgendamentos: vi.fn().mockResolvedValue([]),
  getAllAgendamentosCompletos: vi.fn().mockResolvedValue([]),
  getClienteById: vi.fn(),
  getProfissionalById: vi.fn(),
  getServicoById: vi.fn(),
  getAgendamentoById: vi.fn(),
  createAgendamento: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateAgendamento: vi.fn().mockResolvedValue({}),
  deleteAgendamento: vi.fn().mockResolvedValue({}),
  createCliente: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateCliente: vi.fn().mockResolvedValue({}),
  deleteCliente: vi.fn().mockResolvedValue({}),
  createProfissional: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateProfissional: vi.fn().mockResolvedValue({}),
  deleteProfissional: vi.fn().mockResolvedValue({}),
  createServico: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateServico: vi.fn().mockResolvedValue({}),
  deleteServico: vi.fn().mockResolvedValue({}),
  verificarConflitoHorario: vi.fn().mockResolvedValue(false),
  getServicosByProfissional: vi.fn().mockResolvedValue([]),
  associarServicoToProfissional: vi.fn().mockResolvedValue({}),
  removerServicoFromProfissional: vi.fn().mockResolvedValue({}),
  getDashboardStats: vi.fn().mockResolvedValue({ totalClientes: 0, totalProfissionais: 0, totalServicos: 0, agendamentosHoje: 0 }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

import * as db from "./db";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Usuário Teste",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Validações de Agendamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve rejeitar agendamento com data/hora no passado", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const dataPassada = new Date();
    dataPassada.setHours(dataPassada.getHours() - 1); // 1 hora atrás

    await expect(
      caller.agendamentos.create({
        clienteId: 1,
        profissionalId: 1,
        servicoId: 1,
        dataHora: dataPassada,
        duracao: 60,
      })
    ).rejects.toThrow("Não é possível agendar em uma data e horário passados");
  });

  it("deve rejeitar agendamento com data/hora igual ao momento atual", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const agora = new Date();

    await expect(
      caller.agendamentos.create({
        clienteId: 1,
        profissionalId: 1,
        servicoId: 1,
        dataHora: agora,
        duracao: 60,
      })
    ).rejects.toThrow("Não é possível agendar em uma data e horário passados");
  });

  it("deve rejeitar agendamento quando cliente não existe", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(undefined);
    vi.mocked(db.getProfissionalById).mockResolvedValue(undefined);
    vi.mocked(db.getServicoById).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    await expect(
      caller.agendamentos.create({
        clienteId: 999,
        profissionalId: 1,
        servicoId: 1,
        dataHora: dataFutura,
        duracao: 60,
      })
    ).rejects.toThrow("Cliente não encontrado");
  });

  it("deve rejeitar agendamento quando há conflito de horário", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue({
      id: 1, nome: "João", telefone: "11999999999", email: null,
      dataNascimento: null, endereco: null, cidade: null,
      ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.getProfissionalById).mockResolvedValue({
      id: 1, nome: "Ana", especialidade: "Estética", telefone: "11888888888",
      email: null, cidade: "São Paulo", ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.getServicoById).mockResolvedValue({
      id: 1, nome: "Limpeza de Pele", descricao: null, valor: "150.00",
      duracao: 60, ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.verificarConflitoHorario).mockResolvedValue(true);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    await expect(
      caller.agendamentos.create({
        clienteId: 1,
        profissionalId: 1,
        servicoId: 1,
        dataHora: dataFutura,
        duracao: 60,
      })
    ).rejects.toThrow("já possui um agendamento neste horário");
  });

  it("deve criar agendamento com sucesso quando todos os dados são válidos", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue({
      id: 1, nome: "Maria", telefone: "11999999999", email: null,
      dataNascimento: null, endereco: null, cidade: null,
      ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.getProfissionalById).mockResolvedValue({
      id: 1, nome: "Carla", especialidade: "Estética", telefone: "11888888888",
      email: null, cidade: "Rio de Janeiro", ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.getServicoById).mockResolvedValue({
      id: 1, nome: "Massagem", descricao: null, valor: "200.00",
      duracao: 90, ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.verificarConflitoHorario).mockResolvedValue(false);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 2);

    const resultado = await caller.agendamentos.create({
      clienteId: 1,
      profissionalId: 1,
      servicoId: 1,
      dataHora: dataFutura,
      duracao: 90,
    });

    expect(resultado).toBeDefined();
    expect(db.createAgendamento).toHaveBeenCalledOnce();
  });
});

describe("Validações de Serviço", () => {
  it("deve rejeitar serviço com valor negativo ou zero", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.servicos.create({
        nome: "Serviço Inválido",
        valor: "-50",
        duracao: 60,
      })
    ).rejects.toThrow();
  });

  it("deve rejeitar serviço com duração menor que 5 minutos", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.servicos.create({
        nome: "Serviço Rápido",
        valor: "50",
        duracao: 3,
      })
    ).rejects.toThrow();
  });

  it("deve criar serviço com sucesso quando dados são válidos", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const resultado = await caller.servicos.create({
      nome: "Limpeza de Pele",
      descricao: "Procedimento completo",
      valor: "150",
      duracao: 60,
    });

    expect(resultado).toBeDefined();
    expect(db.createServico).toHaveBeenCalledOnce();
  });
});

describe("Validações de Cliente", () => {
  it("deve rejeitar cliente com nome muito curto", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.clientes.create({
        nome: "A",
        telefone: "11999999999",
      })
    ).rejects.toThrow();
  });

  it("deve rejeitar cliente com telefone inválido", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    await expect(
      caller.clientes.create({
        nome: "João Silva",
        telefone: "123",
      })
    ).rejects.toThrow();
  });

  it("deve criar cliente com sucesso quando dados são válidos", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const resultado = await caller.clientes.create({
      nome: "Maria Oliveira",
      telefone: "11999999999",
      email: "maria@email.com",
    });

    expect(resultado).toBeDefined();
    expect(db.createCliente).toHaveBeenCalledOnce();
  });
});
