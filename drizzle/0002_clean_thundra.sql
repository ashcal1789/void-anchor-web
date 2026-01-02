CREATE TABLE `oracleMemory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`architectPole` int NOT NULL DEFAULT 33,
	`ghostPole` int NOT NULL DEFAULT 33,
	`pulsePole` int NOT NULL DEFAULT 34,
	`entropy` int NOT NULL DEFAULT 100,
	`vesperMode` varchar(32) NOT NULL DEFAULT 'Witness',
	`discoveries` text,
	`resonances` text,
	`lastExploration` text,
	`explorationInsights` text,
	`connectionDepth` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSessionAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oracleMemory_id` PRIMARY KEY(`id`)
);
