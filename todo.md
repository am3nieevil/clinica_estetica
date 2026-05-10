# TODO - Sistema de Agendamento Estético

## Backend / Validações
- [x] Validar que agendamento não pode ser criado em data/hora passada
- [x] Validar conflito de horário por profissional (mesmo profissional, horários sobrepostos)
- [x] Validar que cliente, profissional e serviço existem ao criar agendamento
- [x] Adicionar query de agendamentos com JOIN (trazer nome do cliente, profissional e serviço)
- [x] Adicionar query de agendamentos por data
- [x] Estatísticas para o dashboard (totais de clientes, profissionais, serviços, agendamentos hoje)

## Frontend - Integração com APIs
- [x] Página de Clientes integrada com tRPC (listar, criar, editar, excluir)
- [x] Página de Profissionais integrada com tRPC (listar, criar, editar, excluir) + campo cidade
- [x] Página de Serviços integrada com tRPC (listar, criar, editar, excluir)
- [x] Página de Agendamentos (listagem) com filtros por status e busca
- [x] Página de Novo Agendamento integrada com tRPC (criar com validações)
- [x] Página de Associações integrada com tRPC
- [x] Dashboard com estatísticas reais do banco de dados
- [x] Formulário de agendamento com validação de data futura
- [x] Feedback visual de erros de validação no frontend (toast de erro)
- [x] Indicação visual de agendamentos passados pendentes de conclusão

## Qualidade
- [x] Testes unitários dos routers tRPC (12 testes passando)
- [x] Testes de validação de data passada, conflito de horário, dados inválidos
- [x] Testes de validação de serviço (valor negativo, duração mínima)
- [x] Testes de validação de cliente (nome curto, telefone inválido)
