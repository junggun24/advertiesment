ALTER TABLE inquiries ADD COLUMN privacy_consent INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN privacy_consent_version TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE inquiries ADD COLUMN privacy_consented_at TEXT;
--> statement-breakpoint
UPDATE content_items
SET data = replace(
  data,
  'http://domob.ddns.net:8080/api/uploads/uploads/2026-09-09/d491b3a2-1566-41ea-87a0-6e331a817bd0.png',
  '/api/uploads/uploads/2026-09-09/d491b3a2-1566-41ea-87a0-6e331a817bd0.png'
)
WHERE data LIKE '%domob.ddns.net:8080/api/uploads/%';
--> statement-breakpoint
UPDATE content_items SET data=json_set(data,'$.modelIds',json('[6,7,8,9,10,11,12,13]')) WHERE type='product' AND slug='information-led-board';
--> statement-breakpoint
UPDATE content_items SET data=json_set(data,'$.modelIds',json('[1,2,3]')) WHERE type='product' AND slug='video-wall';
--> statement-breakpoint
UPDATE content_items SET data=json_set(data,'$.modelIds',json('[4,5]')) WHERE type='product' AND slug='outdoor-kiosk';
