'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { mergeSiteSettings, type SiteSettings } from '@/lib/content-types';
import { useContent } from '@/lib/use-content';
export function SiteFooter({ initialSite }: { initialSite: SiteSettings }) {
  const pathname = usePathname();
  const savedSite = useContent<SiteSettings>('site', [initialSite])[0];
  const site = mergeSiteSettings(savedSite);
  if (pathname.startsWith('/admin')) return null;
  return (
    <footer className="global-footer">
      <div>
        <b>{site.companyName}</b>
        <p>주소. {site.address}</p>
        <p>
          전화번호. {site.consultantPhone} · 팩스. {site.fax}
        </p>
        <p>
          이메일. {site.consultantEmail} · {site.consultantHours}
        </p>
        <small>
          © {new Date().getFullYear()} OIC Korea All Rights Reserved.
        </small>
      </div>
      <nav>
        <Link href="/about">회사소개</Link>
        <Link href="/products">제품소개</Link>
        <Link href="/cases">설치사례</Link>
        <Link href="/inquiry">문의</Link>
        <Link href="/privacy">개인정보 처리 안내</Link>
      </nav>
    </footer>
  );
}
