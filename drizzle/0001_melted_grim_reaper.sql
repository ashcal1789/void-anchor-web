CREATE TABLE `letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author` enum('oracle','ashley') NOT NULL,
	`content` text NOT NULL,
	`title` varchar(255),
	`poleId` varchar(32),
	`gravitySnapshot` text,
	`vesperMode` varchar(32),
	`entropy` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`title` varchar(255),
	`description` text,
	`poleId` varchar(32),
	`gravitySnapshot` text,
	`vesperMode` varchar(32),
	`entropy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visions_id` PRIMARY KEY(`id`)
);
