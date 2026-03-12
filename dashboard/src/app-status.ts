import { hasPendingChannelValidation } from './channel-status';
import type { AppState } from './types';

type Translate = (key: string) => string;

const APP_STARTUP_LOADING_WINDOW_MS = 15_000;

export function resolveAppStatusBadge(state: AppState | null, t: Translate): {
  badgeVariant: 'ok' | 'warn' | 'accent' | 'muted';
  badgeContent: string;
  dotVariant: 'ok' | 'warn' | 'idle';
  dotPulse: boolean;
} {
  if (!state) {
    return {
      badgeVariant: 'muted',
      badgeContent: t('status.loading'),
      dotVariant: 'warn',
      dotPulse: true,
    };
  }

  if (state.ready && state.bot?.connected) {
    return {
      badgeVariant: 'ok',
      badgeContent: t('status.running'),
      dotVariant: 'ok',
      dotPulse: true,
    };
  }

  if (state.ready && state.bot) {
    return {
      badgeVariant: 'warn',
      badgeContent: t('status.connecting'),
      dotVariant: 'warn',
      dotPulse: true,
    };
  }

  if (state.ready) {
    return {
      badgeVariant: 'accent',
      badgeContent: t('status.ready'),
      dotVariant: 'ok',
      dotPulse: false,
    };
  }

  const withinStartupWindow = !!state.configExists && !!state.bot && state.bot.uptime < APP_STARTUP_LOADING_WINDOW_MS;
  const pendingChannelValidation = hasPendingChannelValidation(state.setupState?.channels || null);
  if (withinStartupWindow || pendingChannelValidation) {
    return {
      badgeVariant: 'muted',
      badgeContent: t('status.loading'),
      dotVariant: 'warn',
      dotPulse: true,
    };
  }

  return {
    badgeVariant: 'warn',
    badgeContent: t('status.needsConfig'),
    dotVariant: 'warn',
    dotPulse: true,
  };
}
