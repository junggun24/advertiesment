'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calculator, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import type { DisplayModel } from '@/lib/display-models';

const money = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));
const measurement = (value: number|null) => value == null ? '미입력' : `${value.toLocaleString()} mm`;

export default function SimulatorPage() {
  const [models, setModels] = useState<DisplayModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('video_wall');
  const [modelId, setModelId] = useState(0);
  const [wallWidth, setWallWidth] = useState(4);
  const [wallHeight, setWallHeight] = useState(2.5);
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(2);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => { void fetch('/api/models', { cache: 'no-store' }).then(async (response) => {
    const data = await response.json() as { models?: DisplayModel[]; message?: string };
    if (!response.ok) throw new Error(data.message ?? '제품 정보를 불러오지 못했습니다.');
    const loaded = data.models ?? [];
    setModels(loaded);
    if (loaded[0]) { setCategory(loaded[0].category); setModelId(loaded[0].id); }
  }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '제품 정보를 불러오지 못했습니다.')).finally(() => setLoading(false)); }, []);

  const categories = useMemo(() => [...new Map(models.map((model) => [model.category, model.category_label])).entries()], [models]);
  const visibleModels = useMemo(() => models.filter((model) => model.category === category), [models, category]);
  const model = models.find((item) => item.id === modelId) ?? visibleModels[0] ?? models[0];
  const result = useMemo(() => {
    if (!model) return null;
    const safeColumns = Math.max(1, Math.min(20, columns || 1));
    const safeRows = Math.max(1, Math.min(20, rows || 1));
    const nativeWidth = portrait ? model.height_mm : model.width_mm;
    const nativeHeight = portrait ? model.width_mm : model.height_mm;
    const hasDimensions = nativeWidth != null && nativeHeight != null;
    const displayWidth = hasDimensions ? nativeWidth * safeColumns / 1000 : null;
    const displayHeight = hasDimensions ? nativeHeight * safeRows / 1000 : null;
    const quantity = safeColumns * safeRows;
    const productTotal = model.registered_price * quantity;
    const fee = Math.round(productTotal * .0054);
    return { safeColumns, safeRows, quantity, productTotal, fee, total: productTotal + fee, displayWidth, displayHeight, hasDimensions, fits: hasDimensions && displayWidth! <= wallWidth && displayHeight! <= wallHeight };
  }, [model, columns, rows, portrait, wallWidth, wallHeight]);

  function changeCategory(next: string) {
    setCategory(next);
    const first = models.find((item) => item.category === next);
    if (first) setModelId(first.id);
  }

  if (loading) return <main className="configurator-page"><section className="configurator-state">제품 사양을 불러오는 중입니다.</section></main>;
  if (error || !model || !result) return <main className="configurator-page"><section className="configurator-state"><div><h1>제품 정보를 표시할 수 없습니다.</h1><p>{error || '공개된 제품이 없습니다.'}</p></div></section></main>;

  const inquiryHref = `/inquiry?product=${encodeURIComponent(model.model_name)}&columns=${result.safeColumns}&rows=${result.safeRows}`;
  return <main className="configurator-page"><section className="configurator-hero"><div><p>DISPLAY CONFIGURATOR</p><h1>설치 공간에 맞는<br/>제품 사양과 가격을 확인하세요.</h1><span>벽면 크기와 배열을 입력하면 완성 크기, 수량, 조달등록가격 기준 예상 금액을 한 번에 계산합니다.</span></div><dl><div><dt>등록 모델</dt><dd>{models.length}개</dd></div><div><dt>제품군</dt><dd>{categories.length}개</dd></div><div><dt>계산 기준</dt><dd>조달등록가격</dd></div></dl></section><section className="configurator-shell"><div className="configurator-steps"><b>1</b><span>제품 선택</span><i/><b>2</b><span>설치 조건</span><i/><b>3</b><span>결과 확인</span></div><div className="configurator-category" role="tablist" aria-label="제품 분류">{categories.map(([key, label]) => <button role="tab" aria-selected={category === key} className={category === key ? 'active' : ''} onClick={() => changeCategory(key)} key={key}>{label}<small>{models.filter((item) => item.category === key).length}개 모델</small></button>)}</div><div className="configurator-main"><section className="configurator-controls"><h2>모델과 설치 조건</h2><label className="wide">제품 모델<select value={model.id} onChange={(event) => setModelId(Number(event.target.value))}>{visibleModels.map((item) => <option value={item.id} key={item.id}>{item.model_name} · {money(item.registered_price)}원</option>)}</select></label><div className="configurator-inputs"><label>벽면 가로 (m)<input type="number" min="0.5" max="100" step="0.1" value={wallWidth} onChange={(event) => setWallWidth(Number(event.target.value))}/></label><label>벽면 세로 (m)<input type="number" min="0.5" max="100" step="0.1" value={wallHeight} onChange={(event) => setWallHeight(Number(event.target.value))}/></label><label>가로 수량 (열)<input type="number" min="1" max="20" value={columns} onChange={(event) => setColumns(Number(event.target.value))}/></label><label>세로 수량 (단)<input type="number" min="1" max="20" value={rows} onChange={(event) => setRows(Number(event.target.value))}/></label></div><button className={`orientation-toggle ${portrait ? 'active' : ''}`} onClick={() => setPortrait((value) => !value)}><RotateCcw/> {portrait ? '세로형 배치 사용 중' : '가로형 배치 사용 중'}<small>클릭하면 제품 방향이 전환됩니다.</small></button><div className={`fit-result ${!result.hasDimensions ? 'unknown' : result.fits ? 'fits' : 'over'}`}>{result.hasDimensions ? result.fits ? <CheckCircle2/> : <Info/> : <Info/>}<span><b>{result.hasDimensions ? `${result.displayWidth!.toFixed(2)}m × ${result.displayHeight!.toFixed(2)}m` : '제품 외형 치수 확인 필요'}</b>{!result.hasDimensions ? '관리자에서 가로·세로 치수를 입력하면 배치 계산이 활성화됩니다.' : result.fits ? '입력한 벽면 안에 배치 가능한 크기입니다.' : '벽면보다 큽니다. 배열 수량이나 제품 방향을 조정해 주세요.'}</span></div></section><section className="configurator-preview"><div className="wall-label"><span>설치 벽면</span><b>{wallWidth || 0}m × {wallHeight || 0}m</b></div><div className="wall-canvas" style={{ aspectRatio: `${Math.max(wallWidth, .5)} / ${Math.max(wallHeight, .5)}` }}><div className="screen-grid" style={{ width: result.hasDimensions ? `${Math.min(100, result.displayWidth! / Math.max(wallWidth, .5) * 100)}%` : '65%', height: result.hasDimensions ? `${Math.min(100, result.displayHeight! / Math.max(wallHeight, .5) * 100)}%` : '55%', gridTemplateColumns: `repeat(${result.safeColumns},1fr)` }}>{Array.from({ length: result.quantity }).map((_, index) => <i key={index}><span>OIC</span></i>)}</div></div><p>{model.model_name} · {result.safeRows}단 {result.safeColumns}열 · 총 {result.quantity}대</p></section></div></section><section className="spec-and-price"><article className="model-spec"><header><div><small>{model.category_label}</small><h2>{model.model_name}</h2><p>{model.product_type}</p></div><span>조달식별번호<br/><b>{model.procurement_id || '미등록'}</b></span></header><dl><Spec label="조달등록가격" value={`${money(model.registered_price)}원`}/><Spec label="제품 크기" value={`${measurement(model.width_mm)} × ${measurement(model.height_mm)} × ${measurement(model.depth_mm)}`}/><Spec label="해상도" value={model.resolution_width && model.resolution_height ? `${model.resolution_width.toLocaleString()} × ${model.resolution_height.toLocaleString()}` : '미입력'}/><Spec label="밝기" value={model.brightness_nit ? `${model.brightness_nit.toLocaleString()} nit` : '미입력'}/><Spec label={model.pixel_pitch_mm ? '픽셀피치' : '베젤'} value={model.pixel_pitch_mm ? `${model.pixel_pitch_mm} mm` : model.bezel_mm ? `${model.bezel_mm} mm` : '미입력'}/><Spec label="화면비 / 방식" value={[model.aspect_ratio, model.technology].filter(Boolean).join(' / ') || '미입력'}/>{model.cabinet_width_mm && <Spec label="캐비닛 크기" value={`${measurement(model.cabinet_width_mm)} × ${measurement(model.cabinet_height_mm)} × ${measurement(model.cabinet_depth_mm)}`}/>} {model.pc_spec && <Spec label="PC 사양" value={model.pc_spec}/>} {model.other_spec && <Spec label="기타" value={model.other_spec}/>}</dl>{model.source_note && <p className="source-note"><Info/> {model.source_note}</p>}</article><article className="price-summary"><div><Calculator/><span><small>예상 합계</small><strong>{money(result.total)}원</strong></span></div><dl><div><dt>제품 단가</dt><dd>{money(model.registered_price)}원</dd></div><div><dt>수량</dt><dd>{result.quantity}대</dd></div><div><dt>제품 금액</dt><dd>{money(result.productTotal)}원</dd></div><div><dt>조달수수료 0.54%</dt><dd>{money(result.fee)}원</dd></div></dl><p>제품 조달등록가격과 수수료만 계산한 참고 금액입니다. 설치 구조물, 전기·통신 공사, 운송비와 현장 조건에 따른 비용은 별도일 수 있습니다.</p><Link href={inquiryHref}>이 구성으로 정확한 견적 문의</Link></article></section><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: model.model_name, model: model.model_name, sku: model.procurement_id, category: model.category_label, offers: { '@type': 'Offer', priceCurrency: 'KRW', price: model.registered_price, availability: 'https://schema.org/InStock' } }) }}/></main>;
}

function Spec({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
