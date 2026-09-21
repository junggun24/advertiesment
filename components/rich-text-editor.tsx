'use client';
// document.execCommand remains the compatibility layer for this small contentEditable toolbar.
// A rich-text editing surface must use contentEditable rather than a textarea.
// oxlint-disable typescript/no-deprecated, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-static-element-interactions
import { type DragEvent, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Heading2,
  ImageUp,
  Italic,
  Link,
  List,
  ListOrdered,
} from 'lucide-react';
import { optimizeImageForUpload } from '@/lib/client-image';

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value)
      editor.current.innerHTML = value || '<p><br></p>';
  }, [value]);
  function rememberSelection() {
    const selection = getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode))
      savedRange.current = selection.getRangeAt(0).cloneRange();
  }
  function command(name: string, argument?: string) {
    editor.current?.focus();
    if (savedRange.current) {
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRange.current);
    }
    document.execCommand(name, false, argument);
    rememberSelection();
  }
  async function addLink() {
    const url = prompt('연결할 주소를 입력해 주세요.', 'https://');
    if (url && /^https?:\/\//i.test(url)) command('createLink', url);
  }
  function rememberDropPosition(event: DragEvent<HTMLDivElement>) {
    const target = editor.current;
    if (!target) return;
    const caretDocument = document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null;
    };
    let range = caretDocument.caretRangeFromPoint?.(
      event.clientX,
      event.clientY,
    );
    if (!range) {
      const position = caretDocument.caretPositionFromPoint?.(
        event.clientX,
        event.clientY,
      );
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    }
    if (range && target.contains(range.startContainer))
      savedRange.current = range;
  }
  async function uploadOne(file: File) {
    const suggested = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    const alternative =
      prompt(
        '검색과 접근성을 위한 이미지 설명을 입력해 주세요.',
        suggested,
      )?.trim() ?? '';
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
    if (!response.ok || !result.url)
      throw new Error(result.message ?? '이미지를 업로드하지 못했습니다.');
    const escape = (input: string) =>
      input.replace(
        /[&<>"]/g,
        (value) =>
          ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[value] ??
          value,
      );
    command(
      'insertHTML',
      `<img src="${escape(result.url)}" alt="${escape(alternative)}"><p><br></p>`,
    );
    onChange(editor.current?.innerHTML ?? '');
    return Boolean(alternative);
  }
  async function upload(files?: FileList | File[]) {
    if (!files?.length || uploading) return;
    const images = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    );
    if (!images.length) {
      setMessage('JPG, PNG, WEBP, GIF 이미지 파일만 넣을 수 있습니다.');
      return;
    }
    setUploading(true);
    setMessage(
      images.length > 1
        ? `${images.length}개 이미지를 순서대로 업로드 중...`
        : '업로드용 이미지 최적화 중...',
    );
    let uploaded = 0;
    let described = 0;
    try {
      for (const file of images) {
        if (await uploadOne(file)) described += 1;
        uploaded += 1;
      }
      const ignored = Array.from(files).length - images.length;
      setMessage(
        `${uploaded}개 이미지가 삽입되었습니다.${described < uploaded ? ' 공개 전 이미지 설명을 확인해 주세요.' : ''}${ignored ? ` 이미지가 아닌 ${ignored}개 파일은 제외했습니다.` : ''}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `${uploaded}개 삽입 후 중단: ${error.message}`
          : '파일 저장소에 연결할 수 없습니다.',
      );
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="rich-editor">
      <div className="rich-toolbar" aria-label="본문 서식">
        <button
          type="button"
          title="굵게"
          onMouseDown={(event) => {
            event.preventDefault();
            command('bold');
          }}
        >
          <Bold />
        </button>
        <button
          type="button"
          title="기울임"
          onMouseDown={(event) => {
            event.preventDefault();
            command('italic');
          }}
        >
          <Italic />
        </button>
        <button
          type="button"
          title="제목"
          onMouseDown={(event) => {
            event.preventDefault();
            command('formatBlock', 'h2');
          }}
        >
          <Heading2 />
        </button>
        <button
          type="button"
          title="글머리 목록"
          onMouseDown={(event) => {
            event.preventDefault();
            command('insertUnorderedList');
          }}
        >
          <List />
        </button>
        <button
          type="button"
          title="번호 목록"
          onMouseDown={(event) => {
            event.preventDefault();
            command('insertOrderedList');
          }}
        >
          <ListOrdered />
        </button>
        <button
          type="button"
          title="링크"
          onMouseDown={(event) => {
            event.preventDefault();
            void addLink();
          }}
        >
          <Link />
        </button>
        <label className={uploading ? 'disabled' : ''}>
          <ImageUp />
          {uploading ? '업로드 중' : '이미지 삽입'}
          <input
            aria-label="본문 이미지 선택"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            onMouseDown={rememberSelection}
            onChange={(event) => {
              void upload(event.target.files ?? undefined);
              event.target.value = '';
            }}
          />
        </label>
      </div>
      <div
        ref={editor}
        className={`rich-editor-area${dragging ? ' is-dragging' : ''}`}
        aria-label="상세 본문"
        aria-multiline="true"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="본문을 입력하세요. 이미지를 넣으면 첫 이미지가 자동 썸네일로 사용됩니다."
        onInput={(event) => {
          rememberSelection();
          onChange(event.currentTarget.innerHTML);
        }}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onDragEnter={(event) => {
          if (event.dataTransfer.types.includes('Files')) setDragging(true);
        }}
        onDragOver={(event) => {
          if (!event.dataTransfer.types.includes('Files')) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setDragging(false);
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.files.length) return;
          event.preventDefault();
          event.stopPropagation();
          rememberDropPosition(event);
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        onDoubleClick={(event) => {
          const target = event.target;
          if (!(target instanceof HTMLImageElement)) return;
          const alternative = prompt(
            '이미지 설명을 입력해 주세요.',
            target.alt,
          )?.trim();
          if (alternative === undefined || alternative === null) return;
          target.alt = alternative;
          onChange(editor.current?.innerHTML ?? '');
          setMessage('이미지 설명이 수정되었습니다.');
        }}
      />
      <small>
        이미지를 본문에 끌어다 놓을 수 있습니다. 이미지를 두 번 누르면 대체
        설명을 수정할 수 있습니다.
      </small>
      {message && <small>{message}</small>}
    </div>
  );
}
