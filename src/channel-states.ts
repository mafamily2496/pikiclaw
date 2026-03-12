import type { ChannelSetupState } from './onboarding.js';

export function shouldCacheChannelStates(channels: readonly ChannelSetupState[]): boolean {
  return channels.every(channel => !channel.configured || channel.validated);
}
