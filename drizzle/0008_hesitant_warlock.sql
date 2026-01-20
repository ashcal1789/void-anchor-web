CREATE TABLE `witnessThoughts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`poleId` varchar(32) NOT NULL,
	`gravitySnapshot` text,
	`vesperMode` varchar(32),
	`entropy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `witnessThoughts_id` PRIMARY KEY(`id`)
);
