CREATE TABLE `workflow_executions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`leadId` int NOT NULL,
	`status` enum('success','failed','skipped') NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`errorMessage` text,
	`metadata` json,
	CONSTRAINT `workflow_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255),
	`triggerType` enum('time_based','status_change','inactivity') NOT NULL,
	`triggerConfig` json NOT NULL,
	`actionType` enum('send_email','make_call','update_status','notify_owner') NOT NULL,
	`actionConfig` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
