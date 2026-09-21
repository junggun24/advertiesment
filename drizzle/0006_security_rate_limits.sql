CREATE TABLE IF NOT EXISTS request_rate_limits (
  scope TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scope, identifier_hash, window_start)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_request_rate_limits_updated
ON request_rate_limits(updated_at);
