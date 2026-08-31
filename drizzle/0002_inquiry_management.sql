ALTER TABLE inquiries ADD COLUMN assignee TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN memo TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;
