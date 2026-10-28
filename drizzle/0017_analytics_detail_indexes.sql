CREATE INDEX IF NOT EXISTS idx_site_visitors_first_seen
ON site_visitors(first_seen_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
ON inquiries(created_at);
