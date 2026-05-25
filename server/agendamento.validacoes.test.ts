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
  setServicosForProfissional: vi.fn().mockResolvedValue({}),
  createServico: vi.fn().mockResolvedValue({ insertId: 1 }),
  updateServico: vi.fn().mockResolvedValue({}),
  deleteServico: vi.fn().mockResolvedValue({}),
  verificarConflitoHorario: vi.fn().mockResolvedValue(false),
  getServicosByProfissional: vi.fn().mockResolvedValue([]),
  associarServicoToProfissional: vi.fn().mockResolvedValue({}),
  removerServicoFromProfissional: vi.fn().mockResolvedValue({}),
  addServicosToAgendamento: vi.fn().mockResolvedValue({}),
  removeServicosFromAgendamento: vi.fn().mockResolvedValue({}),
  getProfissionaisByServicos: vi.fn().mockResolvedValue([]),
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

// Helpers para mocks reutilizáveis
const mockCliente = {
  id: 1, nome: "João Silva", telefone: "11999999999", email: null,
  dataNascimento: null, endereco: null, cidade: null,
  ativo: true, createdAt: new Date(), updatedAt: new Date(),
};

const mockProfissional = {
  id: 1, nome: "Ana Souza", especialidade: "Estética", telefone: "11888888888",
  email: null, cidade: "São Paulo", ativo: true, createdAt: new Date(), updatedAt: new Date(),
};

const mockServico1 = {
  id: 1, nome: "Limpeza de Pele", descricao: null, valor: "150.00",
  duracao: 60, ativo: true, createdAt: new Date(), updatedAt: new Date(),
};

const mockServico2 = {
  id: 2, nome: "Cílios", descricao: null, valor: "120.00",
  duracao: 45, ativo: true, createdAt: new Date(), updatedAt: new Date(),
};

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
        servicoIds: [1],
        dataHora: dataPassada,
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
        servicoIds: [1],
        dataHora: agora,
      })
    ).rejects.toThrow("Não é possível agendar em uma data e horário passados");
  });

  it("deve rejeitar agendamento quando cliente não existe", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(undefined);
    vi.mocked(db.getProfissionalById).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    await expect(
      caller.agendamentos.create({
        clienteId: 999,
        profissionalId: 1,
        servicoIds: [1],
        dataHora: dataFutura,
      })
    ).rejects.toThrow("Cliente não encontrado");
  });

  it("deve rejeitar agendamento quando há conflito de horário", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(mockCliente);
    vi.mocked(db.getProfissionalById).mockResolvedValue(mockProfissional);
    vi.mocked(db.getServicoById).mockResolvedValue(mockServico1);
    // Profissional está associado ao serviço 1
    vi.mocked(db.getServicosByProfissional).mockResolvedValue([{ id: 1, profissionalId: 1, servicoId: 1, createdAt: new Date() }]);
    vi.mocked(db.verificarConflitoHorario).mockResolvedValue(true);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    await expect(
      caller.agendamentos.create({
        clienteId: 1,
        profissionalId: 1,
        servicoIds: [1],
        dataHora: dataFutura,
      })
    ).rejects.toThrow("já possui um agendamento neste horário");
  });

  it("deve rejeitar agendamento quando profissional não está associado ao serviço", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(mockCliente);
    vi.mocked(db.getProfissionalById).mockResolvedValue(mockProfissional);
    // Serviço 2 (Botox) existe mas profissional só tem serviço 1 associado
    vi.mocked(db.getServicoById).mockResolvedValue({
      id: 2, nome: "Botox", descricao: null, valor: "500.00",
      duracao: 30, ativo: true, createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(db.getServicosByProfissional).mockResolvedValue([{ id: 1, profissionalId: 1, servicoId: 1, createdAt: new Date() }]);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 1);

    await expect(
      caller.agendamentos.create({
        clienteId: 1,
        profissionalId: 1,
        servicoIds: [2],
        dataHora: dataFutura,
      })
    ).rejects.toThrow("não está habilitado para realizar o serviço");
  });

  it("deve criar agendamento com um único serviço com sucesso", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(mockCliente);
    vi.mocked(db.getProfissionalById).mockResolvedValue(mockProfissional);
    vi.mocked(db.getServicoById).mockResolvedValue(mockServico1);
    vi.mocked(db.getServicosByProfissional).mockResolvedValue([{ id: 1, profissionalId: 1, servicoId: 1, createdAt: new Date() }]);
    vi.mocked(db.verificarConflitoHorario).mockResolvedValue(false);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 2);

    const resultado = await caller.agendamentos.create({
      clienteId: 1,
      profissionalId: 1,
      servicoIds: [1],
      dataHora: dataFutura,
    });

    expect(resultado).toBeDefined();
    expect(db.createAgendamento).toHaveBeenCalledOnce();
    // Verifica que foi chamado com duração e valor corretos (1 serviço: 60min, R$150)
    expect(db.createAgendamento).toHaveBeenCalledWith(
      expect.objectContaining({ duracao: 60, valorTotal: "150.00" })
    );
  });

  it("deve criar agendamento com múltiplos serviços somando duração e valor", async () => {
    vi.mocked(db.getClienteById).mockResolvedValue(mockCliente);
    vi.mocked(db.getProfissionalById).mockResolvedValue(mockProfissional);
    // getServicoById chamado para cada serviço
    vi.mocked(db.getServicoById)
      .mockResolvedValueOnce(mockServico1)  // id=1: 60min, R$150
      .mockResolvedValueOnce(mockServico2); // id=2: 45min, R$120
    vi.mocked(db.getServicosByProfissional).mockResolvedValue([
      { id: 1, profissionalId: 1, servicoId: 1, createdAt: new Date() },
      { id: 2, profissionalId: 1, servicoId: 2, createdAt: new Date() },
    ]);
    vi.mocked(db.verificarConflitoHorario).mockResolvedValue(false);

    const caller = appRouter.createCaller(createAuthContext());
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 2);

    const resultado = await caller.agendamentos.create({
      clienteId: 1,
      profissionalId: 1,
      servicoIds: [1, 2],
      dataHora: dataFutura,
    });

    expect(resultado).toBeDefined();
    expect(db.createAgendamento).toHaveBeenCalledOnce();
    // Verifica que foi chamado com duração total (60+45=105min) e valor total (150+120=270)
    expect(db.createAgendamento).toHaveBeenCalledWith(
      expect.objectContaining({ duracao: 105, valorTotal: "270.00" })
    );
    // Verifica que os serviços foram associados ao agendamento
    expect(db.addServicosToAgendamento).toHaveBeenCalledWith(1, [1, 2]);
  });
});

describe("Endpoint getByServicos", () => {
  it("deve retornar profissionais habilitados para os serviços informados", async () => {
    vi.mocked(db.getProfissionaisByServicos).mockResolvedValue([mockProfissional]);

    const caller = appRouter.createCaller(createAuthContext());
    const resultado = await caller.profissionalServicos.getByServicos([1, 2]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].nome).toBe("Ana Souza");
    expect(db.getProfissionaisByServicos).toHaveBeenCalledWith([1, 2]);
  });

  it("deve retornar lista vazia quando nenhum profissional é habilitado para todos os serviços", async () => {
    vi.mocked(db.getProfissionaisByServicos).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAuthContext());
    const resultado = await caller.profissionalServicos.getByServicos([1, 2, 3]);

    expect(resultado).toHaveLength(0);
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
