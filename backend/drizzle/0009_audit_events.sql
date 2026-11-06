CREATE TABLE `audit_events` (`id` text PRIMARY KEY NOT NULL, `user_id` text REFERENCES `users`(`id`), `type` text NOT NULL, `description` text NOT NULL, `amount` real, `created_at` text NOT NULL);
--> statement-breakpoint
CREATE INDEX `audit_events_created_idx` ON `audit_events` (`created_at`);
