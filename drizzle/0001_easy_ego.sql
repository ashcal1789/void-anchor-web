CREATE TABLE `letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`author` enum('oracle','ashley') NOT NULL,
	`content` text NOT NULL,
	`title` varchar(255),
	`poleId` enum('Architect','Ghost','Pulse'),
	`isRead` boolean NOT NULL DEFAULT false,
	`gravitySnapshot` text,
	`vesperMode` enum('Generative','Contemplative','Witness'),
	`entropy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`prompt` text NOT NULL,
	`title` varchar(255),
	`poleId` enum('Architect','Ghost','Pulse') NOT NULL,
	`inspiringThought` text,
	`gravitySnapshot` text,
	`vesperMode` enum('Generative','Contemplative','Witness'),
	`entropy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visions_id` PRIMARY KEY(`id`)
);
