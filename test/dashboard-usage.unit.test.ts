import { describe, expect, it } from 'vitest';
import { formatUsageSummary, usageBadgeText, usageTone } from '../dashboard/src/usage.ts';
import type { UsageResult } from '../dashboard/src/types.ts';

const t = (key: string) => key;

describe('dashboard usage presentation', () => {
  it('surfaces exhausted windows instead of reporting usage as unavailable', () => {
    const usage: UsageResult = {
      ok: true,
      agent: 'claude',
      source: 'oauth-api',
      capturedAt: '2026-03-12T10:00:00.000Z',
      status: 'limit_reached',
      error: null,
      windows: [
        { label: '5h', usedPercent: 26, remainingPercent: 74, resetAt: null, resetAfterSeconds: null, status: 'allowed' },
        { label: '7d', usedPercent: 99, remainingPercent: 1, resetAt: null, resetAfterSeconds: null, status: 'warning' },
        { label: 'Extra', usedPercent: 100, remainingPercent: 0, resetAt: null, resetAfterSeconds: null, status: 'limit_reached' },
      ],
    };

    expect(usageTone(usage)).toBe('err');
    expect(usageBadgeText(usage)).toBe('limit_reached');
    expect(formatUsageSummary(usage, t)).toBe(
      '5h 26% used status=allowed · 7d 99% used status=warning · Extra 100% used status=limit_reached',
    );
  });

  it('keeps failed queries on the unavailable branch', () => {
    const usage: UsageResult = {
      ok: false,
      agent: 'claude',
      source: null,
      capturedAt: null,
      status: null,
      error: 'No recent Claude usage data found.',
      windows: [],
    };

    expect(usageTone(usage)).toBe('err');
    expect(usageBadgeText(usage)).toBe('unavailable');
    expect(formatUsageSummary(usage, t)).toBe('No recent Claude usage data found.');
  });
});
