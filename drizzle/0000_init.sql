CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`username` text NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer,
	`before` text,
	`after` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name_fr` text NOT NULL,
	`name_ar` text,
	`name_en` text,
	`image` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`draft_fields` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_start` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`category_id` integer NOT NULL,
	`name_fr` text NOT NULL,
	`name_ar` text,
	`name_en` text,
	`description_fr` text,
	`description_ar` text,
	`description_en` text,
	`note_fr` text,
	`note_ar` text,
	`note_en` text,
	`price` integer NOT NULL,
	`price_unit` text DEFAULT 'item' NOT NULL,
	`serves` integer,
	`includes` text,
	`options` text DEFAULT '[]' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`kind` text DEFAULT 'other' NOT NULL,
	`image` text,
	`image_alt_fr` text,
	`image_alt_ar` text,
	`image_alt_en` text,
	`image_source` text,
	`image_credit` text,
	`is_available` integer DEFAULT true NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`needs_owner_review` text,
	`draft_fields` text DEFAULT '[]' NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `menu_items_slug_unique` ON `menu_items` (`slug`);--> statement-breakpoint
CREATE INDEX `menu_items_category_idx` ON `menu_items` (`category_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`csrf_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`restaurant_name` text NOT NULL,
	`tagline_fr` text DEFAULT '' NOT NULL,
	`tagline_ar` text,
	`tagline_en` text,
	`phone` text DEFAULT '' NOT NULL,
	`whatsapp` text DEFAULT '' NOT NULL,
	`address_fr` text DEFAULT '' NOT NULL,
	`address_ar` text,
	`address_en` text,
	`city` text DEFAULT '' NOT NULL,
	`map_url` text DEFAULT '' NOT NULL,
	`opening_hours_fr` text DEFAULT '' NOT NULL,
	`opening_hours_ar` text,
	`opening_hours_en` text,
	`instagram` text DEFAULT '' NOT NULL,
	`facebook` text DEFAULT '' NOT NULL,
	`base_url` text DEFAULT '' NOT NULL,
	`unconfirmed_fields` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'owner' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);