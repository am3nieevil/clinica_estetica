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
      return {
        success: true,
      } as const;
    }),
  }),

  // Routers para Clientes
  clientes: router({
    list: protectedProcedure.query(() => db.getAllClientes()),
    getById: protectedProcedure.input(z.number()).query(({ input }) => db.getClienteById(input)),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        email: z.string().optional(),
        telefone: z.string(),
        dataNascimento: z.date().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
      }))
      .mutation(({ input }) => db.createCliente(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
        dataNascimento: z.date().optional(),
        endereco: z.string().optional(),
        cidade: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => db.updateCliente(id, data)),
    delete: protectedProcedure.input(z.number()).mutation(({ input }) => db.deleteCliente(input)),
  }),

  // Routers para Profissionais
  profissionais: router({
    list: protectedProcedure.query(() => db.getAllProfissionais()),
    getById: protectedProcedure.input(z.number()).query(({ input }) => db.getProfissionalById(input)),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        especialidade: z.string(),
        telefone: z.string(),
        email: z.string().optional(),
        cidade: z.string(),
      }))
      .mutation(({ input }) => db.createProfissional(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        especialidade: z.string().optional(),
        telefone: z.string().optional(),
        email: z.string().optional(),
        cidade: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => db.updateProfissional(id, data)),
    delete: protectedProcedure.input(z.number()).mutation(({ input }) => db.deleteProfissional(input)),
  }),

  // Routers para Serviços
  servicos: router({
    list: protectedProcedure.query(() => db.getAllServicos()),
    getById: protectedProcedure.input(z.number()).query(({ input }) => db.getServicoById(input)),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        descricao: z.string().optional(),
        valor: z.string(),
        duracao: z.number(),
      }))
      .mutation(({ input }) => db.createServico(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        valor: z.string().optional(),
        duracao: z.number().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => db.updateServico(id, data)),
    delete: protectedProcedure.input(z.number()).mutation(({ input }) => db.deleteServico(input)),
  }),

  // Routers para Agendamentos
  agendamentos: router({
    list: protectedProcedure.query(() => db.getAllAgendamentos()),
    getById: protectedProcedure.input(z.number()).query(({ input }) => db.getAgendamentoById(input)),
    create: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        profissionalId: z.number(),
        servicoId: z.number(),
        dataHora: z.date(),
        duracao: z.number(),
        notas: z.string().optional(),
      }))
      .mutation(({ input }) => db.createAgendamento(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clienteId: z.number().optional(),
        profissionalId: z.number().optional(),
        servicoId: z.number().optional(),
        dataHora: z.date().optional(),
        duracao: z.number().optional(),
        status: z.enum(["confirmado", "cancelado", "concluido"]).optional(),
        notas: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => db.updateAgendamento(id, data)),
    delete: protectedProcedure.input(z.number()).mutation(({ input }) => db.deleteAgendamento(input)),
  }),

  // Routers para Associações Profissional-Serviço
  profissionalServicos: router({
    getByProfissional: protectedProcedure.input(z.number()).query(({ input }) => db.getServicosByProfissional(input)),
    associar: protectedProcedure
      .input(z.object({
        profissionalId: z.number(),
        servicoId: z.number(),
      }))
      .mutation(({ input }) => db.associarServicoToProfissional(input.profissionalId, input.servicoId)),
    remover: protectedProcedure
      .input(z.object({
        profissionalId: z.number(),
        servicoId: z.number(),
      }))
      .mutation(({ input }) => db.removerServicoFromProfissional(input.profissionalId, input.servicoId)),
  }),
});

export type AppRouter = typeof appRouter;
