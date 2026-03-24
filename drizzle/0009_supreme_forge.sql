CREATE TABLE `conversationTranscripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`messages` text NOT NULL,
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationTranscripts_id` PRIMARY KEY(`id`)
);
