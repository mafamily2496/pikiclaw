# Integrating a New IM Platform

This guide reflects the current `pikiclaw` architecture, where Telegram and Feishu already share the same core bot pipeline.

## What Already Exists

You do not need to reimplement:

- session state
- agent dispatch
- live stream orchestration
- command data fetching
- session/model/skill selection logic
- MCP-backed file return

Those pieces already live in shared modules.

## The Layers You Plug Into

```text
cli.ts
  -> bot-xxx.ts
     -> bot-commands.ts
     -> bot-command-ui.ts
     -> bot-handler.ts
     -> bot-telegram-live-preview.ts
  -> channel-xxx.ts
```

## Files to Add

### 1. `channel-xxx.ts`

Implement the transport by extending `Channel` from `src/channel-base.ts`.

Responsibilities:

- connect and authenticate
- receive messages / commands / callbacks
- send, edit, delete messages
- upload and download files
- expose channel capability flags

Your transport should not know about sessions, agents, or skills.

### 2. `bot-xxx-render.ts`

Render shared data into platform-specific output.

Typical responsibilities:

- `/start` formatting
- `/status` formatting
- host/runtime formatting
- command selection cards or keyboards
- live preview rendering
- final reply rendering

You can use:

- `bot-commands.ts` for structured data
- `bot-command-ui.ts` for shared session/agent/model/skill views
- `bot-telegram-live-preview.ts` for throttled preview updates

### 3. `bot-xxx.ts`

Create the thin orchestration layer.

Typical responsibilities:

- wire channel handlers
- route slash commands
- call `handleIncomingMessage()` for free-text messages
- bind IM-specific file send callbacks for MCP bridge delivery
- create the platform renderer + preview controller

### 4. `cli.ts`

Register the new channel in the channel launcher.

## Shared Modules You Should Reuse

### `bot-commands.ts`

Use this for data, not rendering.

Key functions:

- `getStartData()`
- `getStatusDataAsync()`
- `getHostDataSync()`
- `getSessionsPageData()`
- `getModelsListData()`
- `getSkillsListData()`
- `resolveSkillPrompt()`

### `bot-command-ui.ts`

Use this when the channel needs session/agent/model/skill selection UIs.

Key helpers:

- `buildSessionsCommandView()`
- `buildAgentsCommandView()`
- `buildModelsCommandView()`
- `buildSkillsCommandView()`
- `decodeCommandAction()`
- `executeCommandAction()`

This prevents each IM integration from inventing its own selection logic.

### `bot-handler.ts`

This is the standard message pipeline:

1. resolve session
2. create placeholder
3. create live preview
4. stream agent output
5. send final reply
6. deliver artifacts / MCP file sends

Your platform implementation mostly supplies hooks for those steps.

### `bot-telegram-live-preview.ts`

Despite the filename, `LivePreview` is channel-agnostic.

You provide:

- `renderInitial(agent)`
- `renderStream(input)`

and the controller handles edit throttling and heartbeat timing.

## Minimal Bot Skeleton

```ts
import { Bot } from './bot.js';
import { handleIncomingMessage, type MessagePipeline } from './bot-handler.js';
import { LivePreview } from './bot-telegram-live-preview.js';
import { getStartData, getStatusDataAsync } from './bot-commands.js';
import { XxxChannel } from './channel-xxx.js';
import { renderStart, renderStatus, xxxPreviewRenderer } from './bot-xxx-render.js';

export class XxxBot extends Bot {
  private channel!: XxxChannel;

  private async cmdStart(ctx: XxxContext) {
    const data = getStartData(this, ctx.chatId);
    await ctx.reply(renderStart(data));
  }

  private async cmdStatus(ctx: XxxContext) {
    const data = await getStatusDataAsync(this, ctx.chatId);
    await ctx.reply(renderStatus(data));
  }

  private createPipeline(): MessagePipeline<XxxContext> {
    return {
      getChatId: ctx => ctx.chatId,
      getMessageId: ctx => ctx.messageId,
      resolveSession: (ctx, text, files) => this.resolveIncomingSession(ctx, text, files),
      createPlaceholder: async (ctx, session) => {
        const messageId = await this.channel.send(ctx.chatId, xxxPreviewRenderer.renderInitial(session.agent));
        return messageId ? { messageId } : null;
      },
      createLivePreview: (ctx, placeholder, session) => new LivePreview({
        agent: session.agent,
        chatId: ctx.chatId,
        placeholderMessageId: placeholder.messageId,
        channel: this.channel,
        renderer: xxxPreviewRenderer,
        startTimeMs: Date.now(),
        canEditMessages: true,
        canSendTyping: false,
        parseMode: 'Markdown',
        log: msg => this.log(msg),
      }),
      createMcpSendFile: (ctx) => this.createMcpSendFileCallback(ctx),
      sendFinalReply: async (ctx, placeholder, session, result) => {
        // platform-specific final formatting
      },
      sendArtifacts: async (ctx, placeholder, artifacts) => {
        // optional
      },
      onError: async (ctx, placeholder, session, error) => {
        // platform-specific error reply
      },
    };
  }
}
```

## Channel Checklist

- `channel-xxx.ts` implements `Channel`
- `bot-xxx-render.ts` renders command and stream output
- `bot-xxx.ts` uses shared pipeline
- `cli.ts` launches the new bot
- `user-config.ts` stores any new credentials
- `config-validation.ts` validates those credentials if needed
- `onboarding.ts` / `dashboard.ts` expose setup state if needed
- unit tests cover transport and rendering

## Capability Questions To Answer Early

Before you implement a new channel, decide:

- Can messages be edited after send?
- Are callback buttons supported?
- Is file upload available?
- Is file download available?
- Are threads supported?
- Is there a native command menu?
- Is there a typing indicator?

These answers drive the `ChannelCapabilities` flags and influence how previews and command UIs should behave.

## Good Reference Implementations

- Telegram reference:
  - `src/channel-telegram.ts`
  - `src/bot-telegram.ts`
  - `src/bot-telegram-render.ts`

- Feishu reference:
  - `src/channel-feishu.ts`
  - `src/bot-feishu.ts`
  - `src/bot-feishu-render.ts`

Feishu is the better reference if your target platform prefers cards over plain text.
