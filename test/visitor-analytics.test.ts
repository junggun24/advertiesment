import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  DASHBOARD_STATS_SQL,
  hashVisitorToken,
  isVisitorToken,
  UPSERT_VISITOR_DAY_SQL,
  UPSERT_VISITOR_SQL,
  visitorCookie,
  visitorTokenFromCookie,
} from '../lib/visitor-analytics.ts';

const visitorId = 'b6b73f22-b8eb-4ef0-a3cc-0f2c15b78a52';

void test('accepts only UUID visitor identifiers and reads the analytics cookie', () => {
  assert.equal(isVisitorToken(visitorId), true);
  assert.equal(isVisitorToken('not-a-uuid'), false);
  assert.equal(
    visitorTokenFromCookie(`theme=dark; oic_visitor_id=${visitorId}; a=1`),
    visitorId,
  );
  assert.equal(visitorTokenFromCookie('oic_visitor_id=invalid'), '');
});

void test('hashes visitor identifiers deterministically without storing the raw value', async () => {
  const first = await hashVisitorToken(visitorId);
  const second = await hashVisitorToken(visitorId);
  assert.equal(first, second);
  assert.equal(first.length, 64);
  assert.equal(first.includes(visitorId), false);
});

void test('creates a one-year secure first-party visitor cookie', () => {
  const cookie = visitorCookie(
    visitorId,
    new Request('https://dsko.co.kr/api/analytics/visit'),
  );
  assert.match(cookie, /^oic_visitor_id=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=31536000/);
  assert.match(cookie, /Secure/);
});

void test('counts daily and cumulative visitors without double-counting page views', () => {
  const db = new DatabaseSync(':memory:');
  const migration = readFileSync(
    new URL('../drizzle/0016_site_visitor_analytics.sql', import.meta.url),
    'utf8',
  ).replaceAll('--> statement-breakpoint', '');
  db.exec(migration);
  db.exec(`CREATE TABLE inquiries (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const visitor = db.prepare(UPSERT_VISITOR_SQL);
  const visitorDay = db.prepare(UPSERT_VISITOR_DAY_SQL);
  visitor.run('visitor-a');
  visitorDay.run('visitor-a');
  visitor.run('visitor-a');
  visitorDay.run('visitor-a');
  visitor.run('visitor-b');
  visitorDay.run('visitor-b');
  db.exec('INSERT INTO inquiries DEFAULT VALUES');

  const stats = db.prepare(DASHBOARD_STATS_SQL).get() as Record<
    string,
    number | string
  >;
  assert.equal(stats.visitors_today, 2);
  assert.equal(stats.visitors_total, 2);
  assert.equal(stats.inquiries_today, 1);
  assert.equal(stats.inquiries_total, 1);
  assert.equal(
    db
      .prepare(
        "SELECT page_views FROM site_visitors WHERE visitor_hash='visitor-a'",
      )
      .get()?.page_views,
    2,
  );
});
