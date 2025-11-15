CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`campaignId` int NOT NULL,
	`userId` int,
	`activityType` enum('email','call','sms','note','task','meeting') NOT NULL,
	`subject` varchar(500),
	`description` text,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`resourceType` varchar(100) NOT NULL,
	`resourceId` int,
	`changes` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `callScripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`leadId` int,
	`scriptName` varchar(255),
	`introduction` text,
	`discoveryQuestions` json,
	`valueProposition` text,
	`productPitch` text,
	`objectionHandling` json,
	`closingStatement` text,
	`isAiGenerated` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `callScripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignLlmConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`modelName` varchar(100) DEFAULT 'gpt-4',
	`temperature` int DEFAULT 70,
	`maxTokens` int DEFAULT 1000,
	`systemPrompt` text,
	`emailTone` enum('professional','casual','friendly','formal','consultative') DEFAULT 'professional',
	`personalizationLevel` enum('low','medium','high') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaignLlmConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `campaignLlmConfig_campaignId_unique` UNIQUE(`campaignId`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','active','paused','completed','archived') NOT NULL DEFAULT 'draft',
	`targetIndustries` json,
	`targetGeographies` json,
	`companySizeMin` int DEFAULT 1,
	`companySizeMax` int DEFAULT 10000,
	`revenueMin` int DEFAULT 0,
	`revenueMax` int DEFAULT 1000000000,
	`targetJobTitles` json,
	`confidenceThreshold` int DEFAULT 70,
	`leadsGenerated` int DEFAULT 0,
	`leadsQualified` int DEFAULT 0,
	`leadsContacted` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`industry` varchar(255),
	`website` varchar(500),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`notes` text,
	`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int NOT NULL,
	`communicationType` enum('email','call','sms') NOT NULL,
	`direction` enum('outbound','inbound') NOT NULL,
	`subject` varchar(500),
	`content` text,
	`status` enum('sent','delivered','opened','clicked','replied','bounced','failed') NOT NULL DEFAULT 'sent',
	`metadata` json,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`repliedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communicationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int,
	`userId` int,
	`templateName` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyTemplate` text NOT NULL,
	`variables` json,
	`isAiGenerated` boolean DEFAULT false,
	`usageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `errorLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`errorType` varchar(255) NOT NULL,
	`errorMessage` text NOT NULL,
	`stackTrace` text,
	`context` json,
	`resolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `errorLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`documentType` enum('pdf','text','transcript','recording','other') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`extractedText` text,
	`summary` text,
	`keyInsights` json,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledgeDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyWebsite` varchar(500),
	`companyIndustry` varchar(255),
	`companySize` int,
	`companyRevenue` int,
	`companyLocation` varchar(255),
	`contactName` varchar(255),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`contactJobTitle` varchar(255),
	`contactLinkedin` varchar(500),
	`confidenceScore` int DEFAULT 0,
	`status` enum('new','contacted','responded','qualified','unqualified','converted','rejected') NOT NULL DEFAULT 'new',
	`sourceUrl` varchar(500),
	`notes` text,
	`lastContactedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productKnowledge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`productName` varchar(255),
	`productDescription` text,
	`keyFeatures` json,
	`benefits` json,
	`useCases` json,
	`pricingInfo` text,
	`targetMarket` text,
	`competitiveAdvantages` json,
	`painPointsAddressed` json,
	`valueProposition` text,
	`salesTalkingPoints` json,
	`commonObjections` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productKnowledge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recruitmentIntelligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`hiringSignals` json,
	`jobPostings` json,
	`growthIndicators` json,
	`employeeCount` int,
	`hiringVelocity` enum('low','medium','high'),
	`techStack` json,
	`fundingInfo` json,
	`confidenceScore` int DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recruitmentIntelligence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scrapedData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`dataType` enum('company_info','product_info','contact_info','job_posting','news','other') NOT NULL,
	`rawData` json,
	`processedData` json,
	`scrapedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scrapedData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `voiceCallSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`campaignId` int NOT NULL,
	`callSid` varchar(255),
	`vapiCallId` varchar(255),
	`phoneNumber` varchar(50),
	`duration` int,
	`status` enum('initiated','ringing','in_progress','completed','failed','no_answer','busy') NOT NULL DEFAULT 'initiated',
	`recordingUrl` varchar(500),
	`transcript` text,
	`sentiment` enum('positive','neutral','negative'),
	`keyTopics` json,
	`nextAction` text,
	`callStartedAt` timestamp,
	`callEndedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `voiceCallSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `voiceCallSessions_callSid_unique` UNIQUE(`callSid`)
);
