/**
 * 追加 atlas/logs/af-commands.md（强制留痕 · 一行一条）
 * 格式：[门牌][话术摘要≤15字][YYYY-MM-DD][→路由结果][状态]
 * 实现落在 validate-atlas/lib（安装副本无 cli/ 时 gate 仍可用）
 */
import path from 'node:path';
import { assertRootFlag, parseArgv } from './parse-argv.mjs';
import {
  appendAfCommand,
  formatLogLine,
  normalizeDoor,
  normalizeStatus,
  truncateSummary,
  AF_COMMANDS_REL,
} from '../scripts/validate-atlas/lib/af-command-write.mjs';

export {
  appendAfCommand,
  formatLogLine,
  normalizeDoor,
  normalizeStatus,
  truncateSummary,
  AF_COMMANDS_REL,
};

/**
 * CLI：agileflow log --door /af-req --summary … --route req [--status ok] [--root .]
 * 亦支持：agileflow log /af-req 做一个登录 --route req
 * @param {string[]} argv
 */
export async function runAfLog(argv) {
  const parsed = parseArgv(argv);
  assertRootFlag(parsed.flags);

  const flags = parsed.flags;
  const rest = parsed.rest || [];
  /** @type {string} */
  let door = String(flags.door || flags.d || '');
  /** @type {string} */
  let summary = String(flags.summary || flags.s || '');
  /** @type {string} */
  let route = String(flags.route || flags.r || '');
  const status = String(flags.status || 'ok');
  const root = path.resolve(String(flags.root || process.cwd()));

  if (!door && parsed.cmd && String(parsed.cmd).startsWith('/')) {
    door = parsed.cmd;
  } else if (!door && parsed.cmd && !String(parsed.cmd).startsWith('-')) {
    door = parsed.cmd;
  }
  if (!summary && rest.length) {
    summary = rest.join(' ');
  } else if (!summary && parsed.cmd && door && door !== parsed.cmd) {
    summary = [parsed.cmd, ...rest].join(' ');
  }

  door = normalizeDoor(door);
  if (!door || !summary || !route) {
    console.error(`用法:
  agileflow log --door /af-req --summary 做一个登录 --route req [--status ok] [--root .]
  agileflow log /af-req 做一个登录 --route req

必填：门牌、摘要、--route（最终切入的模式，如 req / fix / explore）`);
    process.exit(1);
  }

  const result = appendAfCommand(root, { door, summary, route, status });
  console.log(`✅ 已追加 ${AF_COMMANDS_REL}`);
  console.log(`   ${result.line}`);
  if (result.created) console.log('   （新建日志文件）');
}
