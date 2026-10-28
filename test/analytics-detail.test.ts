import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  analyticsDetailSql,
  analyticsPeriods,
  mergeAnalyticsRows,
  type AnalyticsBaselineRow,
  type AnalyticsCountRow,
  type AnalyticsInterval,
} from '../lib/analytics-detail.ts';

function database() {
  const db = new DatabaseSync(':memory:');
  const migration = readFileSync(
    new URL('../drizzle/0016_site_visitor_analytics.sql', import.meta.url),
    'utf8',
  ).replaceAll('--> statement-breakpoint', '');
  db.exec(migration);
  db.exec(`CREATE TABLE inquiries (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL
  )`);
  db.exec(`
    INSERT INTO site_visitors (visitor_hash, first_seen_at) VALUES
      ('old-visitor', '2026-08-01 00:00:00'),
      ('visitor-a', '2026-10-01 00:00:00'),
      ('visitor-b', '2026-10-02 00:00:00');
    INSERT INTO site_visitor_days (visit_date, visitor_hash) VALUES
      ('2026-10-01', 'visitor-a'),
      ('2026-10-02', 'visitor-a'),
      ('2026-10-02', 'visitor-b');
    INSERT INTO inquiries (created_at) VALUES
      ('2026-08-01 00:00:00'),
      ('2026-10-01 00:00:00'),
      ('2026-10-02 00:00:00');
  `);
  return db;
}

function detail(interval: AnalyticsInterval) {
  const db = database();
  const periods = analyticsPeriods('2026-10-03', interval);
  const rangeStart = periods[0].periodStart;
  const sql = analyticsDetailSql(interval);
  const visitors = db
    .prepare(sql.visitors)
    .all(rangeStart) as AnalyticsCountRow[];
  const newVisitors = db
    .prepare(sql.newVisitors)
    .all(rangeStart) as AnalyticsCountRow[];
  const inquiries = db
    .prepare(sql.inquiries)
    .all(rangeStart) as AnalyticsCountRow[];
  const baseline = db
    .prepare(sql.baseline)
    .get(rangeStart, rangeStart) as AnalyticsBaselineRow;
  return mergeAnalyticsRows(
    periods,
    visitors,
    newVisitors,
    inquiries,
    baseline,
  );
}

void test('builds 30 daily, 12 weekly, and 12 monthly periods', () => {
  assert.equal(analyticsPeriods('2026-10-28', 'day').length, 30);
  assert.equal(analyticsPeriods('2026-10-28', 'week').length, 12);
  assert.equal(analyticsPeriods('2026-10-28', 'month').length, 12);
  assert.deepEqual(analyticsPeriods('2026-10-28', 'week').at(-1), {
    periodStart: '2026-10-26',
    periodEnd: '2026-11-01',
  });
});

void test('counts daily visitors once and carries cumulative totals forward', () => {
  const rows = detail('day');
  const octoberFirst = rows.find((row) => row.periodStart === '2026-10-01');
  const octoberSecond = rows.find((row) => row.periodStart === '2026-10-02');
  const octoberThird = rows.find((row) => row.periodStart === '2026-10-03');

  assert.deepEqual(octoberFirst, {
    periodStart: '2026-10-01',
    periodEnd: '2026-10-01',
    visitors: 1,
    visitorsCumulative: 2,
    inquiries: 1,
    inquiriesCumulative: 2,
  });
  assert.equal(octoberSecond?.visitors, 2);
  assert.equal(octoberSecond?.visitorsCumulative, 3);
  assert.equal(octoberSecond?.inquiriesCumulative, 3);
  assert.equal(octoberThird?.visitors, 0);
  assert.equal(octoberThird?.visitorsCumulative, 3);
  assert.equal(octoberThird?.inquiriesCumulative, 3);
});

void test('deduplicates the same visitor inside weekly and monthly buckets', () => {
  const weekly = detail('week').find((row) => row.periodStart === '2026-09-28');
  const monthly = detail('month').find(
    (row) => row.periodStart === '2026-10-01',
  );
  assert.equal(weekly?.visitors, 2);
  assert.equal(weekly?.visitorsCumulative, 3);
  assert.equal(monthly?.visitors, 2);
  assert.equal(monthly?.visitorsCumulative, 3);
});
