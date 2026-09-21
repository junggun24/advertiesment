'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { TurnstileWidget } from '@/components/turnstile-widget';

export default function AdminLoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch('/api/admin/session').then(async (response) => {
      const data = await response.json() as { authenticated?: boolean };
      if (data.authenticated) window.location.replace('/admin');
    });
  }, []);

  async function submit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id,
        password,
        turnstileToken: new FormData(event.currentTarget).get('turnstileToken'),
      }),
    });
    if (!response.ok) {
      const data = await response.json() as { message?: string };
      setNotice(data.message ?? '로그인하지 못했습니다.');
      setSubmitting(false);
      return;
    }
    window.location.replace('/admin');
  }

  return <main className="admin-login-page">
    <form className="admin-login-card" onSubmit={submit}>
      <div className="admin-login-icon"><LockKeyhole /></div>
      <small>OIC KOREA</small>
      <h1>관리자 로그인</h1>
      <p>문의 관리 페이지에 접속하려면 로그인해 주세요.</p>
      <label>아이디<input autoComplete="username" value={id} onChange={(event) => setId(event.target.value)} required /></label>
      <label>비밀번호<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <TurnstileWidget action="admin_login" />
      {notice && <p className="admin-login-notice">{notice}</p>}
      <button disabled={submitting}>{submitting ? '확인 중...' : '로그인'}</button>
      <Link href="/">사이트로 돌아가기</Link>
    </form>
  </main>;
}
