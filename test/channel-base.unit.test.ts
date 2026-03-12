import { describe, expect, it } from 'vitest';
import { supportsChannelCapability } from '../src/channel-base.ts';

describe('supportsChannelCapability', () => {
  it('defaults to false when a channel does not declare the capability', () => {
    expect(supportsChannelCapability({}, 'editMessages')).toBe(false);
    expect(supportsChannelCapability(null, 'typingIndicators')).toBe(false);
  });

  it('returns the declared capability value', () => {
    expect(supportsChannelCapability({ capabilities: { editMessages: true } }, 'editMessages')).toBe(true);
    expect(supportsChannelCapability({ capabilities: { editMessages: false } }, 'editMessages')).toBe(false);
  });
});
