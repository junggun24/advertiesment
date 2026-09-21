'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
export function SiteFooter(){const pathname=usePathname();if(pathname.startsWith('/admin'))return null;return <footer className="global-footer"><div><b>(주)오아이씨코리아</b><p>주소. 인천광역시 부평구 안남로 369번길 12 (청천동, 5층)</p><p>사업자등록번호. 130-86-61170</p><p>전화번호. 032-719-7947 · 팩스. 032-719-7591</p><p>이메일. sales@oickorea.com · 평일 09:00–18:00</p><small>© {new Date().getFullYear()} OIC Korea All Rights Reserved.</small></div><nav><Link href="/about">회사소개</Link><Link href="/products">제품소개</Link><Link href="/cases">설치사례</Link><Link href="/inquiry">문의</Link></nav></footer>}
