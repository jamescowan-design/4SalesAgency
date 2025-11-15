CREATE TABLE `api_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`section` varchar(100) NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_settings_id` PRIMARY KEY(`id`)
);
