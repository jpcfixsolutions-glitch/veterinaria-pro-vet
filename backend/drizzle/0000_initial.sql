CREATE TABLE `users` (`id` text PRIMARY KEY NOT NULL, `first_name` text NOT NULL, `last_name` text NOT NULL, `contact` text NOT NULL, `username` text NOT NULL, `password_hash` text NOT NULL, `role` text DEFAULT 'ADMIN' NOT NULL, `active` integer DEFAULT true NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `products` (`id` text PRIMARY KEY NOT NULL, `name` text NOT NULL, `barcode` text NOT NULL, `supplier` text NOT NULL, `laboratory` text NOT NULL, `cost` real NOT NULL, `sale_price` real NOT NULL, `stock` integer DEFAULT 0 NOT NULL, `min_stock` integer DEFAULT 0 NOT NULL, `active` integer DEFAULT true NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_barcode_unique` ON `products` (`barcode`);
--> statement-breakpoint
CREATE INDEX `products_name_idx` ON `products` (`name`);
--> statement-breakpoint
CREATE TABLE `cash_registers` (`id` text PRIMARY KEY NOT NULL, `business_date` text NOT NULL, `opened_at` text NOT NULL, `closed_at` text, `opened_by_id` text NOT NULL REFERENCES `users`(`id`), `closed_by_id` text REFERENCES `users`(`id`), `initial_amount` real NOT NULL, `counted_amount` real, `status` text DEFAULT 'OPEN' NOT NULL, `created_at` text NOT NULL, `updated_at` text NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX `cash_registers_date_unique` ON `cash_registers` (`business_date`);
--> statement-breakpoint
CREATE TABLE `sales` (`id` text PRIMARY KEY NOT NULL, `cash_register_id` text NOT NULL REFERENCES `cash_registers`(`id`), `created_by_id` text NOT NULL REFERENCES `users`(`id`), `payment_method` text NOT NULL, `total` real NOT NULL, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `sales_cash_idx` ON `sales` (`cash_register_id`);
--> statement-breakpoint
CREATE TABLE `sale_items` (`id` text PRIMARY KEY NOT NULL, `sale_id` text NOT NULL REFERENCES `sales`(`id`) ON DELETE cascade, `product_id` text NOT NULL REFERENCES `products`(`id`), `product_name` text NOT NULL, `quantity` integer NOT NULL, `unit_price` real NOT NULL);
