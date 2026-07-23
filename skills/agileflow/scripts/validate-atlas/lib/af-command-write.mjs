/**
 * 写入 atlas/logs/af-commands.md（validate 与 CLI 共用；勿依赖 cli/ 目录，安装副本常无 cli）
 */
import fs from 'node:fs';
import path from 'node:path';

export const AF_COMMANDS_REL = path.join('atlas', 'logs', 'af-commands.md');

const HEADER = `# af-commands（指令日志）

> 一行一条；由总控显式执行 \`agileflow log\` 追加。gate 只读校验，不自动补。格式 → skill \`phases/quick-commands.md\` §指令日志。

`;

/**
 * 截断摘要到 ≤ max 个字符
 * @param {string} text
 * @param {number} [max]
 */
export function truncateSummary(text, max = 15) {
  const s = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  return s.slice(0, max);
}

/**
 * @param {string} [raw]
 */
export function normalizeStatus(raw) {
  const v = String(raw || 'ok').trim().toLowerCase();
  if (['✅', 'ok', 'done', 'pass', 'success', '完成'].includes(v)) return '✅';
  if (['⬆️', 'upgrade', 'up', '升级'].includes(v)) return '⬆️';
  if (['❌', 'fail', 'failed', 'error', '失败'].includes(v)) return '❌';
  if (['⏸️', 'pause', 'paused', 'pending', '中断', '停'].includes(v)) return '⏸️';
  if (/^[✅⬆️❌⏸️]$/.test(String(raw || '').trim())) return String(raw).trim();
  return '✅';
}

/**
 * @param {string} door
 */
export function normalizeDoor(door) {
  const d = String(door || '').trim();
  if (!d) return '';
  return d.startsWith('/') ? d : `/${d}`;
}

/**
 * @param {{ door: string, summary: string, route: string, status?: string, date?: string }} opts
 */
export function formatLogLine(opts) {
  const door = normalizeDoor(opts.door);
  const summary = truncateSummary(opts.summary);
  const date = opts.date || new Date().toISOString().slice(0, 10);
  let route = String(opts.route || '').trim();
  if (route && !route.startsWith('→')) route = `→${route}`;
  if (!route) route = '→?';
  const status = normalizeStatus(opts.status);
  return `[${door}][${summary}][${date}][${route}][${status}]`;
}

/**
 * @param {string} projectRoot
 * @param {{ door: string, summary: string, route: string, status?: string, date?: string }} opts
 * @returns {{ path: string, line: string, created: boolean }}
 */
export function appendAfCommand(projectRoot, opts) {
  const root = path.resolve(projectRoot);
  const filePath = path.join(root, AF_COMMANDS_REL);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let created = false;
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, HEADER, 'utf8');
    created = true;
  }

  const line = formatLogLine(opts);
  const prev = fs.readFileSync(filePath, 'utf8');
  const needsNl = prev.length > 0 && !prev.endsWith('\n');
  fs.appendFileSync(filePath, `${needsNl ? '\n' : ''}${line}\n`, 'utf8');
  return { path: filePath, line, created };
}
