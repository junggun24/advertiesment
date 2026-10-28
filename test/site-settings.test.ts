import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSiteSettings,
  mergeSiteSettings,
} from '../lib/content-types.ts';

void test('fills new consultant fields for existing site records', () => {
  const settings = mergeSiteSettings({
    companyName: '기존 회사명',
    consultantName: '기존 담당자 과장',
  });

  assert.equal(settings.companyName, '기존 회사명');
  assert.equal(settings.consultantName, '기존 담당자 과장');
  assert.equal(settings.consultantPhone, defaultSiteSettings.consultantPhone);
  assert.equal(settings.consultantImage, '');
});

void test('keeps every saved consultant profile value', () => {
  const settings = mergeSiteSettings({
    email: 'old-company@example.com',
    consultantDepartment: '공공사업팀',
    consultantRole: '현장 상담',
    consultantPhone: '010-0000-0000',
    consultantEmail: 'person@example.com',
    consultantHours: '평일 10:00–17:00',
    consultantImage: '/api/uploads/uploads/profile.webp',
    consultantIntroduction: '현장 중심으로 상담합니다.',
  });

  assert.equal(settings.consultantDepartment, '공공사업팀');
  assert.equal(settings.consultantRole, '현장 상담');
  assert.equal(settings.consultantPhone, '010-0000-0000');
  assert.equal(settings.consultantEmail, 'person@example.com');
  assert.equal(settings.email, 'person@example.com');
  assert.equal(settings.consultantHours, '평일 10:00–17:00');
  assert.equal(settings.consultantImage, '/api/uploads/uploads/profile.webp');
  assert.equal(settings.consultantIntroduction, '현장 중심으로 상담합니다.');
});
