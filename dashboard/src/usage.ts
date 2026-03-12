import type { UsageResult } from './types';

export function usageTone(usage: UsageResult | null): 'ok' | 'warn' | 'err' {
  if (!usage?.ok) return 'err';
  if (usage.status === 'limit_reached') return 'err';
  if (usage.status === 'warning' || usage.windows.some(window => window.status === 'warning')) return 'warn';
  return 'ok';
}

export function usageBadgeText(usage: UsageResult | null): string {
  if (!usage?.ok) return 'unavailable';
  if (usage.status) return usage.status;
  const firstWindowStatus = usage.windows.find(window => window.status)?.status;
  return firstWindowStatus || 'ok';
}

export function formatUsageWindow(window: NonNullable<UsageResult['windows']>[number], t: (key: string) => string): string {
  const parts: string[] = [];
  if (window.label) parts.push(window.label);
  if (window.usedPercent != null) parts.push(`${window.usedPercent.toFixed(0)}% used`);
  if (window.status) parts.push(`status=${window.status}`);
  return parts.join(' ') || t('config.balanceUnavailable');
}

export function formatUsageSummary(usage: UsageResult | null, t: (key: string) => string): string {
  if (!usage?.ok) return usage?.error || t('config.balanceUnavailable');
  if (!usage.windows.length) return usage.error || usageBadgeText(usage);
  return usage.windows.map(window => formatUsageWindow(window, t)).join(' · ');
}
