CREATE TABLE `case_checklist` (
	`case_id` text NOT NULL,
	`item_key` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`completed_by` text,
	`completed_at` text,
	PRIMARY KEY(`case_id`, `item_key`),
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
