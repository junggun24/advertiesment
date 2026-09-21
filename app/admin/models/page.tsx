'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Plus, Save, Trash2 } from 'lucide-react';
import { emptyDisplayModel, type DisplayModel } from '@/lib/display-models';
import './models.css';

const categories = [
  ['video_wall', '비디오월'], ['led_4_3', 'LED 4:3'],
  ['led_16_9', 'LED 16:9'], ['kiosk', '옥외용 키오스크'],
];
type NumericKey = 'registered_price'|'bezel_mm'|'pixel_pitch_mm'|'brightness_nit'|'width_mm'|'height_mm'|'depth_mm'|'resolution_width'|'resolution_height'|'cabinet_width_mm'|'cabinet_height_mm'|'cabinet_depth_mm'|'cabinet_resolution_width'|'cabinet_resolution_height'|'screen_size_inch'|'sort_order';

export default function ModelsAdminPage() {
  const [models, setModels] = useState<DisplayModel[]>([]);
  const [selected, setSelected] = useState<DisplayModel>(emptyDisplayModel());
  const [notice, setNotice] = useState('불러오는 중...');
  const grouped = useMemo(() => categories.map(([key, label]) => ({ key, label, items: models.filter((model) => model.category === key) })), [models]);

  async function load(selectId?: number) {
    const response = await fetch('/api/models?all=1', { cache: 'no-store' });
    if (response.status === 401) { location.replace('/admin/login'); return; }
    const data = await response.json() as { models?: DisplayModel[]; message?: string };
    if (!response.ok) { setNotice(data.message ?? '제품 사양을 불러오지 못했습니다.'); return; }
    setModels(data.models ?? []);
    if (selectId) setSelected(data.models?.find((model) => model.id === selectId) ?? emptyDisplayModel());
    setNotice('');
  }
  useEffect(() => { void fetch('/api/admin/session').then(async (response) => {
    const data = await response.json() as { authenticated?: boolean };
    if (!data.authenticated) { location.replace('/admin/login'); return; }
    await load();
  }).catch(() => location.replace('/admin/login')); }, []);

  function textValue<K extends keyof DisplayModel>(key: K, value: DisplayModel[K]) { setSelected((current) => ({ ...current, [key]: value })); }
  function numberValue(key: NumericKey, value: string) { setSelected((current) => ({ ...current, [key]: value === '' ? null : Number(value) })); }
  function chooseCategory(value: string) {
    const label = categories.find(([key]) => key === value)?.[1] ?? value;
    setSelected((current) => ({ ...current, category: value, category_label: label }));
  }
  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice('저장 중...');
    const response = await fetch(selected.id ? `/api/models/${selected.id}` : '/api/models', {
      method: selected.id ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(selected),
    });
    const result = await response.json() as DisplayModel & { message?: string };
    if (!response.ok) { setNotice(result.message ?? '저장하지 못했습니다.'); return; }
    setNotice('저장되었습니다. 사양 계산기와 Excel에 바로 반영됩니다.');
    await load(result.id);
  }
  async function remove() {
    if (!selected.id || !confirm(`“${selected.model_name}” 모델을 삭제할까요?`)) return;
    const response = await fetch(`/api/models/${selected.id}`, { method: 'DELETE' });
    if (!response.ok) { const data = await response.json() as { message?: string }; setNotice(data.message ?? '삭제하지 못했습니다.'); return; }
    setSelected(emptyDisplayModel()); await load(); setNotice('삭제되었습니다.');
  }

  return <main className="models-admin"><header className="admin-header"><Link href="/admin"><ArrowLeft/> 관리자 홈</Link><div><small>OIC KOREA</small><b>제품 사양·가격 관리</b></div><Link href="/simulator">계산기 보기</Link></header><section className="models-toolbar"><div><h1>조달 제품 데이터</h1><p>모델 사양과 조달등록가격을 수정하면 공개 계산기에 바로 반영됩니다.</p></div><Link href="/api/models/export"><Download/> Excel 내보내기</Link></section><section className="models-workspace"><aside><button className="model-add" onClick={() => setSelected(emptyDisplayModel())}><Plus/> 새 모델 등록</button>{grouped.map((group) => group.items.length > 0 && <div className="model-group" key={group.key}><h2>{group.label}<span>{group.items.length}</span></h2>{group.items.map((model) => <button className={selected.id === model.id ? 'active' : ''} onClick={() => setSelected(model)} key={model.id}><b>{model.model_name}</b><span>{model.procurement_id || '식별번호 미입력'}</span><small>{model.published ? '공개' : '비공개'} · {model.registered_price.toLocaleString()}원</small></button>)}</div>)}</aside><form onSubmit={save}><div className="model-form-head"><div><small>{selected.id ? 'MODEL EDIT' : 'NEW MODEL'}</small><h2>{selected.model_name || '새 제품 사양'}</h2></div><span><button className="danger" type="button" disabled={!selected.id} onClick={() => void remove()}><Trash2/> 삭제</button><button><Save/> 저장</button></span></div><fieldset><legend>기본 정보</legend><label>제품 분류<select value={selected.category} onChange={(event) => chooseCategory(event.target.value)}>{categories.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label>제품 유형<input required value={selected.product_type} onChange={(event) => textValue('product_type', event.target.value)}/></label><label>모델명<input required value={selected.model_name} onChange={(event) => textValue('model_name', event.target.value)}/></label><label>조달식별번호<input value={selected.procurement_id} onChange={(event) => textValue('procurement_id', event.target.value)}/></label><NumberField label="조달등록가격(원)" value={selected.registered_price} required onChange={(value) => numberValue('registered_price', value)}/><NumberField label="목록 순서" value={selected.sort_order} onChange={(value) => numberValue('sort_order', value)}/><label>화면비<input value={selected.aspect_ratio} onChange={(event) => textValue('aspect_ratio', event.target.value)} placeholder="예: 16:9"/></label><label>표시 방식<input value={selected.technology} onChange={(event) => textValue('technology', event.target.value)} placeholder="예: LCD, SMD"/></label></fieldset><fieldset><legend>화면·제품 규격</legend><NumberField label="화면 크기(인치)" value={selected.screen_size_inch} onChange={(value) => numberValue('screen_size_inch', value)}/><NumberField label="밝기(nit)" value={selected.brightness_nit} onChange={(value) => numberValue('brightness_nit', value)}/><NumberField label="베젤(mm)" value={selected.bezel_mm} step="0.01" onChange={(value) => numberValue('bezel_mm', value)}/><NumberField label="픽셀피치(mm)" value={selected.pixel_pitch_mm} step="0.001" onChange={(value) => numberValue('pixel_pitch_mm', value)}/><NumberField label="해상도 가로(px)" value={selected.resolution_width} onChange={(value) => numberValue('resolution_width', value)}/><NumberField label="해상도 세로(px)" value={selected.resolution_height} onChange={(value) => numberValue('resolution_height', value)}/><NumberField label="제품 가로(mm)" value={selected.width_mm} step="0.1" onChange={(value) => numberValue('width_mm', value)}/><NumberField label="제품 세로(mm)" value={selected.height_mm} step="0.1" onChange={(value) => numberValue('height_mm', value)}/><NumberField label="제품 깊이(mm)" value={selected.depth_mm} step="0.1" onChange={(value) => numberValue('depth_mm', value)}/></fieldset><fieldset><legend>LED 캐비닛 규격</legend><NumberField label="캐비닛 가로(mm)" value={selected.cabinet_width_mm} step="0.1" onChange={(value) => numberValue('cabinet_width_mm', value)}/><NumberField label="캐비닛 세로(mm)" value={selected.cabinet_height_mm} step="0.1" onChange={(value) => numberValue('cabinet_height_mm', value)}/><NumberField label="캐비닛 깊이(mm)" value={selected.cabinet_depth_mm} step="0.1" onChange={(value) => numberValue('cabinet_depth_mm', value)}/><NumberField label="캐비닛 해상도 가로" value={selected.cabinet_resolution_width} onChange={(value) => numberValue('cabinet_resolution_width', value)}/><NumberField label="캐비닛 해상도 세로" value={selected.cabinet_resolution_height} onChange={(value) => numberValue('cabinet_resolution_height', value)}/></fieldset><fieldset><legend>기타 사양과 공개 설정</legend><label className="wide">PC 사양<textarea rows={3} value={selected.pc_spec} onChange={(event) => textValue('pc_spec', event.target.value)}/></label><label>스피커<input value={selected.speaker} onChange={(event) => textValue('speaker', event.target.value)}/></label><label>기타 사양<input value={selected.other_spec} onChange={(event) => textValue('other_spec', event.target.value)}/></label><label className="wide">자료 메모<textarea rows={3} value={selected.source_note} onChange={(event) => textValue('source_note', event.target.value)}/></label><div className="model-publish"><input id="model-published" type="checkbox" checked={selected.published} onChange={(event) => textValue('published', event.target.checked)}/><span><label htmlFor="model-published">사이트에 공개</label><small>끄면 관리자와 Excel에서만 확인할 수 있습니다.</small></span></div></fieldset>{notice && <p className="models-notice">{notice}</p>}</form></section></main>;
}

function NumberField({ label, value, onChange, step = '1', required = false }: { label: string; value: number|null; onChange: (value: string) => void; step?: string; required?: boolean }) {
  return <label>{label}<input type="number" min="0" step={step} required={required} value={value ?? ''} onChange={(event) => onChange(event.target.value)}/></label>;
}
