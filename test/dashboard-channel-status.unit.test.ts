import { describe, expect, it } from 'vitest';
import { channelBadgeState, channelSummaryText, hasPendingChannelValidation } from '../dashboard/src/channel-status.ts';
import type { ChannelSetupState } from '../dashboard/src/types.ts';

const messages: Record<string, string> = {
  'config.clickConfig': 'Click to configure',
  'config.configured': 'Configured',
  'config.validating': 'Checking',
  'config.validationFailed': 'Validation failed',
  'status.needsConfig': 'Needs Config',
};

const t = (key: string) => messages[key] || key;

describe('dashboard channel status presentation', () => {
  it('treats unresolved validation as checking instead of failed', () => {
    const channel: ChannelSetupState = {
      channel: 'telegram',
      configured: true,
      ready: false,
      validated: false,
      status: 'checking',
      detail: 'Validating Telegram credentials...',
    };

    expect(channelBadgeState(channel, t)).toEqual({ label: 'Checking', variant: 'accent' });
    expect(channelSummaryText(channel, t)).toBe('Validating Telegram credentials...');
    expect(hasPendingChannelValidation([channel])).toBe(true);
  });

  it('keeps validated failures marked as failed', () => {
    const channel: ChannelSetupState = {
      channel: 'telegram',
      configured: true,
      ready: false,
      validated: true,
      status: 'invalid',
      detail: 'Telegram rejected this token: Unauthorized',
    };

    expect(channelBadgeState(channel, t)).toEqual({ label: 'Validation failed', variant: 'warn' });
    expect(channelSummaryText(channel, t)).toBe('Telegram rejected this token: Unauthorized');
    expect(hasPendingChannelValidation([channel])).toBe(false);
  });
});
