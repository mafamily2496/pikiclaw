/**
 * E2E: full TelegramBot artifact return flow with real Codex + real Telegram.
 *
 * Covers the full chain:
 *   TelegramBot.handleMessage
 *   -> doCodexStream (new session, then resumed session)
 *   -> artifact manifest generation
 *   -> collectArtifacts
 *   -> TelegramChannel.sendFile
 *
 * Requires:
 *   - TELEGRAM_BOT_TOKEN
 *   - a recent chat with the bot (or TELEGRAM_TEST_CHAT_ID)
 *   - `codex` CLI installed and authenticated
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TelegramBot } from '../../src/bot-telegram.ts';
import { TelegramChannel } from '../../src/channel-telegram.ts';
import type { TgContext, TgMessage } from '../../src/channel-telegram.ts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function hasCmd(cmd: string): boolean {
  try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return true; } catch { return false; }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
let CHAT_ID = firstChatId(
  process.env.TELEGRAM_TEST_CHAT_ID,
  process.env.TELEGRAM_ALLOWED_CHAT_IDS,
  process.env.CODECLAW_ALLOWED_IDS,
);
const HAS_CODEX = hasCmd('codex');
const SKIP = !TOKEN || !HAS_CODEX;
const TIMEOUT = 240_000;

let bot: TelegramBot;
let ch: TelegramChannel;
let tmpDir = '';
const sentMsgIds: number[] = [];

beforeAll(async () => {
  if (SKIP) return;

  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bot-tg-artifact-e2e-'));

  process.env.CODECLAW_TOKEN = TOKEN;
  process.env.CODECLAW_WORKDIR = process.cwd();
  process.env.DEFAULT_AGENT = 'codex';
  process.env.CODEX_FULL_ACCESS = 'true';

  bot = new TelegramBot();
  ch = new TelegramChannel({ token: TOKEN, workdir: tmpDir, pollTimeout: 3, apiTimeout: 30 });
  await ch.connect();
  (bot as any).channel = ch;
  await ch.drain();
  await bot.setupMenu();

  if (!CHAT_ID || Number.isNaN(CHAT_ID)) {
    const detected = await ch.getRecentChatId();
    if (!detected) {
      throw new Error('Cannot auto-detect TELEGRAM_TEST_CHAT_ID. Send any message to the bot, then rerun this test.');
    }
    CHAT_ID = detected;
  }

  ch.knownChats.add(CHAT_ID);
  const readyId = await ch.send(
    CHAT_ID,
    '<b>artifact-return E2E</b> starting\n\nAgent: codex\nMode: full chain',
    { parseMode: 'HTML' },
  );
  if (readyId) sentMsgIds.push(readyId);
}, TIMEOUT);

afterAll(async () => {
  ch?.disconnect();
  for (const id of sentMsgIds) {
    await ch?.deleteMessage(CHAT_ID, id).catch(() => {});
  }
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
}, TIMEOUT);

describe.skipIf(SKIP)('bot telegram artifact return e2e', () => {
  it('resumes a codex session and sends returned artifacts to Telegram', async () => {
    const cs = bot.chat(CHAT_ID);
    cs.agent = 'codex';
    cs.sessionId = null;
    cs.codexCumulative = undefined;

    const firstCtx = makeRealCtx();
    const firstTurn: TgMessage = {
      text: 'Reply with exactly: SESSION_READY',
      files: [],
    };
    await (bot as any).handleMessage(firstTurn, firstCtx);

    const resumedSessionId = bot.chat(CHAT_ID).sessionId;
    expect(resumedSessionId).toBeTruthy();

    const uploads: Array<{ filePath: string; opts?: any; msgId: number | null; existedAtSend: boolean }> = [];
    const originalSendFile = ch.sendFile.bind(ch);
    ch.sendFile = (async (chatId: number | string, filePath: string, opts?: any) => {
      const existedAtSend = fs.existsSync(filePath);
      const msgId = await originalSendFile(chatId, filePath, opts);
      uploads.push({ filePath, opts, msgId, existedAtSend });
      if (msgId) sentMsgIds.push(msgId);
      return msgId;
    }) as typeof ch.sendFile;

    try {
      const secondCtx = makeRealCtx();
      const artifactTurn: TgMessage = {
        text: [
          'Create the following files in the artifact directory provided by the system instructions:',
          '1. A small valid PNG file named "screenshot.png".',
          '2. A text file named "console.txt" containing exactly: hello from resumed codex artifact test',
          'Then write the manifest.json exactly as instructed by the system prompt.',
          'Use kind "photo" for screenshot.png and kind "document" for console.txt.',
          'Set captions to "Resumed screenshot" and "Resumed console".',
          'Reply with exactly: ARTIFACTS_CREATED',
        ].join('\n'),
        files: [],
      };
      await (bot as any).handleMessage(artifactTurn, secondCtx);
    } finally {
      ch.sendFile = originalSendFile;
    }

    expect(bot.chat(CHAT_ID).sessionId).toBe(resumedSessionId);
    expect(uploads).toHaveLength(2);
    expect(uploads.every(upload => upload.existedAtSend)).toBe(true);
    expect(uploads.every(upload => !!upload.msgId)).toBe(true);

    const pngUpload = uploads.find(upload => path.basename(upload.filePath) === 'screenshot.png');
    expect(pngUpload).toBeDefined();
    expect(pngUpload?.opts).toMatchObject({ asPhoto: true, caption: 'Resumed screenshot' });

    const txtUpload = uploads.find(upload => path.basename(upload.filePath) === 'console.txt');
    expect(txtUpload).toBeDefined();
    expect(txtUpload?.opts).toMatchObject({ asPhoto: false, caption: 'Resumed console' });
  }, TIMEOUT);
});

function makeRealCtx(chatId = CHAT_ID, messageId = 1) {
  const state = { sentTexts: [] as string[] };
  return {
    chatId,
    messageId,
    from: { id: CHAT_ID, username: 'artifact_e2e', firstName: 'Artifact' },
    reply: async (text: string, opts?: any) => {
      state.sentTexts.push(text);
      const msgId = await ch.send(chatId, text, { ...opts, replyTo: messageId });
      if (msgId) sentMsgIds.push(msgId);
      return msgId;
    },
    editReply: async (msgId: number, text: string, opts?: any) => {
      await ch.editMessage(chatId, msgId, text, opts);
    },
    answerCallback: async () => {},
    channel: ch,
    raw: {},
    get sentTexts() { return state.sentTexts; },
  } as TgContext & { sentTexts: string[] };
}

function firstChatId(...values: Array<string | undefined>): number {
  for (const value of values) {
    for (const token of String(value ?? '').split(',')) {
      const trimmed = token.trim();
      if (!trimmed) continue;
      const parsed = parseInt(trimmed, 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return Number.NaN;
}
