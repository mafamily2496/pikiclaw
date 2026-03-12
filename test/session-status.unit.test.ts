import { describe, expect, it } from 'vitest';
import { getSessionStatusForBot, getSessionStatusForChat } from '../src/session-status.ts';

describe('session-status', () => {
  it('marks a chat-selected runtime session as current and running', () => {
    const bot = {
      sessionStates: new Map([
        ['codex:sess-1', { key: 'codex:sess-1', runningTaskIds: new Set(['task-1']) }],
      ]),
    } as any;

    const chat = { agent: 'codex', sessionId: 'sess-1', activeSessionKey: 'codex:sess-1' } as any;
    const session = { agent: 'codex', sessionId: 'sess-1', running: false } as any;

    expect(getSessionStatusForChat(bot, chat, session)).toMatchObject({
      isCurrent: true,
      isRunning: true,
    });
  });

  it('falls back to the chat session id when no runtime exists', () => {
    const bot = { sessionStates: new Map() } as any;
    const chat = { agent: 'claude', sessionId: 'legacy-1', activeSessionKey: null } as any;
    const session = { agent: 'claude', sessionId: 'legacy-1', running: true } as any;

    expect(getSessionStatusForChat(bot, chat, session)).toMatchObject({
      isCurrent: true,
      isRunning: true,
      runtime: null,
    });
  });

  it('marks a session as current when any chat has selected its runtime', () => {
    const bot = {
      sessionStates: new Map([
        ['codex:sess-2', { key: 'codex:sess-2', runningTaskIds: new Set() }],
      ]),
      chats: new Map([
        [1, { agent: 'codex', sessionId: 'sess-2', activeSessionKey: 'codex:sess-2' }],
      ]),
    } as any;

    const session = { agent: 'codex', sessionId: 'sess-2', running: false } as any;

    expect(getSessionStatusForBot(bot, session)).toMatchObject({
      isCurrent: true,
      isRunning: false,
    });
  });

  it('falls back to any chat session id when runtime has not been materialized', () => {
    const bot = {
      sessionStates: new Map(),
      chats: new Map([
        [1, { agent: 'claude', sessionId: 'sess-3', activeSessionKey: null }],
      ]),
    } as any;

    const session = { agent: 'claude', sessionId: 'sess-3', running: false } as any;

    expect(getSessionStatusForBot(bot, session)).toMatchObject({
      isCurrent: true,
      isRunning: false,
      runtime: null,
    });
  });
});
