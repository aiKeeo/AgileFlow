/**
 * 校验 atlas/logs/af-commands.md 强制留痕
 * - 每步须本步门牌（仅一行 /af 不能冒充 req/mod/sol/dev）
 * - gate 只读校验；缺日志必须先显式执行 agileflow log
 */
import fs from 'node:fs';
import path from 'node:path';
import { exists } from '../fs-utils.mjs';
import { AF_COMMANDS_REL } from '../af-command-write.mjs';

export { AF_COMMANDS_REL };
/** 一行格式：[门牌][摘要][日期][→路由][状态] */
export const AF_COMMAND_LINE_RE =
  /^\[(\/af[a-z0-9-]*)\]\[[^\]]{1,20}\]\[\d{4}-\d{2}-\d{2}\]\[→[^\]]+\]\[[✅⬆️❌⏸️]\]\s*$/;

/**
 * 闸门 → 可接受的门牌（含别名；不含裸 /af）
 * @type {Record<string, string[]>}
 */
export const GATE_ACCEPTED_DOORS = {
  'init-confirm': ['/af-init'],
  'req-confirm': ['/af-req'],
  'mod-confirm': ['/af-mod'],
  'sol-confirm': ['/af-sol'],
  'dev-step1-literal': ['/af-dev'],
  'dev-complete': ['/af-dev'],
  'write-code': ['/af-dev'],
  'test-entry': ['/af-test', '/af-tests'],
};

/**
 * 抽出日志里的数据行
 * @param {string} content
 */
export function parseAfCommandLines(content) {
  return String(content || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('[/af'));
}

/**
 * @param {string} line
 */
export function isValidAfCommandLine(line) {
  return AF_COMMAND_LINE_RE.test(line.trim());
}

/**
 * @param {string} line
 * @param {string[]} doors
 */
export function lineMatchesDoors(line, doors) {
  const m = line.match(/^\[(\/af[a-z0-9-]*)\]/);
  if (!m) return false;
  return doors.includes(m[1]);
}

/**
 * 是否已有本闸门可接受门牌的合法行
 * @param {string} projectRoot
 * @param {string} gateId
 */
export function hasAfCommandForGate(projectRoot, gateId) {
  const accepted = GATE_ACCEPTED_DOORS[gateId];
  if (!accepted) return true;
  const filePath = path.join(projectRoot, AF_COMMANDS_REL);
  if (!exists(filePath)) return false;
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return false;
  }
  return parseAfCommandLines(content).some(
    (l) => isValidAfCommandLine(l) && lineMatchesDoors(l, accepted),
  );
}

/**
 * flow 闸门：须有合法留痕，且至少一条命中本闸门可接受门牌
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ gateId?: string }} [opts]
 */
export function validateAfCommands(projectRoot, reporter, opts = {}) {
  const gateId = opts.gateId || '';
  const filePath = path.join(projectRoot, AF_COMMANDS_REL);
  const accepted = GATE_ACCEPTED_DOORS[gateId];

  // 未映射的闸门（如 req-trace）不验留痕
  if (gateId && !accepted) return;

  if (!exists(filePath)) {
    reporter.add({
      severity: 'error',
      rule: 'AF-CMD-MISSING',
      file: AF_COMMANDS_REL,
      message:
        '缺 atlas/logs/af-commands.md。任何 /af* 完成后须先显式留痕：npx @agileflow/cli log --door /af-req --summary … --route req --root .',
    });
    return;
  }

  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    reporter.add({
      severity: 'error',
      rule: 'AF-CMD-MISSING',
      file: AF_COMMANDS_REL,
      message: '无法读取 af-commands.md',
    });
    return;
  }

  const lines = parseAfCommandLines(content);
  if (lines.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'AF-CMD-EMPTY',
      file: AF_COMMANDS_REL,
      message:
        'af-commands.md 无有效日志行。本步收尾先追加：npx @agileflow/cli log --door /af-… --summary … --route … --root .',
    });
    return;
  }

  const invalid = lines.filter((l) => !isValidAfCommandLine(l));
  if (invalid.length) {
    reporter.add({
      severity: 'error',
      rule: 'AF-CMD-FORMAT',
      file: AF_COMMANDS_REL,
      message: `格式须为 [门牌][摘要≤15字][YYYY-MM-DD][→路由][状态]；坏行例：${invalid[0].slice(0, 80)}`,
    });
  }

  if (accepted && accepted.length) {
    const hit = lines.some((l) => isValidAfCommandLine(l) && lineMatchesDoors(l, accepted));
    if (!hit) {
      reporter.add({
        severity: 'error',
        rule: 'AF-CMD-NO-STEP',
        file: AF_COMMANDS_REL,
        message: `闸门 ${gateId} 须有本步门牌 ${accepted.join('|')}（仅 [/af] 入口行不算；缺则先显式执行 agileflow log）。`,
      });
    }
  }
}
