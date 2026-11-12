import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyDisplayModel } from '../lib/display-models.ts';
import { simulatorProductSchema } from '../lib/simulator-product-schema.ts';

const model = {
  ...emptyDisplayModel(),
  category: 'video_wall',
  category_label: '비디오월',
  product_type: '55형 비디오월',
  model_name: 'OG55FXND',
  procurement_id: '25900141',
  registered_price: 4_070_000,
  technology: 'LCD',
  resolution_width: 1920,
  resolution_height: 1080,
  brightness_nit: 500,
};

void test('adds the merchant listing product identity and representative image', () => {
  const schema = simulatorProductSchema(model);

  assert.equal(schema.image, 'https://dsko.co.kr/oic/prod-multivision.jpg');
  assert.equal(schema.brand.name, 'OIC KOREA');
  assert.equal(schema.mpn, 'OG55FXND');
  assert.match(schema.description, /55형 비디오월/);
  assert.match(schema.description, /1920×1080/);
  assert.equal(schema.offers.url, 'https://dsko.co.kr/simulator');
  assert.equal('category' in schema, false);
});

void test('uses a safe product image fallback for an unknown category', () => {
  const schema = simulatorProductSchema({ ...model, category: 'unknown' });

  assert.equal(schema.image, 'https://dsko.co.kr/oic/prod-notice.jpg');
});
