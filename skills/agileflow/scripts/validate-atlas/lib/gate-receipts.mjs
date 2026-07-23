/**
 * Legacy 闸门回执：仅无 current Run 的项目由 CLI wrapper 落盘。
 * 格式一行：[gateId][ISO8601][PASS|FAIL]
 */
import fs from 'node:fs';
import path from 'node:path';
export { STEP_EXIT_GATE } from '../../runtime/gates.mjs';
import { exists, readText } from './fs-utils.mjs';

export const GATE_RECEIPTS_REL = path.join('atlas', 'logs', 'af-gate-receipts.md');

const HEADER = `# af-gate-receipts（闸门回执）

> 仅无 current Run 的 legacy 项目由 \`agileflow gate\` wrapper 按**最终退出码**写入。validator 只读；有 Run 时本文件不具权威性。

`;

/**
 * @param {string} projectRoot
 * @param {{ gateId: string, passed: boolean, at?: string }} opts
 */
export function appendGateReceipt(projectRoot, opts) {
  const gateId = String(opts.gateId || '').trim();
  if (!gateId) return null;
  const status = opts.passed ? 'PASS' : 'FAIL';
  const at = opts.at || new Date().toISOString();
  const filePath = path.join(projectRoot, GATE_RECEIPTS_REL);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, HEADER, 'utf8');
  }
  const line = `[${gateId}][${at}][${status}]`;
  const prev = fs.readFileSync(filePath, 'utf8');
  const needsNl = prev.length > 0 && !prev.endsWith('\n');
  fs.appendFileSync(filePath, `${needsNl ? '\n' : ''}${line}\n`, 'utf8');
  return { path: filePath, line };
}

/**
 * 该闸门最新回执是否为 PASS
 * @param {string} projectRoot
 * @param {string} gateId
 */
export function hasGatePassReceipt(projectRoot, gateId) {
  const filePath = path.join(projectRoot, GATE_RECEIPTS_REL);
  if (!exists(filePath)) return false;
  const text = readText(filePath) || '';
  const re = new RegExp(
    `^\\[${escapeRe(gateId)}\\]\\[[^\\]]+\\]\\[(PASS|FAIL)\\]\\s*$`,
    'gm',
  );
  let latest = null;
  for (const match of text.matchAll(re)) latest = match[1];
  return latest === 'PASS';
}

/**
 * @param {string} s
 */
function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 打印机器可读尾标（堵 pipefail 误读）
 * @param {string} gateId
 * @param {boolean} passed
 */
export function printGateResultTrailer(gateId, passed) {
  const v = passed ? 'PASS' : 'FAIL';
  console.log(`AGILEFLOW_GATE_RESULT=${v}`);
  console.log(`AGILEFLOW_GATE_ID=${gateId}`);
}
