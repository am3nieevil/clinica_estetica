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
        email: z.string().email("E-mail inválido.").optional().or(z.literal("")).or(z.null()),
        telefone: z.string().regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Telefone inválido. Use o formato (11) 99999-9999."),
        dataNascimento: z.date().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().length(2).optional(),
      }))
      .mutation(async ({ input }) => {
        // Normalizar telefone: somente dígitos para garantir unicidade independente de máscara
        const telefoneLimpo = input.telefone.replace(/\D/g, "");
        // ✅ Validação: telefone único
        if (await db.clienteTelefoneExiste(telefoneLimpo)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um cliente cadastrado com este telefone." });
        }
        // ✅ Validação: e-mail único
        if (input.email && input.email !== "" && await db.clienteEmailExiste(input.email)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um cliente cadastrado com este e-mail." });
        }
        return db.createCliente({ ...input, telefone: telefoneLimpo });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        nome: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")).or(z.null()),
        telefone: z.string().regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Telefone inválido.").optional(),
        dataNascimento: z.date().optional(),
        rua: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().length(2).optional(),
      }))
      .mutation(async ({ input: { id, ...data } }) => {
        const existe = await db.getClienteById(id);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        // Normalizar telefone se fornecido
        if (data.telefone) data.telefone = data.telefone.replace(/\D/g, "");
        // ✅ Validação: telefone único (excluindo o próprio)
        if (data.telefone && await db.clienteTelefoneExiste(data.telefone, id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe outro cliente cadastrado com este telefone." });
        }
        // ✅ Validação: e-mail único (excluindo o próprio)
        if (data.email && data.email !== "" && await db.clienteEmailExiste(data.email, id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe outro cliente cadastrado com este e-mail." });
        }
        return db.updateCliente(id, data);
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getClienteById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        // ✅ Validação: não pode excluir cliente com agendamentos confirmados
        const temAgendamentos = await db.clienteTemAgendamentos(input);
        if (temAgendamentos) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Não é possível excluir este cliente pois ele possui agendamentos confirmados. Cancele ou conclua os agendamentos antes de excluir.",
          });
        }
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
        telefone: z.string().regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Telefone inválido. Use o formato (11) 99999-9999."),
        email: z.string().email("E-mail inválido.").optional().or(z.literal("")).or(z.null()),
        rua: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().length(2).optional(),
        servicoIds: z.array(z.number().int().positive()).optional(),
      }))
      .mutation(async ({ input: { servicoIds, ...profData } }) => {
        // Normalizar telefone: somente dígitos
        profData.telefone = profData.telefone.replace(/\D/g, "");
        // ✅ Validação: telefone único
        if (await db.profissionalTelefoneExiste(profData.telefone)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um profissional cadastrado com este telefone." });
        }
        // ✅ Validação: e-mail único
        if (profData.email && profData.email !== "" && await db.profissionalEmailExiste(profData.email)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um profissional cadastrado com este e-mail." });
        }
        const result = await db.createProfissional(profData);
        // Se vieram serviços, associar ao profissional recém-criado
        if (servicoIds && servicoIds.length > 0 && result) {
          const insertId = (result as any).insertId as number;
          if (insertId) {
            await db.setServicosForProfissional(insertId, servicoIds);
          }
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        nome: z.string().min(2).optional(),
        especialidade: z.string().min(2).optional(),
        telefone: z.string().regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, "Telefone inválido.").optional(),
        email: z.string().email().optional().or(z.literal("")).or(z.null()),
        rua: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().length(2).optional(),
        servicoIds: z.array(z.number().int().positive()).optional(),
      }))
      .mutation(async ({ input: { id, servicoIds, ...data } }) => {
        const existe = await db.getProfissionalById(id);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        // Normalizar telefone se fornecido
        if (data.telefone) data.telefone = data.telefone.replace(/\D/g, "");
        // ✅ Validação: telefone único (excluindo o próprio)
        if (data.telefone && await db.profissionalTelefoneExiste(data.telefone, id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe outro profissional cadastrado com este telefone." });
        }
        // ✅ Validação: e-mail único (excluindo o próprio)
        if (data.email && data.email !== "" && await db.profissionalEmailExiste(data.email, id)) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe outro profissional cadastrado com este e-mail." });
        }
        await db.updateProfissional(id, data);
        // Atualiza as associações de serviços se fornecidas
        if (servicoIds !== undefined) {
          await db.setServicosForProfissional(id, servicoIds);
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        const existe = await db.getProfissionalById(input);
        if (!existe) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        // ✅ Validação: não pode excluir profissional com agendamentos confirmados
        const temAgendamentos = await db.profissionalTemAgendamentos(input);
        if (temAgendamentos) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Não é possível excluir este profissional pois ele possui agendamentos confirmados. Cancele ou conclua os agendamentos antes de excluir.",
          });
        }
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
        // ✅ Validação: não pode excluir serviço com agendamentos confirmados
        const temAgendamentos = await db.servicoTemAgendamentos(input);
        if (temAgendamentos) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Não é possível excluir este serviço pois ele está vinculado a agendamentos confirmados. Cancele ou conclua os agendamentos antes de excluir.",
          });
        }
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
        servicoIds: z.array(z.number().int().positive()).min(1, "Selecione ao menos um serviço."),
        dataHora: z.date(),
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

        // ✅ Validação 2: Cliente e profissional devem existir
        const [cliente, profissional] = await Promise.all([
          db.getClienteById(input.clienteId),
          db.getProfissionalById(input.profissionalId),
        ]);
        if (!cliente) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        if (!profissional) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });

        // ✅ Validação 3: Todos os serviços devem existir
        const servicosData = await Promise.all(input.servicoIds.map((id) => db.getServicoById(id)));
        for (let i = 0; i < servicosData.length; i++) {
          if (!servicosData[i]) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Serviço ID ${input.servicoIds[i]} não encontrado.` });
          }
        }

        // ✅ Validação 4: Profissional deve estar associado a todos os serviços
        const associacoes = await db.getServicosByProfissional(input.profissionalId);
        const servicosAssociadosIds = new Set(associacoes.map((a) => a.servicoId));
        for (let i = 0; i < input.servicoIds.length; i++) {
          if (!servicosAssociadosIds.has(input.servicoIds[i])) {
            const servico = servicosData[i];
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `O profissional ${profissional.nome} não está habilitado para realizar o serviço "${servico?.nome}". Edite o profissional para adicionar este serviço.`,
            });
          }
        }

        // ✅ Calcula duração e valor total
        const duracaoTotal = servicosData.reduce((sum, s) => sum + (s?.duracao ?? 0), 0);
        const valorTotal = servicosData.reduce((sum, s) => sum + parseFloat(s?.valor ?? "0"), 0);

        // ✅ Validação 5: Verificar conflito de horário para o profissional
        const temConflitoProfissional = await db.verificarConflitoHorario(
          input.profissionalId,
          input.dataHora,
          duracaoTotal
        );
        if (temConflitoProfissional) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `O profissional ${profissional.nome} já possui um agendamento neste horário. Por favor, escolha outro horário.`,
          });
        }

        // ✅ Validação 6: Verificar conflito de horário para o cliente
        const temConflitoCliente = await db.verificarConflitoHorarioCliente(
          input.clienteId,
          input.dataHora,
          duracaoTotal
        );
        if (temConflitoCliente) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `O cliente ${cliente.nome} já possui um agendamento neste horário. Por favor, escolha outro horário.`,
          });
        }

        // Cria o agendamento
        const result = await db.createAgendamento({
          clienteId: input.clienteId,
          profissionalId: input.profissionalId,
          dataHora: input.dataHora,
          duracao: duracaoTotal,
          valorTotal: valorTotal.toFixed(2),
          notas: input.notas,
        });

        // Associa os serviços ao agendamento
        const agId = (result as unknown as { insertId: number } | undefined)?.insertId;
        if (agId) {
          await db.addServicosToAgendamento(agId, input.servicoIds);
        }

        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        clienteId: z.number().int().positive().optional(),
        profissionalId: z.number().int().positive().optional(),
        dataHora: z.date().optional(),
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

          // ✅ Validação: Verificar conflito de horário ao reagendar (profissional)
          const profId = data.profissionalId ?? agExistente.profissionalId;
          const dur = agExistente.duracao;
          const temConflitoProfUpdate = await db.verificarConflitoHorario(profId, data.dataHora, dur, id);
          if (temConflitoProfUpdate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "O profissional já possui um agendamento neste horário. Por favor, escolha outro horário.",
            });
          }

          // ✅ Validação: Verificar conflito de horário ao reagendar (cliente)
          const cliId = data.clienteId ?? agExistente.clienteId;
          const temConflitoCliUpdate = await db.verificarConflitoHorarioCliente(cliId, data.dataHora, dur, id);
          if (temConflitoCliUpdate) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "O cliente já possui um agendamento neste horário. Por favor, escolha outro horário.",
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

    setAll: protectedProcedure
      .input(z.object({
        profissionalId: z.number().int().positive(),
        servicoIds: z.array(z.number().int().positive()),
      }))
      .mutation(async ({ input }) => {
        const prof = await db.getProfissionalById(input.profissionalId);
        if (!prof) throw new TRPCError({ code: "NOT_FOUND", message: "Profissional não encontrado." });
        return db.setServicosForProfissional(input.profissionalId, input.servicoIds);
      }),

    // Retorna profissionais habilitados para TODOS os serviços informados
    getByServicos: protectedProcedure
      .input(z.array(z.number().int().positive()).min(1))
      .query(({ input }) => db.getProfissionaisByServicos(input)),
  }),
});

export type AppRouter = typeof appRouter;
