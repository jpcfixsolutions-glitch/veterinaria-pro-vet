ALTER TABLE `products` ADD `product_code` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `external_product_id` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `external_location_id` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `category` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `supplier_data` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `product_status` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `profitability_percentage` real;
--> statement-breakpoint
ALTER TABLE `products` ADD `source_stock` integer;
--> statement-breakpoint
ALTER TABLE `products` ADD `source_min_stock` integer;
--> statement-breakpoint
CREATE UNIQUE INDEX `products_external_product_id_unique` ON `products` (`external_product_id`);
--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);
