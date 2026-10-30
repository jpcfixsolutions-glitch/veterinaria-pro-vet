ALTER TABLE `sale_items` ADD `unit_cost` real;
--> statement-breakpoint
CREATE TABLE `expenses` (`id` text PRIMARY KEY NOT NULL, `amount` real NOT NULL, `description` text NOT NULL, `category` text NOT NULL, `payment_method` text NOT NULL, `expense_at` text NOT NULL, `recurring` integer DEFAULT false NOT NULL, `status` text DEFAULT 'ACTIVE' NOT NULL, `cash_register_id` text REFERENCES `cash_registers`(`id`), `created_by_id` text NOT NULL REFERENCES `users`(`id`), `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `expenses_date_idx` ON `expenses` (`expense_at`);
--> statement-breakpoint
CREATE TABLE `cash_movements` (`id` text PRIMARY KEY NOT NULL, `cash_register_id` text NOT NULL REFERENCES `cash_registers`(`id`), `expense_id` text REFERENCES `expenses`(`id`), `amount` real NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `cash_movements_expense_unique` ON `cash_movements` (`expense_id`);
