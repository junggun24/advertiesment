'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ImageUp,
  RotateCcw,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react';
import { imageUploadFormData, prepareImageUpload } from '@/lib/client-image';
import {
  mergeSiteSettings,
  type ContentItem,
  type SiteSettings,
} from '@/lib/content-types';
import { Toaster, toast } from '@/components/ui/toast';
import { notifyContentUpdated } from '@/lib/use-content';
import './profile.css';

export default function ProfileAdminPage() {
  const [item, setItem] = useState<ContentItem<SiteSettings> | null>(null);
  const [profile, setProfile] = useState(() => mergeSiteSettings());
  const [savedProfile, setSavedProfile] = useState(() => mergeSiteSettings());
  const [notice, setNotice] = useState('불러오는 중...');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void fetch('/api/admin/session')
      .then(async (sessionResponse) => {
        const session = (await sessionResponse.json()) as {
          authenticated?: boolean;
        };
        if (!session.authenticated) {
          location.replace('/admin/login');
          return;
        }
        const response = await fetch('/api/content?type=site', {
          cache: 'no-store',
        });
        const data = (await response.json()) as {
          items?: ContentItem<SiteSettings>[];
          message?: string;
        };
        if (!response.ok)
          throw new Error(data.message ?? '담당자 정보를 불러오지 못했습니다.');
        const saved = data.items?.[0] ?? null;
        const next = mergeSiteSettings(saved?.data);
        setItem(saved);
        setProfile(next);
        setSavedProfile(next);
        setNotice('');
      })
      .catch((error: unknown) =>
        setNotice(
          error instanceof Error
            ? error.message
            : '담당자 정보를 불러오지 못했습니다.',
        ),
      );
  }, []);

  function update<K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.add({
        title: '사진 업로드 실패',
        description: 'JPG, PNG, WEBP 또는 GIF 이미지를 선택해 주세요.',
        type: 'error',
      });
      return;
    }
    setUploading(true);
    setNotice('프로필 사진 최적화 중...');
    try {
      const prepared = await prepareImageUpload(file);
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: imageUploadFormData(prepared),
      });
      const result = (await response.json()) as {
        url?: string;
        variant_widths?: number[];
        message?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.message ?? '사진을 업로드하지 못했습니다.');
      update('consultantImage', result.url);
      const variants = result.variant_widths?.length ?? 0;
      setNotice(
        `사진과 반응형 변형 ${variants}개가 업로드되었습니다. 저장 버튼을 눌러 공개 페이지에 반영하세요.`,
      );
      toast.add({
        title: '프로필 사진 업로드 완료',
        description:
          '담당자 정보 저장 전까지는 공개 페이지에 반영되지 않습니다.',
        type: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '사진을 업로드하지 못했습니다.';
      setNotice(message);
      toast.add({
        title: '사진 업로드 실패',
        description: message,
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice('저장 중...');
    const synchronizedProfile = {
      ...profile,
      email: profile.consultantEmail,
    };
    const payload = item
      ? { ...item, data: synchronizedProfile }
      : {
          type: 'site' as const,
          slug: 'main',
          title: '사이트 기본정보',
          data: synchronizedProfile,
          sort_order: 0,
          published: true,
        };
    try {
      const response = await fetch(
        item ? `/api/content/${item.id}` : '/api/content',
        {
          method: item ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as ContentItem<SiteSettings> & {
        message?: string;
      };
      if (!response.ok)
        throw new Error(result.message ?? '담당자 정보를 저장하지 못했습니다.');
      const next = mergeSiteSettings(result.data);
      setItem(result);
      setProfile(next);
      setSavedProfile(next);
      notifyContentUpdated('site');
      setNotice('저장되었습니다. 공개 담당자 페이지에 바로 반영됩니다.');
      toast.add({
        title: '담당자 정보 저장 완료',
        description: '이름, 연락처, 소개와 프로필 사진이 반영되었습니다.',
        type: 'success',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '담당자 정보를 저장하지 못했습니다.';
      setNotice(message);
      toast.add({
        title: '담당자 정보 저장 실패',
        description: message,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-admin admin-page">
      <header className="admin-header">
        <Link href="/admin">
          <ArrowLeft /> 관리자 홈
        </Link>
        <div>
          <small>OIC KOREA</small>
          <b>담당자 정보 관리</b>
        </div>
        <Link href="/people/shin-jaehoon" target="_blank">
          공개 페이지 보기
        </Link>
      </header>
      <form onSubmit={save}>
        <div className="profile-admin-heading">
          <div>
            <p className="eyebrow">PROFILE MANAGEMENT</p>
            <h1>상담 담당자 정보</h1>
            <p>
              신재훈 과장 소개 페이지와 상담 영역에 표시될 정보를 관리합니다.
            </p>
          </div>
          <button type="submit" disabled={saving || uploading}>
            <Save /> {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="profile-admin-grid">
          <section className="profile-photo-editor">
            <h2>프로필 사진</h2>
            <div className="profile-photo-preview">
              {profile.consultantImage ? (
                <Image
                  unoptimized
                  src={profile.consultantImage}
                  alt={`${profile.consultantName} 프로필 미리보기`}
                  width={720}
                  height={960}
                />
              ) : (
                <span>
                  <UserRound />
                  등록된 사진 없음
                </span>
              )}
            </div>
            <label className="profile-upload-button">
              <ImageUp />
              {uploading ? '사진 처리 중...' : '사진 선택·업로드'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading || saving}
                onChange={(event) => {
                  const input = event.currentTarget;
                  void uploadPhoto(input.files?.[0]).finally(() => {
                    input.value = '';
                  });
                }}
              />
            </label>
            <small>
              세로형 3:4 비율을 권장합니다. 일반 사진은 WEBP와 반응형 크기로
              함께 저장되며 GIF는 원본 애니메이션을 유지합니다.
            </small>
            {profile.consultantImage && (
              <button
                type="button"
                className="profile-remove-photo"
                onClick={() => update('consultantImage', '')}
              >
                <Trash2 /> 공개 페이지에서 사진 제거
              </button>
            )}
          </section>

          <section className="profile-info-editor">
            <h2>기본 정보</h2>
            <div className="profile-form-grid">
              <label>
                이름·직급
                <input
                  required
                  value={profile.consultantName}
                  onChange={(event) =>
                    update('consultantName', event.target.value)
                  }
                />
              </label>
              <label>
                소속
                <input
                  required
                  value={profile.consultantDepartment}
                  onChange={(event) =>
                    update('consultantDepartment', event.target.value)
                  }
                />
              </label>
              <label>
                담당 업무
                <input
                  required
                  value={profile.consultantRole}
                  onChange={(event) =>
                    update('consultantRole', event.target.value)
                  }
                />
              </label>
              <label>
                상담 가능 시간
                <input
                  required
                  value={profile.consultantHours}
                  onChange={(event) =>
                    update('consultantHours', event.target.value)
                  }
                />
              </label>
              <label>
                직통 전화
                <input
                  required
                  inputMode="tel"
                  value={profile.consultantPhone}
                  onChange={(event) =>
                    update('consultantPhone', event.target.value)
                  }
                />
              </label>
              <label>
                이메일
                <input
                  required
                  type="email"
                  value={profile.consultantEmail}
                  onChange={(event) =>
                    update('consultantEmail', event.target.value)
                  }
                />
              </label>
              <label className="wide">
                담당자 소개
                <textarea
                  required
                  rows={7}
                  value={profile.consultantIntroduction}
                  onChange={(event) =>
                    update('consultantIntroduction', event.target.value)
                  }
                />
                <small>{profile.consultantIntroduction.length}자</small>
              </label>
            </div>
          </section>
        </div>

        {notice && <p className="profile-admin-notice">{notice}</p>}
        <div className="profile-admin-actions">
          <button
            type="button"
            className="secondary"
            disabled={saving || uploading}
            onClick={() => {
              setProfile(savedProfile);
              setNotice('저장된 정보로 되돌렸습니다.');
            }}
          >
            <RotateCcw /> 변경 취소
          </button>
          <button type="submit" disabled={saving || uploading}>
            <Save /> {saving ? '저장 중...' : '담당자 정보 저장'}
          </button>
        </div>
      </form>
      <Toaster />
    </main>
  );
}
