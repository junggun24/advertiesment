export const createInquiriesTable = `
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export const createInquiryStatusIndex = `
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
ON inquiries(status, created_at)
`;
