import { describe, expect, it } from 'vitest';
import { shouldCacheChannelStates } from '../src/channel-states.ts';

describe('channel state caching', () => {
  it('does not cache unresolved validation placeholders', () => {
    expect(shouldCacheChannelStates([
      {
        channel: 'telegram',
        configured: true,
        ready: false,
        validated: false,
        status: 'checking',
        detail: 'Validating Telegram credentials...',
      },
    ])).toBe(false);
  });

  it('caches validated channel states', () => {
    expect(shouldCacheChannelStates([
      {
        channel: 'telegram',
        configured: true,
        ready: true,
        validated: true,
        status: 'ready',
        detail: '@codeclaw_bot',
      },
      {
        channel: 'feishu',
        configured: false,
        ready: false,
        validated: false,
        status: 'missing',
        detail: 'Feishu credentials are not configured.',
      },
      {
        channel: 'whatsapp',
        configured: true,
        ready: false,
        validated: true,
        status: 'invalid',
        detail: 'Unsupported.',
      },
    ])).toBe(true);
  });
});
