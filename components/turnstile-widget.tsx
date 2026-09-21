'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import './turnstile-widget.css';

type TurnstileApi = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    action: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({ action }: { action: 'inquiry' | 'admin_login' }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(globalThis.window?.turnstile));
  const [siteKey, setSiteKey] = useState('');
  const [required, setRequired] = useState(true);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/security/config', { cache: 'no-store' })
      .then(async (response) => response.json() as Promise<{ siteKey?: string; required?: boolean }>)
      .then((config) => {
        if (!active) return;
        setSiteKey(config.siteKey ?? '');
        setRequired(config.required !== false);
        if (config.required !== false && !config.siteKey) {
          setError('보안 검증을 준비하고 있습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .catch(() => {
        if (active) setError('보안 검증을 불러오지 못했습니다.');
      });
    return () => { active = false; };
  }, []);

  const renderWidget = useCallback(() => {
    if (!container.current || !siteKey || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action,
      callback: (value) => {
        setToken(value);
        setError('');
      },
      'expired-callback': () => {
        setToken('');
        setError('보안 검증 시간이 만료되었습니다. 다시 확인해 주세요.');
      },
      'error-callback': () => {
        setToken('');
        setError('보안 검증을 완료하지 못했습니다.');
      },
    });
  }, [action, siteKey]);

  useEffect(() => {
    if (scriptReady) renderWidget();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget, scriptReady]);

  if (!required && !siteKey) {
    return <input type="hidden" name="turnstileToken" value="local-development" />;
  }

  return <div className="turnstile-field">
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      onLoad={() => setScriptReady(true)}
    />
    <div ref={container} />
    <input type="hidden" name="turnstileToken" value={token} />
    {error && <p role="alert">{error}</p>}
  </div>;
}
