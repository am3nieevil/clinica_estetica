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
- [x] Testes unitários dos routers tRPC (13 testes passando)
- [x] Testes de validação de data passada, conflito de horário, dados inválidos
- [x] Testes de validação de serviço (valor negativo, duração mínima)
- [x] Testes de validação de cliente (nome curto, telefone inválido)
- [x] Validação: profissional não pode realizar serviço ao qual não está associado (backend + frontend)
- [x] Frontend: filtrar serviços pelo profissional selecionado no Step 3 do agendamento
- [x] Frontend: resetar serviço selecionado ao trocar de profissional no formulário
- [x] Teste unitário para validação de associação profissional-serviço

## Melhorias v2
- [x] Banco: criar tabela agendamento_servicos para múltiplos serviços por agendamento
- [x] Banco: remover campo servicoId da tabela agendamentos
- [x] Backend: router de profissional retorna serviços associados junto (getById com serviços)
- [x] Backend: router de agendamento aceita array de servicoIds e calcula duracao/valor total
- [x] Backend: validação de associação atualizada para múltiplos serviços
- [x] Frontend: formulário de profissional com seção de serviços (checkboxes embutidos)
- [x] Frontend: formulário de agendamento com seleção múltipla de serviços, valor e tempo totais
- [x] Frontend: listagem de agendamentos mostra múltiplos serviços
- [x] Frontend: remover página de Associações e item do menu
- [x] Testes: atualizar testes para múltiplos serviços (14 testes passando)

## Melhorias v3
- [x] Backend: endpoint para buscar profissionais habilitados para um conjunto de serviços
- [x] Frontend: reordenar agendamento — Step 2 vira Serviços, Step 3 vira Profissional (filtrado)
- [x] Frontend: Step 3 mostra apenas profissionais que realizam TODOS os serviços selecionados
- [x] Testes: atualizar testes para novo fluxo (16 testes passando)

## Melhorias v4
- [x] Banco: separar endereco em rua, numero, bairro nos clientes
- [x] Banco: separar endereco em rua, numero, bairro nos profissionais
- [x] Backend: atualizar routers/db para novos campos de endereço
- [x] Frontend: componente CidadeSelect com busca (UF + cidade) para clientes e profissionais
- [x] Frontend: formulário de Clientes com rua/numero/bairro e CidadeSelect
- [x] Frontend: validação de telefone real (formato brasileiro) em Clientes
- [x] Frontend: validação de e-mail real em Clientes
- [x] Frontend: formulário de Profissionais com rua/numero/bairro e CidadeSelect
- [x] Frontend: validação de telefone real em Profissionais
- [x] Frontend: validação de e-mail real em Profissionais
- [x] Testes: atualizar testes para novas validações (18 testes passando)

## Correções v5
- [x] Backend: validar conflito de horário por cliente (mesmo cliente não pode ter dois agendamentos sobrepostos)
- [x] Backend: bloquear exclusão de cliente que possua agendamentos vinculados
- [x] Backend: bloquear exclusão de profissional que possua agendamentos vinculados
- [x] Testes: cobrir conflito de horário por cliente
- [x] Testes: cobrir bloqueio de exclusão de cliente com agendamentos
- [x] Testes: cobrir bloqueio de exclusão de profissional com agendamentos
- [x] Documentação: adicionar RN7 e RN8 nas regras de negócio
- [x] Documentação: atualizar descrição dos RF1, RF2 e RF5

## Correções v6
- [x] Banco: adicionar constraint UNIQUE em clientes.telefone
- [x] Banco: adicionar constraint UNIQUE em clientes.email
- [x] Banco: adicionar constraint UNIQUE em profissionais.telefone
- [x] Banco: adicionar constraint UNIQUE em profissionais.email
- [x] Backend: validar duplicidade de telefone/e-mail ao criar cliente
- [x] Backend: validar duplicidade de telefone/e-mail ao editar cliente
- [x] Backend: validar duplicidade de telefone/e-mail ao criar profissional
- [x] Backend: validar duplicidade de telefone/e-mail ao editar profissional
- [x] Testes: cobrir tentativa de cadastro com telefone duplicado
- [x] Testes: cobrir tentativa de cadastro com e-mail duplicado
- [x] Documentação: adicionar RN9 (unicidade de telefone e e-mail)

## Melhorias v7
- [x] Frontend: modal de visualização somente leitura em Clientes (botão "Ver")
- [x] Frontend: modal de visualização somente leitura em Profissionais (botão "Ver")
- [x] Frontend: modal de visualização somente leitura em Serviços (botão "Ver")
- [x] Documentação: atualizar fluxo dos casos de uso 5.2.1, 5.2.4 e 5.2.5 com passo de visualização
