import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildSetupGuide, collectSetupState, isSetupReady } from '../src/onboarding.ts';
import { captureEnv, makeTmpDir, restoreEnv } from './support/env.ts';

const ENV_KEYS = [
  'HOME',
] as const;

const envSnapshot = captureEnv(ENV_KEYS);

describe('onboarding helpers', () => {
  let homeDir: string;

  beforeEach(() => {
    restoreEnv(envSnapshot);
    homeDir = makeTmpDir('codeclaw-home-');
    process.env.HOME = homeDir;
  });

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it('renders an English first-time setup guide for missing agent and token', () => {
    const state = collectSetupState({
      agents: [
        { agent: 'claude', installed: false, path: null, version: null },
        { agent: 'codex', installed: false, path: null, version: null },
      ],
      channel: 'telegram',
      tokenProvided: false,
    });

    const guide = buildSetupGuide(state, '0.2.22');

    expect(guide).toContain('First-time setup');
    expect(guide).toContain('MISSING  Claude Code is not installed.');
    expect(guide).toContain('Install with: npm install -g @anthropic-ai/claude-code');
    expect(guide).toContain('Install with: npm install -g @openai/codex');
    expect(guide).toContain('No Telegram token configured in ~/.codeclaw/setting.json');
    expect(guide).toContain('Open Telegram and search for @BotFather');
    expect(guide).toContain('npx codeclaw@latest -t <YOUR_BOT_TOKEN>');
  });

  it('marks installed agent as ready in doctor mode', () => {
    const state = collectSetupState({
      agents: [
        { agent: 'claude', installed: true, path: '/usr/local/bin/claude', version: '1.0.79' },
        { agent: 'codex', installed: false, path: null, version: null },
      ],
      channel: 'telegram',
      tokenProvided: true,
    });

    const guide = buildSetupGuide(state, '0.2.22', { doctor: true });

    expect(guide).toContain('Setup check');
    expect(guide).toContain('OK       Claude Code found at /usr/local/bin/claude (1.0.79)');
    expect(guide).toContain('OK       A Telegram token was provided.');
    expect(guide).toContain('npx codeclaw@latest --doctor');
  });

  it('does not report setup ready when a configured IM channel fails live validation', () => {
    const state = collectSetupState({
      agents: [
        { agent: 'claude', installed: true, path: '/usr/local/bin/claude', version: '1.0.79' },
      ],
      channel: 'telegram',
      tokenProvided: true,
      channels: [{
        channel: 'telegram',
        configured: true,
        ready: false,
        validated: true,
        status: 'invalid',
        detail: 'Telegram rejected this token: Unauthorized',
      }],
    });

    expect(isSetupReady(state)).toBe(false);
  });
});
