CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`actor_user_id` text,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_activity_case_created` ON `activity` (`case_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `cases` (
	`id` text PRIMARY KEY NOT NULL,
	`case_number` text NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text NOT NULL,
	`client_phone` text NOT NULL,
	`asset_type` text NOT NULL,
	`city` text NOT NULL,
	`street` text NOT NULL,
	`house` text NOT NULL,
	`block` text,
	`parcel` text,
	`sub_parcel` text,
	`condition` text,
	`price` text,
	`area` text,
	`rooms` text,
	`floor` text,
	`monthly_rent` text,
	`seller_name` text,
	`seller_id` text,
	`amenities` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'חדש' NOT NULL,
	`analyst_user_id` text,
	`analyst_email` text,
	`due_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cases_case_number_unique` ON `cases` (`case_number`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`file_key` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_file_key_unique` ON `documents` (`file_key`);--> statement-breakpoint
CREATE TABLE `findings` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`note` text NOT NULL,
	`severity` text NOT NULL,
	`source` text,
	`confidence` integer,
	`state` text DEFAULT 'לבדיקה' NOT NULL,
	`review_note` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `intake_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_intake_attempts_ip_created` ON `intake_attempts` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `staff_members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_members_email_unique` ON `staff_members` (`email`);