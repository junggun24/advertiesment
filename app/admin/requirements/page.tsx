'use client';

import Link from 'next/link';
import {
  ArrowDownAZ,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  File,
  Filter,
  Grid2X2,
  ListFilter,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type {
  Requirement,
  RequirementBlock,
  RequirementSpan,
} from '@/lib/requirements';
import './requirements.css';

const statuses = [
  '시작 전',
  '진행 중',
  '작업완료',
  '확인완료',
  '반려',
  '재작업요청',
];
const categories = ['', '기획', '디자인', '기능', '기타'];

function blockText(block: RequirementBlock) {
  return block.richText.map((span) => span.text).join('');
}

function RichText({ spans }: { spans: RequirementSpan[] }) {
  return spans.map((span, index) => {
    const style = {
      fontWeight: span.bold ? 700 : undefined,
      fontStyle: span.italic ? 'italic' : undefined,
      textDecoration: span.strike ? 'line-through' : undefined,
      color:
        span.color === 'red'
          ? '#c9362b'
          : span.color === 'blue'
            ? '#2f65a7'
            : undefined,
    };
    const content = span.code ? <code>{span.text}</code> : span.text;
    return span.href ? (
      <a
        href={span.href}
        key={`${index}-${span.text}`}
        rel="noreferrer"
        style={style}
        target="_blank"
      >
        {content}
      </a>
    ) : (
      <span key={`${index}-${span.text}`} style={style}>
        {content}
      </span>
    );
  });
}

function RequirementBlockView({ block }: { block: RequirementBlock }) {
  const content = <RichText spans={block.richText} />;
  const children = block.children?.map((child) => (
    <RequirementBlockView block={child} key={child.id} />
  ));
  switch (block.type) {
    case 'header':
      return <h2 className="notion-h1">{content}</h2>;
    case 'sub_header':
      return <h3 className="notion-h2">{content}</h3>;
    case 'sub_sub_header':
      return <h4 className="notion-h3">{content}</h4>;
    case 'quote':
      return <blockquote>{content}</blockquote>;
    case 'divider':
      return <hr />;
    case 'bulleted_list':
      return <div className="notion-list bullet">{content}</div>;
    case 'numbered_list':
      return <div className="notion-list numbered">{content}</div>;
    case 'to_do':
      return (
        <label className="notion-todo">
          <input checked={Boolean(block.checked)} readOnly type="checkbox" />
          <span>{content}</span>
        </label>
      );
    case 'image':
      return block.asset ? (
        <figure className="notion-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={block.asset.name} src={block.asset.url} />
          {block.asset.name !== 'image.png' && (
            <figcaption>{block.asset.name}</figcaption>
          )}
        </figure>
      ) : null;
    case 'file':
      return block.asset ? (
        <a className="notion-file" href={block.asset.url}>
          <File />
          <span>
            <b>{block.asset.name}</b>
            <small>첨부 파일 다운로드</small>
          </span>
        </a>
      ) : null;
    case 'column_list':
      return <div className="notion-columns">{children}</div>;
    case 'column':
      return <div className="notion-column">{children}</div>;
    default:
      return (
        <p className="notion-text">
          {content}
          {children}
        </p>
      );
  }
}

function replaceBlockText(
  blocks: RequirementBlock[],
  id: string,
  value: string,
): RequirementBlock[] {
  return blocks.map((block) =>
    block.id === id
      ? { ...block, richText: [{ text: value }] }
      : {
          ...block,
          children: replaceBlockText(block.children ?? [], id, value),
        },
  );
}

function RequirementBlockEditor({
  block,
  onChange,
}: {
  block: RequirementBlock;
  onChange: (id: string, value: string) => void;
}) {
  if (block.type === 'divider') return <hr />;
  if (block.type === 'image' || block.type === 'file')
    return <RequirementBlockView block={block} />;
  if (block.type === 'column_list' || block.type === 'column')
    return (
      <div
        className={
          block.type === 'column_list' ? 'notion-columns' : 'notion-column'
        }
      >
        {block.children?.map((child) => (
          <RequirementBlockEditor
            block={child}
            key={child.id}
            onChange={onChange}
          />
        ))}
      </div>
    );
  return (
    <div className={`requirement-block-editor ${block.type}`}>
      {block.type === 'to_do' && (
        <input checked={Boolean(block.checked)} readOnly type="checkbox" />
      )}
      <textarea
        aria-label="본문 블록"
        onChange={(event) => onChange(block.id, event.target.value)}
        rows={Math.max(1, blockText(block).split('\n').length)}
        value={blockText(block)}
      />
    </div>
  );
}

function RequirementDetail({
  value,
  onChange,
  onClose,
  onDelete,
  onSave,
}: {
  value: Requirement;
  onChange: (value: Requirement) => void;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  const [editingBody, setEditingBody] = useState(false);
  const set = (key: keyof Requirement, fieldValue: unknown) =>
    onChange({ ...value, [key]: fieldValue });
  const changeBlock = (id: string, fieldValue: string) =>
    set('content', replaceBlockText(value.content, id, fieldValue));
  return (
    <div
      className="requirement-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <article className="requirement-detail">
        <header>
          <span>요구사항 / {value.id ? `#${value.id}` : '새 페이지'}</span>
          <div>
            <button
              onClick={() => setEditingBody((current) => !current)}
              type="button"
            >
              {editingBody ? '미리보기' : '본문 편집'}
            </button>
            {value.id > 0 && (
              <button
                aria-label="삭제"
                className="danger"
                onClick={onDelete}
                type="button"
              >
                <Trash2 />
              </button>
            )}
            <button aria-label="닫기" onClick={onClose} type="button">
              <X />
            </button>
          </div>
        </header>
        <div className="requirement-detail-scroll">
          <input
            aria-label="요구사항 이름"
            className="requirement-title-input"
            onChange={(event) => set('title', event.target.value)}
            placeholder="제목 없음"
            value={value.title}
          />
          <div className="requirement-properties">
            <label>
              <span>
                <UserRound /> 생성자
              </span>
              <input
                onChange={(event) => set('creator', event.target.value)}
                value={value.creator}
              />
            </label>
            <label>
              <span>
                <ListFilter /> 선택
              </span>
              <select
                onChange={(event) => set('category', event.target.value)}
                value={value.category}
              >
                {categories.map((category) => (
                  <option key={category || 'empty'} value={category}>
                    {category || '선택 안 함'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>
                <CalendarDays /> 날짜
              </span>
              <input
                onChange={(event) => set('due_date', event.target.value)}
                type="date"
                value={value.due_date}
              />
            </label>
            <label>
              <span>
                <Check /> 상태
              </span>
              <select
                onChange={(event) => set('status', event.target.value)}
                value={value.status}
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="requirement-body">
            {editingBody
              ? value.content.map((block) => (
                  <RequirementBlockEditor
                    block={block}
                    key={block.id}
                    onChange={changeBlock}
                  />
                ))
              : value.content.map((block) => (
                  <RequirementBlockView block={block} key={block.id} />
                ))}
            {editingBody && (
              <button
                className="add-block"
                onClick={() =>
                  set('content', [
                    ...value.content,
                    {
                      id: crypto.randomUUID(),
                      type: 'text',
                      richText: [{ text: '' }],
                      children: [],
                    },
                  ])
                }
                type="button"
              >
                <Plus /> 블록 추가
              </button>
            )}
          </div>
        </div>
        <footer>
          <button className="primary" onClick={onSave} type="button">
            저장
          </button>
        </footer>
      </article>
    </div>
  );
}

export default function RequirementsAdminPage() {
  const [items, setItems] = useState<Requirement[]>([]);
  const [selected, setSelected] = useState<Requirement | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('전체');
  const [sort, setSort] = useState<'manual' | 'title' | 'date'>('manual');
  const [notice, setNotice] = useState('불러오는 중...');

  async function load(preferredId?: number) {
    const response = await fetch('/api/requirements', { cache: 'no-store' });
    if (response.status === 401) {
      location.replace('/admin/login');
      return;
    }
    if (!response.ok) {
      setNotice('요구사항을 불러오지 못했습니다.');
      return;
    }
    const data = (await response.json()) as { requirements: Requirement[] };
    setItems(data.requirements);
    if (preferredId)
      setSelected(
        data.requirements.find((item) => item.id === preferredId) ?? null,
      );
    setNotice('');
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = items.filter(
      (item) =>
        (status === '전체' || item.status === status) &&
        (!normalized ||
          [item.title, item.creator, item.category, item.status]
            .join(' ')
            .toLowerCase()
            .includes(normalized)),
    );
    if (sort === 'title')
      return filtered.toSorted((a, b) => a.title.localeCompare(b.title, 'ko'));
    if (sort === 'date')
      return filtered.toSorted((a, b) =>
        (a.due_date || '9999').localeCompare(b.due_date || '9999'),
      );
    return filtered;
  }, [items, query, sort, status]);

  function createRequirement() {
    setSelected({
      id: 0,
      source_id: '',
      title: '',
      creator: '신재훈',
      category: '',
      due_date: '',
      status: '시작 전',
      content: [],
      sort_order: items.length,
      created_at: '',
      updated_at: '',
    });
  }

  async function save() {
    if (!selected) return;
    setNotice('저장 중...');
    const response = await fetch(
      selected.id ? `/api/requirements/${selected.id}` : '/api/requirements',
      {
        method: selected.id ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selected),
      },
    );
    const result = (await response.json()) as Requirement & {
      message?: string;
    };
    if (!response.ok) {
      setNotice(result.message || '저장하지 못했습니다.');
      return;
    }
    await load(result.id);
    setNotice('저장되었습니다.');
    window.setTimeout(() => setNotice(''), 1800);
  }

  async function remove() {
    if (
      !selected?.id ||
      !window.confirm(`“${selected.title}” 요구사항을 삭제할까요?`)
    )
      return;
    const response = await fetch(`/api/requirements/${selected.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      setNotice('삭제하지 못했습니다.');
      return;
    }
    setSelected(null);
    await load();
  }

  return (
    <main className="requirements-admin">
      <nav className="requirements-nav">
        <Link href="/admin">
          <ArrowLeft /> 관리자 페이지
        </Link>
        <span>/</span>
        <b>요구사항</b>
      </nav>
      <section className="requirements-workspace">
        <h1>요구사항</h1>
        <div className="requirements-toolbar">
          <button className="view-pill" type="button">
            <Grid2X2 /> 표
          </button>
          <div className="requirements-actions">
            <label className="search-control">
              <Search />
              <input
                aria-label="요구사항 검색"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="검색"
                value={query}
              />
            </label>
            <label className="tool-select">
              <Filter />
              <select
                aria-label="상태 필터"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option>전체</option>
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <ChevronDown />
            </label>
            <label className="tool-select">
              <ArrowDownAZ />
              <select
                aria-label="정렬"
                onChange={(event) => setSort(event.target.value as typeof sort)}
                value={sort}
              >
                <option value="manual">기본 순서</option>
                <option value="title">이름순</option>
                <option value="date">날짜순</option>
              </select>
              <ChevronDown />
            </label>
            <button
              className="new-requirement"
              onClick={createRequirement}
              type="button"
            >
              새로 만들기 <ChevronDown />
            </button>
          </div>
        </div>
        <div className="requirements-table-wrap">
          <table className="requirements-table">
            <thead>
              <tr>
                <th className="check">
                  <input aria-label="전체 선택" type="checkbox" />
                </th>
                <th>⌁&nbsp; 이름</th>
                <th>●&nbsp; 생성자</th>
                <th>▽&nbsp; 선택</th>
                <th>▣&nbsp; 날짜</th>
                <th>◉&nbsp; 상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td
                    className="check"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input aria-label={`${item.title} 선택`} type="checkbox" />
                  </td>
                  <td className="title-cell">
                    <span className="page-icon">▤</span>
                    {item.title}
                  </td>
                  <td>
                    <span className="creator-avatar">
                      {item.creator.includes('정근') ? '정' : '재'}
                    </span>
                    {item.creator}
                  </td>
                  <td>
                    {item.category && (
                      <span className={`category category-${item.category}`}>
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td>{item.due_date || ''}</td>
                  <td>
                    <span className={`status status-${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="new-row">
                <td aria-label="새 페이지" className="check">
                  {' '}
                </td>
                <td colSpan={5}>
                  <button onClick={createRequirement} type="button">
                    <Plus /> 새 페이지
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          {notice && <p className="requirements-notice">{notice}</p>}
        </div>
      </section>
      {selected && (
        <RequirementDetail
          onChange={setSelected}
          onClose={() => setSelected(null)}
          onDelete={() => void remove()}
          onSave={() => void save()}
          value={selected}
        />
      )}
    </main>
  );
}
