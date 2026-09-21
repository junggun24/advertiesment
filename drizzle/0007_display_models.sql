CREATE TABLE IF NOT EXISTS display_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  product_type TEXT NOT NULL,
  model_name TEXT NOT NULL UNIQUE,
  procurement_id TEXT NOT NULL DEFAULT '',
  registered_price INTEGER NOT NULL DEFAULT 0,
  aspect_ratio TEXT NOT NULL DEFAULT '',
  technology TEXT NOT NULL DEFAULT '',
  bezel_mm REAL,
  pixel_pitch_mm REAL,
  brightness_nit INTEGER,
  width_mm REAL,
  height_mm REAL,
  depth_mm REAL,
  resolution_width INTEGER,
  resolution_height INTEGER,
  cabinet_width_mm REAL,
  cabinet_height_mm REAL,
  cabinet_depth_mm REAL,
  cabinet_resolution_width INTEGER,
  cabinet_resolution_height INTEGER,
  screen_size_inch REAL,
  pc_spec TEXT NOT NULL DEFAULT '',
  speaker TEXT NOT NULL DEFAULT '',
  other_spec TEXT NOT NULL DEFAULT '',
  source_note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_display_models_category_order
ON display_models(category, sort_order, id);
--> statement-breakpoint
INSERT OR IGNORE INTO display_models
  (category, category_label, product_type, model_name, procurement_id, registered_price, aspect_ratio, technology, bezel_mm, brightness_nit, width_mm, height_mm, depth_mm, resolution_width, resolution_height, source_note, sort_order)
VALUES
  ('video_wall', '비디오월', '55형 비디오월', 'OG55FXND', '25900141', 4070000, '16:9', 'LCD', 1.74, 500, 1212.3, 638.1, 94.1, 1920, 1080, '첨부 조달 사양·가격표 기준', 10),
  ('video_wall', '비디오월', '55형 비디오월', 'OG55FRND', '25900143', 5555000, '16:9', 'LCD', 0.88, 500, 1209.6, 680.3, 91.6, 1920, 1080, '해상도와 밝기는 가격표의 시리즈 공통 표기를 적용', 20),
  ('video_wall', '비디오월', '55형 비디오월', 'OG55FRHD', '25900140', 6160000, '16:9', 'LCD', 0.88, 700, NULL, NULL, NULL, 1920, 1080, '가격표에 외형 치수가 없어 관리자 확인 필요', 30);
--> statement-breakpoint
INSERT OR IGNORE INTO display_models
  (category, category_label, product_type, model_name, procurement_id, registered_price, aspect_ratio, technology, brightness_nit, width_mm, height_mm, depth_mm, resolution_width, resolution_height, screen_size_inch, pc_spec, speaker, other_spec, source_note, sort_order)
VALUES
  ('kiosk', '옥외용 키오스크', '55형 옥외용 키오스크', 'OG5500KN', '25875672', 12000000, '16:9', 'LCD', 2500, 940, 2226, 550, 1920, 1080, 55, '인텔 코어i3-15세대, DDR4 4GB, SSD 128GB', '-', '강화유리(5T), UV Film', '첨부 조달 사양·가격표 기준', 40),
  ('kiosk', '옥외용 키오스크', '55형 옥외용 키오스크', 'OG5501KN', '24671499', 14000000, '16:9', 'LCD', 3000, 940, 2226, 550, 1920, 1080, 55, '인텔 코어i3-15세대, DDR4 4GB, SSD 128GB', 'O', '강화유리(5T), UV Film', '크기·해상도·PC 사양은 가격표의 시리즈 공통 표기를 적용', 50);
--> statement-breakpoint
INSERT OR IGNORE INTO display_models
  (category, category_label, product_type, model_name, procurement_id, registered_price, aspect_ratio, technology, pixel_pitch_mm, brightness_nit, width_mm, height_mm, depth_mm, cabinet_width_mm, cabinet_height_mm, cabinet_depth_mm, cabinet_resolution_width, cabinet_resolution_height, source_note, sort_order)
VALUES
  ('led_4_3', 'LED 4:3', '실내용 LED 디스플레이', 'OGF12', '25775994', 2530000, '4:3', 'SMD', 1.25, 600, 640, 480, 31, 600, 337.5, 31, 480, 270, '첨부 조달 사양·가격표 기준', 60),
  ('led_4_3', 'LED 4:3', '실내용 LED 디스플레이', 'OGF15', '25775992', 1980000, '4:3', 'SMD', 1.56, 600, 640, 480, 31, 600, 337.5, 31, 384, 216, '밝기와 크기는 가격표의 시리즈 공통 표기를 적용', 70),
  ('led_4_3', 'LED 4:3', '실내용 LED 디스플레이', 'OGF18', '25775992', 1540000, '4:3', 'SMD', 1.875, 600, 640, 480, 31, 600, 337.5, 31, 320, 180, '원본 가격표의 조달식별번호를 그대로 반영', 80),
  ('led_4_3', 'LED 4:3', '실내용 LED 디스플레이', 'OGF25', '25775991', 1078000, '4:3', 'SMD', 2.5, 600, 640, 480, 31, 600, 337.5, 31, 240, 135, '밝기와 크기는 가격표의 시리즈 공통 표기를 적용', 90),
  ('led_16_9', 'LED 16:9', '실내용 LED 디스플레이', 'OGH12', '25775996', 3080000, '16:9', 'SMD', 1.2, 600, 600, 337.5, 31, 640, 480, 31, 512, 384, '첨부 조달 사양·가격표 기준', 100),
  ('led_16_9', 'LED 16:9', '실내용 LED 디스플레이', 'OGH15', '25775995', 2200000, '16:9', 'SMD', 1.5, 600, 600, 337.5, 31, 640, 480, 31, 416, 312, '밝기와 크기는 가격표의 시리즈 공통 표기를 적용', 110),
  ('led_16_9', 'LED 16:9', '실내용 LED 디스플레이', 'OGH18', '25775997', 1650000, '16:9', 'SMD', 1.8, 600, 600, 337.5, 31, 640, 480, 31, 348, 261, '밝기와 크기는 가격표의 시리즈 공통 표기를 적용', 120),
  ('led_16_9', 'LED 16:9', '실내용 LED 디스플레이', 'OGH25', '25775998', 1320000, '16:9', 'SMD', 2.5, 600, 600, 337.5, 31, 640, 480, 31, 256, 192, '밝기와 크기는 가격표의 시리즈 공통 표기를 적용', 130);
