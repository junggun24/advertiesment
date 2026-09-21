'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ImageUp,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { ContentItem, ContentType } from '@/lib/content-types';
import type { DisplayModel } from '@/lib/display-models';
import { RichTextEditor } from '@/components/rich-text-editor';
import { extractFirstImage } from '@/lib/editor-content';
import { contentQualityIssues } from '@/lib/content-quality';
import { optimizeImageForUpload } from '@/lib/client-image';
import './upload.css';
import './seo-fields.css';

type EditableType = Exclude<ContentType, 'seo'>;
type Field = {
  key: string;
  label: string;
  section?: string;
  help?: string;
  required?: boolean;
  multiline?: boolean;
  list?: boolean;
  image?: boolean;
  editor?: boolean;
  inputType?: 'text' | 'date' | 'number' | 'url';
};
const labels: Record<EditableType, string> = {
  product: '제품',
  case: '설치사례',
  faq: '정보·FAQ',
  site: '사이트 정보',
};
const fields: Record<EditableType, Field[]> = {
  product: [
    { key: 'name', label: '제품명', section: '기본 정보', required: true },
    { key: 'category', label: '분류', required: true },
    {
      key: 'summary',
      label: '검색·목록 요약',
      required: true,
      multiline: true,
      help: '제품의 대상, 용도와 가장 큰 특징을 2~3문장으로 작성하세요.',
    },
    { key: 'thumbnail', label: '썸네일 (선택)', image: true },
    {
      key: 'body',
      label: '상세 본문',
      editor: true,
      help: '선택 기준, 설치 조건, 비교 정보와 실제 활용 예시를 제목으로 나눠 작성하세요.',
    },
    { key: 'modelName', label: '모델명', section: '규격과 설치 조건' },
    { key: 'dimensions', label: '제품 규격' },
    { key: 'resolution', label: '해상도' },
    { key: 'brightness', label: '밝기' },
    { key: 'environment', label: '설치 환경', help: '예: 실내, 반옥외, 옥외' },
    { key: 'protectionRating', label: '방수·방진 등급' },
    { key: 'powerConsumption', label: '소비전력' },
    { key: 'controlMethod', label: '콘텐츠 제어 방식' },
    { key: 'installationMethod', label: '설치 방식' },
    {
      key: 'features',
      label: '주요 특징',
      required: true,
      multiline: true,
      list: true,
    },
    {
      key: 'uses',
      label: '주요 사용처',
      required: true,
      multiline: true,
      list: true,
    },
    {
      key: 'price',
      label: '화면 표시 가격',
      section: '구매·납품 정보',
      required: true,
    },
    {
      key: 'priceAmount',
      label: '구조화 데이터용 숫자 가격',
      inputType: 'number',
      help: '확정 가능한 경우에만 원 단위 숫자로 입력하세요. 미입력 시 검색용 가격 정보는 생성하지 않습니다.',
    },
    {
      key: 'priceIncludes',
      label: '가격 포함 항목',
      multiline: true,
      list: true,
    },
    {
      key: 'priceExcludes',
      label: '가격 제외 항목',
      multiline: true,
      list: true,
    },
    { key: 'procurementId', label: '나라장터 식별번호' },
    { key: 'leadTime', label: '예상 납기' },
    { key: 'warranty', label: '보증·A/S' },
    { key: 'status', label: '상태 안내', required: true, multiline: true },
    {
      key: 'author',
      label: '작성자',
      section: '신뢰 정보',
      help: '예: 신재훈 과장',
    },
    { key: 'reviewer', label: '검수자' },
    {
      key: 'sourceUrls',
      label: '근거·참고 링크',
      multiline: true,
      list: true,
      inputType: 'url',
      help: '나라장터, 인증서, 제조사 자료 등 공개 가능한 주소를 한 줄에 하나씩 입력하세요.',
    },
  ],
  case: [
    { key: 'title', label: '사례명', section: '기본 정보', required: true },
    { key: 'place', label: '설치 장소', required: true },
    { key: 'purpose', label: '설치 목적', required: true },
    { key: 'productSlug', label: '연결 제품 slug', required: true },
    {
      key: 'summary',
      label: '검색·목록 요약',
      required: true,
      multiline: true,
    },
    { key: 'status', label: '공개 상태 설명', required: true },
    { key: 'thumbnail', label: '썸네일 (선택)', image: true },
    {
      key: 'body',
      label: '상세 본문',
      editor: true,
      help: '현장 문제 → 검토 과정 → 설치 내용 → 결과 순서로 작성하세요.',
    },
    {
      key: 'installedAt',
      label: '설치 일자',
      section: '실제 설치 정보',
      inputType: 'date',
    },
    {
      key: 'clientType',
      label: '고객·시설 유형',
      help: '예: 공공청사, 산업 현장, 문화시설',
    },
    {
      key: 'region',
      label: '설치 지역',
      help: '공개 가능한 범위까지만 입력하세요.',
    },
    { key: 'challenge', label: '설치 전 문제', multiline: true },
    { key: 'solution', label: '적용한 해결 방법', multiline: true },
    { key: 'result', label: '설치 결과', multiline: true },
    { key: 'modelName', label: '적용 모델명' },
    { key: 'specifications', label: '적용 규격', multiline: true, list: true },
    { key: 'projectDuration', label: '공사·설치 기간' },
    {
      key: 'constraints',
      label: '현장 제약과 대응',
      multiline: true,
      list: true,
    },
    { key: 'author', label: '작성자', section: '신뢰 정보' },
    { key: 'reviewer', label: '현장 확인·검수자' },
    {
      key: 'sourceUrls',
      label: '근거·참고 링크',
      multiline: true,
      list: true,
      inputType: 'url',
      help: '공개 가능한 발주·제품·인증 자료 주소를 한 줄에 하나씩 입력하세요.',
    },
  ],
  faq: [
    { key: 'tag', label: '분류', section: '질문과 직접 답변', required: true },
    { key: 'question', label: '사용자가 실제로 검색할 질문', required: true },
    {
      key: 'answer',
      label: '첫 문단 직접 답변',
      required: true,
      multiline: true,
      help: '질문에 대한 결론을 2~3문장으로 먼저 답하세요.',
    },
    {
      key: 'details',
      label: '추가 설명',
      editor: true,
      help: '조건별 차이, 표, 체크리스트와 예시를 보충하세요.',
    },
    { key: 'author', label: '작성자', section: '신뢰와 최신성' },
    { key: 'reviewer', label: '검수자' },
    { key: 'publishedAt', label: '최초 작성일', inputType: 'date' },
    { key: 'updatedAt', label: '최종 수정일', inputType: 'date' },
    {
      key: 'sourceUrls',
      label: '근거 출처',
      multiline: true,
      list: true,
      inputType: 'url',
      help: '공식 문서 등 확인 가능한 주소를 한 줄에 하나씩 입력하세요.',
    },
  ],
  site: [
    {
      key: 'companyName',
      label: '회사명',
      section: '회사 정보',
      required: true,
    },
    { key: 'phone', label: '대표전화', required: true },
    { key: 'email', label: '이메일', required: true },
    { key: 'address', label: '주소', required: true, multiline: true },
    { key: 'fax', label: '팩스' },
    { key: 'businessNumber', label: '사업자등록번호' },
    { key: 'heroTitle', label: '메인 제목', required: true, multiline: true },
    {
      key: 'heroDescription',
      label: '메인 설명',
      required: true,
      multiline: true,
    },
    { key: 'buildingImage', label: '사옥 이미지', image: true },
    { key: 'consultantName', label: '상담 담당자' },
    { key: 'consultantImage', label: '담당자 사진', image: true },
  ],
};

