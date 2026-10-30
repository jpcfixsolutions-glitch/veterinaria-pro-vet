CREATE TABLE `settings_catalog` (`id` text PRIMARY KEY NOT NULL, `type` text NOT NULL, `name` text NOT NULL, `description` text, `details` text, `active` integer DEFAULT true NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_catalog_type_name_unique` ON `settings_catalog` (`type`,`name`);
--> statement-breakpoint
CREATE INDEX `settings_catalog_type_idx` ON `settings_catalog` (`type`);
--> statement-breakpoint
CREATE TABLE `fixed_expenses` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `description` text, `category` text NOT NULL, `amount` real NOT NULL, `frequency` text NOT NULL, `due_day` integer, `start_date` text NOT NULL, `payment_method` text NOT NULL, `active` integer DEFAULT true NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
