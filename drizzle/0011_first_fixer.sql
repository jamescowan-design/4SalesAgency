CREATE TABLE `exportLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('hubspot','salesforce','pipedrive','csv') NOT NULL,
	`exportType` enum('single','bulk') NOT NULL,
	`leadIds` json NOT NULL,
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`recordsExported` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`fieldMapping` json,
	`exportedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `exportLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `exportLogs` ADD CONSTRAINT `exportLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;