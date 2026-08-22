CREATE TABLE `fieldSessionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(96) NOT NULL,
	`sequence` int NOT NULL,
	`eventType` varchar(96) NOT NULL,
	`origin` varchar(32) NOT NULL,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fieldSessionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fieldSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(96) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'open',
	`eventCount` int NOT NULL DEFAULT 0,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `fieldSessions_sessionId_unique` UNIQUE(`sessionId`)
);
