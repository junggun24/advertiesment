export const createInquiriesTable = `
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  assignee TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  inquiry_channel TEXT NOT NULL DEFAULT '상담신청 폼',
  source_type TEXT NOT NULL DEFAULT 'Unknown',
  source_name TEXT NOT NULL DEFAULT '확인 불가',
  campaign TEXT NOT NULL DEFAULT '',
  ad_group TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  landing_page TEXT NOT NULL DEFAULT '',
  submitted_page TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  device_type TEXT NOT NULL DEFAULT '',
  page_view_count INTEGER NOT NULL DEFAULT 1,
  first_visited_at TEXT,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  attribution_raw TEXT NOT NULL DEFAULT '{}',
  last_source_type TEXT NOT NULL DEFAULT 'Unknown',
  last_source_name TEXT NOT NULL DEFAULT '확인 불가',
  last_campaign TEXT NOT NULL DEFAULT '',
  last_ad_group TEXT NOT NULL DEFAULT '',
  last_keyword TEXT NOT NULL DEFAULT '',
  last_content TEXT NOT NULL DEFAULT '',
  last_landing_page TEXT NOT NULL DEFAULT '',
  last_referrer TEXT NOT NULL DEFAULT '',
  session_count INTEGER NOT NULL DEFAULT 1,
  session_page_view_count INTEGER NOT NULL DEFAULT 1,
  last_visited_at TEXT,
  journey TEXT NOT NULL DEFAULT '{"pages":[],"events":[]}',
  quality_flags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const createInquiryStatusIndex = `
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
ON inquiries(status, created_at)
`;

export const createContentItemsTable = `
CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug)
)`;

export const createContentAssetsTable = `
CREATE TABLE IF NOT EXISTS content_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  inquiry_id INTEGER REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
