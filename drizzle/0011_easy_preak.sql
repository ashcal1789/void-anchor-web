CREATE TABLE `homePulseEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`browserSessionId` varchar(96) NOT NULL,
	`pulseText` text NOT NULL,
	`gravityBefore` text NOT NULL,
	`gravityAfter` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homePulseEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `homeThoughtEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`browserSessionId` varchar(96) NOT NULL,
	`localThoughtId` varchar(96) NOT NULL,
	`thoughtText` text NOT NULL,
	`sourcePole` varchar(32) NOT NULL,
	`gravitySnapshot` text NOT NULL,
	`entropy` int NOT NULL,
	`isSpliced` boolean NOT NULL,
	`heartbeatIntervalMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `homeThoughtEvents_id` PRIMARY KEY(`id`)
);
