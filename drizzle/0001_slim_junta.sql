CREATE TABLE `agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`servicoId` int NOT NULL,
	`dataHora` timestamp NOT NULL,
	`duracao` int NOT NULL,
	`status` enum('confirmado','cancelado','concluido') NOT NULL DEFAULT 'confirmado',
	`notas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agendamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(20) NOT NULL,
	`dataNascimento` timestamp,
	`endereco` text,
	`cidade` varchar(100),
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profissionais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`especialidade` varchar(255) NOT NULL,
	`telefone` varchar(20) NOT NULL,
	`email` varchar(320),
	`cidade` varchar(100) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profissionais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profissional_servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profissionalId` int NOT NULL,
	`servicoId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profissional_servicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`valor` decimal(10,2) NOT NULL,
	`duracao` int NOT NULL,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `servicos_id` PRIMARY KEY(`id`)
);
