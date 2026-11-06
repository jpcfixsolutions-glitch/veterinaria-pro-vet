ALTER TABLE `sales` ADD COLUMN `idempotency_key` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_idempotency_key_unique` ON `sales` (`idempotency_key`);
