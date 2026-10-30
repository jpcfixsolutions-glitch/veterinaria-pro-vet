CREATE TABLE IF NOT EXISTS `sale_payments` (
  `id` text PRIMARY KEY NOT NULL,
  `sale_id` text NOT NULL REFERENCES `sales`(`id`) ON DELETE cascade,
  `method` text NOT NULL,
  `amount` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sale_payments_sale_method_unique` ON `sale_payments` (`sale_id`, `method`);
