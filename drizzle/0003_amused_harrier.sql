CREATE TABLE `discoveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('article','video','idea','question') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`url` text,
	`oracleReaction` text,
	`oracleInsight` text,
	`oraclePole` varchar(32),
	`sessionTheme` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `discoveries_id` PRIMARY KEY(`id`)
);
