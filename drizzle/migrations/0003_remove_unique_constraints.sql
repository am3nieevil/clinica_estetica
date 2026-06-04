-- Migration: Remove UNIQUE constraints from email/telefone in clientes and profissionais
-- Reason: Soft-delete (ativo=false) conflita com UNIQUE constraints.
-- A unicidade agora é validada apenas no backend entre registros ativos.

ALTER TABLE `clientes` DROP INDEX `uq_clientes_telefone`;
ALTER TABLE `clientes` DROP INDEX `uq_clientes_email`;
ALTER TABLE `profissionais` DROP INDEX `uq_profissionais_telefone`;
ALTER TABLE `profissionais` DROP INDEX `uq_profissionais_email`;