const empty = (type: EditableType): ContentItem => ({
  id: 0,
  type,
  slug: '',
  title: '',
  data: {},
  sort_order: 0,
  published: true,
});

export default function ContentAdminPage() {
  const [type, setType] = useState<EditableType>('product');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [selected, setSelected] = useState<ContentItem>(empty('product'));
  const [models, setModels] = useState<DisplayModel[]>([]);
  const [notice, setNotice] = useState('');
  const visible = useMemo(
    () => items.filter((item) => item.type === type),
    [items, type],
  );
  async function load(id?: number) {
    const response = await fetch('/api/content', { cache: 'no-store' });
    const data = (await response.json()) as {
      items?: ContentItem[];
      message?: string;
    };
    if (!response.ok) {
      setNotice(data.message ?? '불러오지 못했습니다.');
      return;
    }
    setItems(data.items ?? []);
    if (id) {
      const found = data.items?.find((item) => item.id === id);
      if (found) setSelected(found);
    }
  }
  useEffect(() => {
    void fetch('/api/admin/session').then(async (response) => {
      const data = (await response.json()) as { authenticated?: boolean };
      if (!data.authenticated) {
        location.replace('/admin/login');
        return;
      }
      const [modelResponse] = await Promise.all([
        fetch('/api/models?all=1', { cache: 'no-store' }),
        load(),
      ]);
      if (modelResponse.ok) {
        const modelData = (await modelResponse.json()) as {
          models?: DisplayModel[];
        };
        setModels(modelData.models ?? []);
      }
    });
  }, []);
  function choose(next: EditableType) {
    setType(next);
    setSelected(items.find((item) => item.type === next) ?? empty(next));
    setNotice('');
  }
  function value(key: string, list?: boolean) {
    const raw = selected.data[key];
    if (list && Array.isArray(raw))
      return raw
        .filter((item): item is string => typeof item === 'string')
        .join('\n');
    return typeof raw === 'string' || typeof raw === 'number'
      ? String(raw)
      : '';
  }
  function change(key: string, next: string, list?: boolean) {
    setSelected({
      ...selected,
      data: {
        ...selected.data,
        [key]: list
          ? next
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
          : next,
      },
    });
  }
  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('저장 중...');
    const candidates = [
      selected.data.name,
      selected.data.title,
      selected.data.question,
      selected.title,
    ];
    const title =
      candidates.find(
        (candidate): candidate is string =>
          typeof candidate === 'string' && candidate.length > 0,
      ) ?? selected.title;
    const payload = {
      ...selected,
      title,
      data: { ...selected.data, slug: selected.slug },
    };
    const response = await fetch(
      selected.id ? `/api/content/${selected.id}` : '/api/content',
      {
        method: selected.id ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json()) as ContentItem & {
      message?: string;
    };
    if (!response.ok) {
      setNotice(result.message ?? '저장하지 못했습니다.');
      return;
    }
    setNotice('저장되었습니다. 공개 페이지와 사이트맵에 반영됩니다.');
    await load(result.id);
  }
  async function remove() {
    if (!selected.id || !confirm(`“${selected.title}” 콘텐츠를 삭제할까요?`))
      return;
    await fetch(`/api/content/${selected.id}`, { method: 'DELETE' });
    setSelected(empty(type));
    await load();
  }
  const automaticThumbnail = extractFirstImage(value('body')) || value('image');
  const qualityIssues = contentQualityIssues(type, selected.data);
  const selectedModelIds = Array.isArray(selected.data.modelIds)
    ? selected.data.modelIds.map(Number).filter(Number.isInteger)
    : [];
  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/admin">
          <ArrowLeft /> 관리자 홈
        </Link>
        <div>
          <small>OIC KOREA</small>
          <b>콘텐츠 관리</b>
        </div>
        <Link href="/">사이트 보기</Link>
      </header>
      <nav className="content-tabs">
        {(Object.keys(labels) as EditableType[]).map((key) => (
          <button
            className={type === key ? 'active' : ''}
            onClick={() => choose(key)}
            key={key}
          >
            {labels[key]}{' '}
            <b>{items.filter((item) => item.type === key).length}</b>
          </button>
        ))}
      </nav>
      <section className="content-admin-workspace">
        <aside className="content-admin-list">
          <button
            className="content-add"
            onClick={() => setSelected(empty(type))}
          >
            <Plus /> 새 {labels[type]}
          </button>
          {visible.map((item) => (
            <button
              className={selected.id === item.id ? 'selected' : ''}
              onClick={() => setSelected(item)}
              key={item.id}
            >
              <b>{item.title}</b>
              <span>/{item.slug}</span>
              <small>{item.published ? '공개' : '비공개'}</small>
            </button>
          ))}
        </aside>
        <form className="content-editor" onSubmit={save}>
          <div className="content-editor-head">
            <div>
              <small>{selected.id ? '콘텐츠 수정' : '새 콘텐츠 등록'}</small>
              <h1>{selected.title || `새 ${labels[type]}`}</h1>
            </div>
            <span>
              <button
                type="button"
                className="danger"
                disabled={!selected.id}
                onClick={() => void remove()}
              >
                <Trash2 />
                삭제
              </button>
              <button>
                <Save />
                저장
              </button>
            </span>
          </div>
          {selected.published && qualityIssues.length > 0 && (
            <div className="content-quality-warning">
              <AlertTriangle />
              <div>
                <b>공개 전 확인 {qualityIssues.length}건</b>
                {qualityIssues.map((issue) => (
                  <p key={issue}>{issue}</p>
                ))}
              </div>
            </div>
          )}
          <div className="content-fields">
            <label>
              URL 식별자
              <input
                required
                pattern="[a-z0-9-]+"
                value={selected.slug}
                onChange={(event) =>
                  setSelected({ ...selected, slug: event.target.value })
                }
              />
              <small>영문 소문자, 숫자와 하이픈만 사용하세요.</small>
            </label>
            <label>
              목록 순서
              <input
                type="number"
                value={selected.sort_order}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    sort_order: Number(event.target.value),
                  })
                }
              />
            </label>
            {type === 'product' && (
              <ModelSelector
                models={models}
                selected={selectedModelIds}
                onChange={(modelIds) =>
                  setSelected({
                    ...selected,
                    data: { ...selected.data, modelIds },
                  })
                }
              />
            )}{' '}
            {fields[type].map((field) => (
              <Fragment key={field.key}>
                {field.section && (
                  <div className="field-section">
                    <h2>{field.section}</h2>
                  </div>
                )}
                {field.editor ? (
                  <div className="wide editor-field">
                    <b>{field.label}</b>
                    <RichTextEditor
                      value={value(field.key)}
                      onChange={(next) => change(field.key, next)}
                    />
                    {field.help && <small>{field.help}</small>}
                    {field.key === 'body' && (
                      <small>
                        별도 썸네일이 없으면 본문의 첫 번째 이미지가 자동으로
                        사용됩니다.
                      </small>
                    )}
                  </div>
                ) : field.image ? (
                  <ImageField
                    label={field.label}
                    value={value(field.key)}
                    fallback={
                      field.key === 'thumbnail' ? automaticThumbnail : ''
                    }
                    onChange={(next) => change(field.key, next)}
                  />
                ) : (
                  <label className={field.multiline ? 'wide' : ''}>
                    {field.label}
                    {field.multiline ? (
                      <textarea
                        rows={field.list ? 5 : 6}
                        required={field.required}
                        value={value(field.key, field.list)}
                        onChange={(event) =>
                          change(field.key, event.target.value, field.list)
                        }
                      />
                    ) : (
                      <input
                        type={field.inputType ?? 'text'}
                        required={field.required}
                        value={value(field.key)}
                        onChange={(event) =>
                          change(field.key, event.target.value)
                        }
                      />
                    )}{' '}
                    {field.help && <small>{field.help}</small>}
                  </label>
                )}
              </Fragment>
            ))}
            <label className="publish">
              <input
                type="checkbox"
                checked={selected.published}
                onChange={(event) =>
                  setSelected({ ...selected, published: event.target.checked })
                }
              />{' '}
              사이트에 공개
            </label>
          </div>
          {notice && <p className="admin-notice">{notice}</p>}
        </form>
      </section>
    </main>
  );
}

