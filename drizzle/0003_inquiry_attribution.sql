ALTER TABLE inquiries ADD COLUMN inquiry_channel TEXT NOT NULL DEFAULT '상담신청 폼';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN source_type TEXT NOT NULL DEFAULT 'Unknown';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN source_name TEXT NOT NULL DEFAULT '확인 불가';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN campaign TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN ad_group TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN keyword TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN content TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN landing_page TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN submitted_page TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN referrer TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN device_type TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN page_view_count INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN first_visited_at TEXT;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN elapsed_seconds INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN attribution_raw TEXT NOT NULL DEFAULT '{}';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inquiries_source_created ON inquiries(source_type, created_at);
