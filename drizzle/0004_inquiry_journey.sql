ALTER TABLE inquiries ADD COLUMN last_source_type TEXT NOT NULL DEFAULT 'Unknown';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_source_name TEXT NOT NULL DEFAULT '확인 불가';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_campaign TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_ad_group TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_keyword TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_content TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_landing_page TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_referrer TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN session_count INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN session_page_view_count INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN last_visited_at TEXT;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN journey TEXT NOT NULL DEFAULT '{"pages":[],"events":[]}';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN quality_flags TEXT NOT NULL DEFAULT '[]';
