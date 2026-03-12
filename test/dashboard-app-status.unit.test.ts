import { describe, expect, it } from 'vitest';
import { resolveAppStatusBadge } from '../dashboard/src/app-status.ts';
import type { AppState } from '../dashboard/src/types.ts';

const messages: Record<string, string> = {
  'status.loading': 'Loading',
  'status.running': 'Running',
  'status.connecting': 'Connecting',
  'status.ready': 'Ready',
  'status.needsConfig': 'Needs Config',
};

const t = (key: string) => messages[key] || key;

function makeState(patch: Partial<AppState> = {}): AppState {
  return {
    version: '0.0.0',
    ready: false,
    configExists: false,
    config: {},
    runtimeWorkdir: '/tmp',
    setupState: {
      channel: 'telegram',
      tokenProvided: false,
      agents: [],
      channels: [],
    },
    permissions: {},
    platform: 'darwin',
    pid: 1,
    nodeVersion: '25.0.0',
    bot: null,
    ...patch,
  };
}

describe('dashboard app status badge', () => {
  it('shows loading during startup when a persisted config exists', () => {
    const badge = resolveAppStatusBadge(makeState({
      configExists: true,
      bot: {
        workdir: '/tmp',
        defaultAgent: 'codex',
        uptime: 2_000,
        connected: false,
        stats: { totalTurns: 0, totalInputTokens: 0, totalOutputTokens: 0 },
        activeTasks: 0,
        sessions: 0,
      },
    }), t);

    expect(badge.badgeContent).toBe('Loading');
    expect(badge.badgeVariant).toBe('muted');
  });

  it('shows needs config when no persisted config exists', () => {
    const badge = resolveAppStatusBadge(makeState(), t);

    expect(badge.badgeContent).toBe('Needs Config');
    expect(badge.badgeVariant).toBe('warn');
  });

  it('falls back to needs config after startup if config is still not ready', () => {
    const badge = resolveAppStatusBadge(makeState({
      configExists: true,
      bot: {
        workdir: '/tmp',
        defaultAgent: 'codex',
        uptime: 30_000,
        connected: false,
        stats: { totalTurns: 0, totalInputTokens: 0, totalOutputTokens: 0 },
        activeTasks: 0,
        sessions: 0,
      },
      setupState: {
        channel: 'telegram',
        tokenProvided: true,
        agents: [],
        channels: [{
          channel: 'telegram',
          configured: true,
          ready: false,
          validated: true,
          status: 'invalid',
          detail: 'Telegram rejected this token: Unauthorized',
        }],
      },
    }), t);

    expect(badge.badgeContent).toBe('Needs Config');
    expect(badge.badgeVariant).toBe('warn');
  });
});
