import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeishuBot } from '../src/bot-feishu.ts';

const ENV_KEYS = ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'] as const;
const savedEnv = new Map<string, string | undefined>();

describe('FeishuBot artifact failures', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    for (const key of ENV_KEYS) savedEnv.set(key, process.env[key]);
    process.env.FEISHU_APP_ID = 'test-app-id';
    process.env.FEISHU_APP_SECRET = 'test-app-secret';
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv.get(key);
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('returns upload error details to the chat when artifact delivery fails', async () => {
    const bot = new FeishuBot();
    const sends: string[] = [];

    (bot as any).channel = {
      sendFile: vi.fn(async () => {
        throw new Error('Image upload failed: invalid image');
      }),
      send: vi.fn(async (_chatId: string, text: string) => {
        sends.push(text);
        return 'msg-1';
      }),
    };

    await (bot as any).sendArtifacts(
      { chatId: 'chat-1' },
      [{ filePath: '/tmp/desktop.png', filename: 'desktop.png', kind: 'photo' }],
    );

    expect(sends).toHaveLength(1);
    expect(sends[0]).toContain('Artifact upload failed: desktop.png');
    expect(sends[0]).toContain('Error: Error: Image upload failed: invalid image');

    (bot as any).userConfigUnsubscribe?.();
  });

  it('shows a switch-success notice plus the last session turn preview when switching sessions', async () => {
    const bot = new FeishuBot();
    const sends: string[] = [];
    const edits: string[] = [];
    const sessionId = 'sess-feishu-preview';

    (bot as any).channel = {
      send: vi.fn(async (_chatId: string, text: string) => {
        sends.push(text);
        return 'msg-2';
      }),
      editMessage: vi.fn(async (_chatId: string, _messageId: string, text: string) => {
        edits.push(text);
      }),
    };

    vi.spyOn(bot, 'fetchSessions').mockResolvedValue({
      ok: true,
      sessions: [{
        sessionId,
        agent: 'claude',
        workdir: process.env.CODECLAW_WORKDIR!,
        workspacePath: '/tmp/workspace',
        model: 'claude-sonnet-4-6',
        createdAt: new Date().toISOString(),
        title: 'history preview',
        running: false,
      }],
      error: null,
    } as any);

    vi.spyOn(bot, 'fetchSessionTail').mockResolvedValue({
      ok: true,
      messages: [
        { role: 'user', text: '请继续上次的分析\n第二行原样保留' },
        { role: 'assistant', text: '## Summary\nUse **bold** and `code`.' },
      ],
      error: null,
    });

    await (bot as any).handleCallback(`sess:${sessionId}`, {
      chatId: 'chat-1',
      messageId: 'msg-1',
      from: { openId: 'ou_x' },
      editReply: vi.fn(async (_msgId: string, text: string) => {
        edits.push(text);
      }),
      channel: (bot as any).channel,
      raw: {},
    });

    expect(edits).toEqual([
      `**Session Switched**\n\n\`${sessionId}\`\n\nSwitched successfully`,
    ]);
    expect(bot.chat('chat-1').sessionId).toBe(sessionId);
    expect(sends).toHaveLength(1);
    expect(sends[0]).toContain('**Recent Context**');
    expect(sends[0]).toContain('**User**');
    expect(sends[0]).toContain('> 请继续上次的分析');
    expect(sends[0]).toContain('第二行原样保留');
    expect(sends[0]).toContain('**Assistant**');
    expect(sends[0]).toContain('## Summary');

    (bot as any).userConfigUnsubscribe?.();
  });
});
