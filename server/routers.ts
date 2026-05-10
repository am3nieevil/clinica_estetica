import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── CLIENTES ───────────────────────────────────────────────────────────────
  clientes: router({
    list: protectedProcedure.query(() => db.getAllClientes()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        const cliente = await db.getClienteById(input);
        if (!cliente) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        return cliente;
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
        email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
        telefone: z.string().min(8, "Telefone inválido."),
        dataNascimento: z.date().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
      }))
      .mutation(({ input }) => db.createCliente(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        nome: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
        telefone: z.string().min(8).optional(),
        dataNascimento: z.date().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
      }))
      .mutation(async ({ input: { id, ...data } }) => {
        const existe = await db.getClienteById(id);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        return db.updateCliente(id, data);
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getClienteById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        return db.deleteCliente(input);
      }),
  }),

  // ─── PROFISSIONAIS ──────────────────────────────────────────────────────────
  profissionais: router({
    list: protectedProcedure.query(() => db.getAllProfissionais()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        const prof = await db.getProfissionalById(input);
        if (!prof) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        return prof;
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
        especialidade: z.string().min(2, "Especialidade é obrigatória."),
        telefone: z.string().min(8, "Telefone inválido."),
        email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
        cidade: z.string().min(2, "Cidade é obrigatória."),
      }))
      .mutation(({ input }) => db.createProfissional(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        nome: z.string().min(2).optional(),
        especialidade: z.string().min(2).optional(),
        telefone: z.string().min(8).optional(),
        email: z.string().email().optional().or(z.literal("")),
        cidade: z.string().min(2).optional(),
      }))
      .mutation(async ({ input: { id, ...data } }) => {
        const existe = await db.getProfissionalById(id);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        return db.updateProfissional(id, data);
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getProfissionalById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        return db.deleteProfissional(input);
      }),
  }),

  // ─── SERVIÇOS ───────────────────────────────────────────────────────────────
  servicos: router({
    list: protectedProcedure.query(() => db.getAllServicos()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        const servico = await db.getServicoById(input);
        if (!servico) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        return servico;
      }),

    create: protectedProcedure
      .input(z.object({
        nome: z.string().min(2, "Nome do serviço é obrigatório."),
        descricao: z.string().optional(),
        valor: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser positivo."),
        duracao: z.number().int().min(5, "Duração mínima é 5 minutos.").max(480, "Duração máxima é 8 horas."),
      }))
      .mutation(({ input }) => db.createServico(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        nome: z.string().min(2).optional(),
        descricao: z.string().optional(),
        valor: z.string().refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0).optional(),
        duracao: z.number().int().min(5).max(480).optional(),
      }))
      .mutation(async ({ input: { id, ...data } }) => {
        const existe = await db.getServicoById(id);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        return db.updateServico(id, data);
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getServicoById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        return db.deleteServico(input);
      }),
  }),

  // ─── AGENDAMENTOS ───────────────────────────────────────────────────────────
  agendamentos: router({
    list: protectedProcedure.query(() => db.getAllAgendamentosCompletos()),

    getById: protectedProcedure
      .input(z.number().int().positive())
      .query(async ({ input }) => {
        const ag = await db.getAgendamentoById(input);
        if (!ag) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado." });
        return ag;
      }),

    create: protectedProcedure
      .input(z.object({
        clienteId: z.number().int().positive(),
        profissionalId: z.number().int().positive(),
        servicoId: z.number().int().positive(),
        dataHora: z.date(),
        duracao: z.number().int().min(5),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // ✅ Validação 1: Data/hora não pode ser no passado
        const agora = new Date();
        if (input.dataHora <= agora) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível agendar em uma data e horário passados. Por favor, selecione um horário futuro.",
          });
        }

        // ✅ Validação 2: Cliente, profissional e serviço devem existir
        const [cliente, profissional, servico] = await Promise.all([
          db.getClienteById(input.clienteId),
          db.getProfissionalById(input.profissionalId),
          db.getServicoById(input.servicoId),
        ]);
        if (!cliente) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        if (!profissional) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        if (!servico) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });

        // ✅ Validação 3: Verificar conflito de horário para o profissional
        const temConflito = await db.verificarConflitoHorario(
          input.profissionalId,
          input.dataHora,
          input.duracao
        );
        if (temConflito) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `O profissional ${profissional.nome} já possui um agendamento neste horário. Por favor, escolha outro horário.`,
          });
        }

        return db.createAgendamento(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        clienteId: z.number().int().positive().optional(),
        profissionalId: z.number().int().positive().optional(),
        servicoId: z.number().int().positive().optional(),
        dataHora: z.date().optional(),
        duracao: z.number().int().min(5).optional(),
        status: z.enum(["confirmado", "cancelado", "concluido"]).optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input: { id, ...data } }) => {
        const agExistente = await db.getAgendamentoById(id);
        if (!agExistente) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado." });

        // ✅ Validação: Se alterar data/hora, não pode ser no passado
        if (data.dataHora) {
          const agora = new Date();
          if (data.dataHora <= agora) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Não é possível reagendar para uma data e horário passados.",
            });
          }

          // ✅ Validação: Verificar conflito de horário ao reagendar
          const profId = data.profissionalId ?? agExistente.profissionalId;
          const dur = data.duracao ?? agExistente.duracao;
          const temConflito = await db.verificarConflitoHorario(profId, data.dataHora, dur, id);
          if (temConflito) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "O profissional já possui um agendamento neste horário. Por favor, escolha outro horário.",
            });
          }
        }

        return db.updateAgendamento(id, data);
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getAgendamentoById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado." });
        return db.deleteAgendamento(input);
      }),

    dashboard: protectedProcedure.query(() => db.getDashboardStats()),
  }),

  // ─── ASSOCIAÇÕES PROFISSIONAL-SERVIÇO ───────────────────────────────────────
  profissionalServicos: router({
    getByProfissional: protectedProcedure
      .input(z.number().int().positive())
      .query(({ input }) => db.getServicosByProfissional(input)),

    associar: protectedProcedure
      .input(z.object({
        profissionalId: z.number().int().positive(),
        servicoId: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        const [prof, serv] = await Promise.all([
          db.getProfissionalById(input.profissionalId),
          db.getServicoById(input.servicoId),
        ]);
        if (!prof) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        if (!serv) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        return db.associarServicoToProfissional(input.profissionalId, input.servicoId);
      }),

    remover: protectedProcedure
      .input(z.object({
        profissionalId: z.number().int().positive(),
        servicoId: z.number().int().positive(),
      }))
      .mutation(({ input }) => db.removerServicoFromProfissional(input.profissionalId, input.servicoId)),
  }),
});

export type AppRouter = typeof appRouter;
