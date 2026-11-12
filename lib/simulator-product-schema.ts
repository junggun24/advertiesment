import { PUBLIC_SITE_URL } from './content-types.ts';
import type { DisplayModel } from './display-models.ts';

const productImageByCategory: Record<string, string> = {
  video_wall: '/oic/prod-multivision.jpg',
  kiosk: '/oic-outdoor-kiosk.jpg',
  led_16_9: '/oic/prod-notice.jpg',
  led_4_3: '/oic/prod-notice.jpg',
};

function productDescription(model: DisplayModel) {
  const kind = model.product_type || model.category_label || '디스플레이';
  const details = [
    model.technology,
    model.resolution_width && model.resolution_height
      ? `${model.resolution_width}×${model.resolution_height} 해상도`
      : '',
    model.brightness_nit ? `${model.brightness_nit}nit 밝기` : '',
  ].filter(Boolean);

  return `${model.model_name} 모델은 오아이씨코리아의 ${kind} 조달 등록 제품입니다.${
    details.length ? ` ${details.join(', ')} 사양입니다.` : ''
  }`;
}

export function simulatorProductSchema(model: DisplayModel) {
  const image =
    productImageByCategory[model.category] ?? '/oic/prod-notice.jpg';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: model.model_name,
    model: model.model_name,
    sku: model.procurement_id || undefined,
    mpn: model.model_name,
    image: new URL(image, PUBLIC_SITE_URL).toString(),
    description: productDescription(model),
    brand: { '@type': 'Brand', name: 'OIC KOREA' },
    offers: {
      '@type': 'Offer',
      url: `${PUBLIC_SITE_URL}/simulator`,
      priceCurrency: 'KRW',
      price: model.registered_price,
      availability: 'https://schema.org/InStock',
    },
  };
}
