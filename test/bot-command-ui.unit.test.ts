import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Bot } from '../src/bot.ts';
import {
  buildAgentsCommandView,
  buildModelsCommandView,
  buildSessionsCommandView,
  decodeCommandAction,
  encodeCommandAction,
  executeCommandAction,
} from '../src/bot-command-ui.ts';
import { captureEnv, makeTmpDir, restoreEnv } from './support/env.ts';

const envSnapshot = captureEnv(['CODECLAW_CONFIG', 'CODECLAW_WORKDIR']);

beforeEach(() => {
  restoreEnv(envSnapshot);
  vi.clearAllMocks();
  const tmpConfig = makeTmpDir('bot-command-ui-config-');
  process.env.CODECLAW_CONFIG = `${tmpConfig}/setting.json`;
  process.env.CODECLAW_WORKDIR = makeTmpDir('bot-command-ui-workdir-');
});

afterEach(() => {
  restoreEnv(envSnapshot);
});

describe('bot-command-ui action codec', () => {
  it('round-trips supported command actions', () => {
    const actions = [
      { kind: 'sessions.page', page: 2 } as const,
      { kind: 'session.new' } as const,
      { kind: 'session.switch', sessionId: 'sess-123' } as const,
      { kind: 'agent.switch', agent: 'codex' } as const,
      { kind: 'model.switch', modelId: 'claude-sonnet-4-6' } as const,
      { kind: 'effort.set', effort: 'high' } as const,
    ];

    for (const action of actions) {
      expect(decodeCommandAction(encodeCommandAction(action))).toEqual(action);
    }

    expect(decodeCommandAction('ag:not-installed')).toBeNull();
    expect(decodeCommandAction('sp:-1')).toBeNull();
  });
});

describe('bot-command-ui views', () => {
  it('builds shared selection views for sessions, agents, and models', async () => {
    const bot = new Bot();
    const chatId = 100;
    bot.chat(chatId).agent = 'claude';
    bot.setModelForAgent('claude', 'claude-sonnet-4-6');

    vi.spyOn(bot, 'fetchSessions').mockResolvedValue({
      ok: true,
      sessions: [
        {
          sessionId: 'sess-1',
          agent: 'claude',
          workdir: process.env.CODECLAW_WORKDIR!,
          workspacePath: null,
          model: 'claude-sonnet-4-6',
          createdAt: new Date('2026-03-12T08:00:00.000Z').toISOString(),
          title: 'alpha work',
          running: false,
        },
      ],
      error: null,
    } as any);

    vi.spyOn(bot, 'fetchAgents').mockReturnValue({
      ok: true,
      agents: [
        { agent: 'claude', installed: true, version: '1.0.0', path: '/tmp/claude' },
        { agent: 'codex', installed: true, version: '2.0.0', path: '/tmp/codex' },
        { agent: 'gemini', installed: false, version: null, path: null },
      ],
      error: null,
    } as any);

    vi.spyOn(bot, 'fetchModels').mockResolvedValue({
      agent: 'claude',
      models: [
        { id: 'claude-sonnet-4-6', alias: 'sonnet' },
        { id: 'claude-opus-4-6[1m]', alias: 'opus-1m' },
      ],
      sources: ['cli'],
      note: 'local registry',
    } as any);

    const sessionsView = await buildSessionsCommandView(bot, chatId, 0, 5);
    expect(sessionsView.kind).toBe('sessions');
    expect(sessionsView.items[0]).toMatchObject({ label: 'alpha work' });
    expect(sessionsView.rows.at(-1)?.[0]?.action).toEqual({ kind: 'session.new' });

    const agentsView = buildAgentsCommandView(bot, chatId);
    expect(agentsView.kind).toBe('agents');
    expect(agentsView.items[2]).toMatchObject({ label: 'gemini', state: 'unavailable' });
    expect(agentsView.rows[0][0].action).toEqual({ kind: 'agent.switch', agent: 'claude' });

    const modelsView = await buildModelsCommandView(bot, chatId);
    expect(modelsView.kind).toBe('models');
    expect(modelsView.metaLines).toContain('Source: cli');
    expect(modelsView.metaLines).toContain('Thinking Effort: high');
    expect(modelsView.rows[0][0].action).toEqual({ kind: 'model.switch', modelId: 'claude-sonnet-4-6' });
    expect(modelsView.rows[1][2].action).toEqual({ kind: 'effort.set', effort: 'high' });
  });
});

describe('bot-command-ui execution', () => {
  it('executes shared command actions and updates bot state once', async () => {
    const bot = new Bot();
    const chatId = 200;
    const chat = bot.chat(chatId);
    chat.agent = 'claude';

    vi.spyOn(bot, 'fetchSessions').mockResolvedValue({
      ok: true,
      sessions: [
        {
          sessionId: 'sess-42',
          agent: 'claude',
          workdir: process.env.CODECLAW_WORKDIR!,
          workspacePath: '/tmp/workspace',
          model: 'claude-sonnet-4-6',
          createdAt: new Date().toISOString(),
          title: 'feature branch',
          running: false,
        },
      ],
      error: null,
    } as any);

    const sessionResult = await executeCommandAction(bot, chatId, {
      kind: 'session.switch',
      sessionId: 'sess-42',
    });
    expect(sessionResult.kind).toBe('notice');
    expect(bot.chat(chatId).sessionId).toBe('sess-42');

    const agentResult = await executeCommandAction(bot, chatId, {
      kind: 'agent.switch',
      agent: 'codex',
    });
    expect(agentResult.kind).toBe('notice');
    expect(bot.chat(chatId).agent).toBe('codex');
    expect(bot.chat(chatId).sessionId).toBeNull();

    bot.chat(chatId).agent = 'claude';
    const modelResult = await executeCommandAction(bot, chatId, {
      kind: 'model.switch',
      modelId: 'claude-opus-4-6[1m]',
    });
    expect(modelResult.kind).toBe('notice');
    expect(bot.modelForAgent('claude')).toBe('claude-opus-4-6[1m]');

    const effortResult = await executeCommandAction(bot, chatId, {
      kind: 'effort.set',
      effort: 'medium',
    });
    expect(effortResult.kind).toBe('notice');
    expect(bot.effortForAgent('claude')).toBe('medium');

    const noopResult = await executeCommandAction(bot, chatId, {
      kind: 'effort.set',
      effort: 'medium',
    });
    expect(noopResult).toEqual({ kind: 'noop', message: 'Already using medium effort' });
  });
});
