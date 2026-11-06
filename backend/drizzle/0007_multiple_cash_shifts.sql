DROP INDEX `cash_registers_date_unique`;
--> statement-breakpoint
CREATE INDEX `cash_registers_business_date_idx` ON `cash_registers` (`business_date`);
