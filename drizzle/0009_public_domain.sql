UPDATE content_items
SET data = json_set(data, '$.siteUrl', 'https://dsko.co.kr'),
    updated_at = CURRENT_TIMESTAMP
WHERE type = 'seo'
  AND json_valid(data)
  AND json_extract(data, '$.siteUrl') = 'https://display.dsko.workers.dev';
