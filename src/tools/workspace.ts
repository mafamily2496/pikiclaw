/**
 * tools/workspace.ts — Workspace file tools.
 *
 *   workspace_list_files — returns workspace path, staged files, and directory listing
 *   workspace_send_file  — sends a file back to the IM chat
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { McpToolModule, ToolContext, ToolResult } from './types.js';
import { toolResult, toolLog } from './types.js';

interface SendFileCallbackResult {
  ok: boolean;
  error?: string;
  statusCode?: number;
  statusMessage?: string;
  bodyPreview?: string;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const tools: McpToolModule['tools'] = [
  {
    name: 'im_list_files',
    description: 'List files in the session workspace.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        subdirectory: {
          type: 'string',
          description: 'Workspace-relative subdirectory.',
        },
      },
    },
  },
  {
    name: 'im_send_file',
    description: 'Send a file to the user in IM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Absolute, workspace-relative, or workdir-relative path.',
        },
        caption: {
          type: 'string',
          description: 'Optional caption.',
        },
        kind: {
          type: 'string',
          enum: ['photo', 'document'],
          description: 'Optional file kind.',
        },
      },
      required: ['path'],
    },
  },
];

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function handleListFiles(args: Record<string, unknown>, ctx: ToolContext): ToolResult {
  const subdir = typeof args?.subdirectory === 'string' ? args.subdirectory : '';
  const dir = subdir ? path.resolve(ctx.workspace, subdir) : ctx.workspace;
  toolLog('im_list_files', `dir=${dir} subdir=${subdir || '(root)'}`);

  // Security: ensure we stay within workspace
  const realWorkspace = safeRealpath(ctx.workspace);
  const realDir = safeRealpath(dir);
  if (!realWorkspace || !realDir || !realDir.startsWith(realWorkspace)) {
    toolLog('im_list_files', `REJECTED path outside workspace: ${dir}`);
    return toolResult('Error: path is outside the workspace', true);
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries.map(e => {
      const entry: Record<string, unknown> = { name: e.name, type: e.isDirectory() ? 'directory' : 'file' };
      if (e.isFile()) {
        try { entry.size = fs.statSync(path.join(dir, e.name)).size; } catch {}
      }
      return entry;
    });
    toolLog('im_list_files', `OK ${files.length} entries`);
    return toolResult(JSON.stringify({
      workspacePath: ctx.workspace,
      stagedFiles: ctx.stagedFiles,
      files,
    }, null, 2));
  } catch (e: any) {
    toolLog('im_list_files', `ERROR ${e.message}`);
    return toolResult(`Error listing directory: ${e.message}`, true);
  }
}

async function handleSendFile(args: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
  const filePath = typeof args?.path === 'string' ? args.path.trim() : '';
  const kind = typeof args?.kind === 'string' ? args.kind : undefined;
  if (!filePath) { toolLog('im_send_file', 'ERROR missing path'); return toolResult('Error: "path" is required', true); }
  if (!ctx.callbackUrl) { toolLog('im_send_file', 'ERROR no callback URL'); return toolResult('Error: MCP callback URL is not configured', true); }
  const callbackTarget = describeSendFileTarget(ctx.callbackUrl);
  toolLog('im_send_file', `path=${filePath} kind=${kind || 'auto'} callback=${callbackTarget}`);

  try {
    const result = await callbackSendFile(ctx.callbackUrl, filePath, {
      caption: typeof args?.caption === 'string' ? args.caption : undefined,
      kind,
    });
    if (result.ok) {
      toolLog('im_send_file', `OK sent ${filePath}`);
      return toolResult(`File sent successfully: ${filePath}`);
    } else {
      const detail = formatSendFileFailure(result);
      toolLog('im_send_file', `FAILED ${detail}`);
      return toolResult(`Failed to send file: ${detail}`, true);
    }
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    toolLog('im_send_file', `ERROR callback=${callbackTarget} ${message}`);
    return toolResult(`Error sending file: ${message}`, true);
  }
}

// ---------------------------------------------------------------------------
// HTTP callback
// ---------------------------------------------------------------------------

function callbackSendFile(
  callbackUrl: string,
  filePath: string,
  opts: { caption?: string; kind?: string },
): Promise<SendFileCallbackResult> {
  const body = JSON.stringify({ path: filePath, ...opts });
  const url = new URL('/send-file', callbackUrl);

  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk; });
      res.on('end', () => {
        const statusCode = res.statusCode;
        const statusMessage = res.statusMessage || undefined;
        const bodyPreview = data ? previewText(data) : undefined;

        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = data ? JSON.parse(data) as Record<string, unknown> : null;
        } catch {}

        if (statusCode && statusCode >= 400) {
          const parsedError = typeof parsed?.error === 'string' ? parsed.error : null;
          resolve({
            ok: false,
            error: parsedError || describeHttpFailure(statusCode, statusMessage, bodyPreview),
            statusCode,
            statusMessage,
            bodyPreview,
          });
          return;
        }

        if (parsed && typeof parsed.ok === 'boolean') {
          resolve({
            ok: parsed.ok,
            error: typeof parsed.error === 'string' ? parsed.error : undefined,
            statusCode,
            statusMessage,
            bodyPreview,
          });
          return;
        }

        resolve({
          ok: false,
          error: describeHttpFailure(statusCode, statusMessage, bodyPreview, 'invalid callback response'),
          statusCode,
          statusMessage,
          bodyPreview,
        });
      });
    });
    req.setTimeout(30_000, () => req.destroy(new Error('send-file callback timed out after 30s')));
    req.on('error', e => reject(e));
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeRealpath(p: string): string | null {
  try { return fs.realpathSync(p); } catch { return null; }
}

function previewText(text: string, max = 400): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= max ? normalized : `${normalized.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

function describeSendFileTarget(callbackUrl: string): string {
  try {
    const url = new URL('/send-file', callbackUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return callbackUrl;
  }
}

function describeHttpFailure(statusCode?: number, statusMessage?: string, bodyPreview?: string, fallback = 'callback request failed'): string {
  const status = statusCode ? `HTTP ${statusCode}${statusMessage ? ` ${statusMessage}` : ''}` : fallback;
  return bodyPreview ? `${status}; body=${bodyPreview}` : status;
}

function formatSendFileFailure(result: SendFileCallbackResult): string {
  const base = result.error?.trim() || describeHttpFailure(result.statusCode, result.statusMessage, result.bodyPreview, 'unknown error');
  if (result.bodyPreview && !base.includes(result.bodyPreview)) {
    return `${base}; body=${result.bodyPreview}`;
  }
  return base;
}

// ---------------------------------------------------------------------------
// Module export
// ---------------------------------------------------------------------------

export const workspaceTools: McpToolModule = {
  tools,
  handle(name, args, ctx) {
    switch (name) {
      case 'im_list_files': return handleListFiles(args, ctx);
      case 'im_send_file': return handleSendFile(args, ctx);
      default: return toolResult(`Unknown workspace tool: ${name}`, true);
    }
  },
};
