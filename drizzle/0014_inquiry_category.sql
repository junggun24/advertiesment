ALTER TABLE inquiries ADD COLUMN inquiry_category TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inquiries_category_created
ON inquiries(inquiry_category, created_at);
