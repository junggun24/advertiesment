CREATE TABLE IF NOT EXISTS site_visitors (
  visitor_hash TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  page_views INTEGER NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS site_visitor_days (
  visit_date TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  page_views INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (visit_date, visitor_hash)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_site_visitor_days_date
ON site_visitor_days(visit_date);
