UPDATE content_items
SET data = json_set(
  data,
  '$.companyName', '(주)오아이씨코리아',
  '$.phone', '032-719-7947',
  '$.email', 'jeromes@oickorea.com',
  '$.address', '인천광역시 부평구 안남로369번길 12 (청천동, 오아이씨코리아 사옥)',
  '$.fax', '032-719-7591',
  '$.consultantPhone', '032-719-7947',
  '$.consultantEmail', 'jeromes@oickorea.com',
  '$.consultantHours', '평일 09:00–18:00'
),
updated_at = CURRENT_TIMESTAMP
WHERE type = 'site' AND slug = 'main';