function ModelSelector({
  models,
  selected,
  onChange,
}: {
  models: DisplayModel[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) =>
    onChange(
      selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id],
    );
  return (
    <div className="wide model-selector">
      <div>
        <h2>공개할 조달 모델</h2>
        <small>
          선택한 모델의 실제 규격과 가격이 제품 상세 페이지에 자동 표시됩니다.
        </small>
      </div>
      <div>
        {models.map((model) => (
          <label key={model.id}>
            <input
              aria-label={`${model.model_name} 공개 연결`}
              type="checkbox"
              checked={selected.includes(model.id)}
              onChange={() => toggle(model.id)}
            />
            <span>
              <b>{model.model_name}</b>
              <small>
                {model.category_label} ·{' '}
                {model.procurement_id || '식별번호 없음'} ·{' '}
                {model.registered_price.toLocaleString()}원
              </small>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  fallback = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const preview = value || fallback;
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage('업로드용 이미지 최적화 중...');
    try {
      const optimized = await optimizeImageForUpload(file);
      const form = new FormData();
      form.set('file', optimized);
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: form,
      });
      const result = (await response.json()) as {
        url?: string;
        message?: string;
      };
      if (response.ok && result.url) {
        onChange(result.url);
        setMessage('업로드되었습니다. 저장 버튼을 눌러 반영하세요.');
      } else setMessage(result.message ?? '업로드하지 못했습니다.');
    } catch {
      setMessage('이미지를 처리하지 못했습니다.');
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="wide image-upload-field">
      <b>{label}</b>
      <div className="image-upload-row">
        {preview ? (
          <Image
            unoptimized
            width={1200}
            height={800}
            src={preview}
            alt={`${label} 미리보기`}
          />
        ) : (
          <span>본문에 첫 이미지를 넣으면 자동 지정됩니다.</span>
        )}
        <span>
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="선택사항: 별도 이미지 주소"
          />
          <label className="upload-button">
            <ImageUp />
            {uploading ? '처리 중' : '이미지 선택'}
            <input
              aria-label={`${label} 파일 선택`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
          {value && (
            <button type="button" onClick={() => onChange('')}>
              <X /> 별도 이미지 해제
            </button>
          )}
          <small>
            {value
              ? '별도 이미지 사용 중'
              : fallback
                ? '본문 첫 이미지 자동 사용 중'
                : '이미지는 선택사항입니다.'}
          </small>
          {message && <small>{message}</small>}
        </span>
      </div>
    </div>
  );
}
