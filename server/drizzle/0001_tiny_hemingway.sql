CREATE TABLE `tickets` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`status` enum('OPEN','TRANSFERRED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`department` enum('SALES','SUPPORT','FINANCIAL','GENERAL'),
	`summary` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`ticket_id` varchar(36) NOT NULL,
	`role` enum('user','model','system') NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_ticket_id_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ticket_user_idx` ON `tickets` (`user_id`);--> statement-breakpoint
CREATE INDEX `ticket_status_idx` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `message_ticket_idx` ON `messages` (`ticket_id`);