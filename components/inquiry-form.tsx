'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Paperclip } from 'lucide-react';
import './inquiry-files.css';
import { currentAttribution, trackInquiryEvent } from './attribution-tracker';

export function InquiryForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [fileNames, setFileNames] = useState<string[]>([]);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');

    try {
      trackInquiryEvent('form_submit', '문의 접수 제출');
      const form = new FormData(event.currentTarget);
      form.set('attribution', JSON.stringify(currentAttribution()));
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        body: form,
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(data.message || '문의 접수에 실패했습니다.');
      if (window.location.pathname === '/inquiry')
        window.location.href = '/inquiry/complete';
      else setSent(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '문의 접수에 실패했습니다.',
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="inquiry-success">
        <CheckCircle2 />
        <strong>문의가 접수되었습니다.</strong>
        <p>담당자가 확인한 뒤 입력하신 연락처로 안내해 드리겠습니다.</p>
      </div>
    );
  }

  return (
    <form
      className={compact ? 'inquiry-form compact' : 'inquiry-form'}
      onSubmit={submit}
    >
      <label>
        이름
        <input name="name" required placeholder="이름을 입력해 주세요" />
      </label>
      <label>
        회사·기관명
        <input
          name="organization"
          required
          placeholder="회사 또는 기관명을 입력해 주세요"
        />
      </label>
      <label>
        연락처
        <input name="contact" required placeholder="전화번호 또는 이메일" />
      </label>
      <label>
        문의 내용
        <textarea
          name="message"
          required
          rows={compact ? 4 : 6}
          placeholder="필요한 제품과 설치 환경을 알려주세요."
        />
      </label>
      <label className="inquiry-files">
        <span>
          <Paperclip /> 참고 파일 첨부
        </span>
        <input
          name="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files || []);
            if (files.length > 5) {
              event.currentTarget.value = '';
              setFileNames([]);
              setError('첨부파일은 최대 5개까지 등록할 수 있습니다.');
              return;
            }
            setError('');
            setFileNames(files.map((file) => file.name));
            if (files.length)
              trackInquiryEvent('file_attach', `파일 ${files.length}개 첨부`);
          }}
        />
        <small>이미지·PDF·문서, 파일당 10MB 이하, 최대 5개</small>
        {fileNames.length > 0 && (
          <ul>
            {fileNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </label>
      <label className="consent-row">
        <input type="checkbox" required /> 개인정보 수집 및 이용에 동의합니다.
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="primary-button" disabled={sending}>
        {sending ? '접수 중...' : '문의 접수'} <ArrowRight />
      </button>
    </form>
  );
}
