import fs from 'node:fs';
import path from 'node:path';
import { exists, listFiles, readText, rel } from '../fs-utils.mjs';
import { hasCommandTrace, hasTimestamp } from './command-trace.mjs';

/** 入场冒烟相关文件名 */
const SMOKE_NAME = /smoke|compile|probe|test-entry|fe-smoke|be-smoke/i;

/**
 * 文件是否含通过/成功痕迹（listening/Started 仅为启动状态，不算通过）。
 * @param {string} content
 * @returns {boolean}
 */
function hasPassMarker(content) {
  return /exit\s*0|✅|通过|PASS|\bUP\b|成功|ok\b/i.test(content);
}

/**
 * 测试入场门禁：要求 atlas/logs/ 存在冒烟/编译/探针证据文件
 * 闸门 test-entry 专用（不替真实跑命令，只挡「无痕迹声称入场」）
 *
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ incremental?: boolean }} [opts]
 *   - incremental=true：同会话已验，只须增量证据（接受任何日志文件含通过标记）
 *   - incremental=false（默认）：跨会话，须全量证据（文件名须含 smoke|compile|probe 等）
 */
export function validateSmokeEntry(projectRoot, reporter, opts = {}) {
  const incremental = opts.incremental ?? false;
  const logsDir = path.join(projectRoot, 'atlas', 'logs');

  if (!exists(logsDir)) {
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L001',
      file: 'atlas/logs/',
      message: 'test-entry 须有 atlas/logs/（编译/探针/冒烟日志）。无日志不得进阶段 5 AC 归档。',
    });
    return;
  }

  // 增量模式：接受任何日志文件（同会话 dev-complete 已全量验过）
  // 全量模式：文件名须含 smoke|compile|probe|test-entry|fe-smoke|be-smoke
  const candidates = listFiles(logsDir).filter((f) => {
    try {
      if (!fs.statSync(f).isFile()) return false;
      if (incremental) return true;
      return SMOKE_NAME.test(path.basename(f));
    } catch {
      return false;
    }
  });

  if (candidates.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L002',
      file: 'atlas/logs/',
      message: incremental
        ? 'atlas/logs/ 无任何日志文件（同会话增量模式：接受任意日志含通过标记）。'
        : 'atlas/logs/ 无冒烟/编译/探针文件（文件名须含 smoke|compile|probe|test-entry|fe-smoke|be-smoke）。',
    });
    return;
  }

  let anyPass = false;
  let anyWithTrace = false;
  let anyWithTimestamp = false;
  for (const file of candidates) {
    const content = readText(file);
    if (content && content.trim().length >= 20 && hasPassMarker(content)) {
      anyPass = true;
      if (hasCommandTrace(content)) anyWithTrace = true;
      if (hasTimestamp(content)) anyWithTimestamp = true;
    }
  }

  if (!anyPass) {
    const sample = rel(projectRoot, candidates[0]);
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L003',
      file: sample,
      message: '入场日志存在但无通过痕迹（须含 exit 0 / ✅ / 通过 / PASS / UP 等）。禁止空文件凑数。',
    });
    return;
  }

  if (!anyWithTrace) {
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L004',
      file: 'atlas/logs/',
      message: '入场日志须含实际执行的命令痕迹（如 $ curl、$ npm run 等），禁止只写「PASS」无命令。',
    });
  }

  if (!anyWithTimestamp) {
    reporter.add({
      severity: 'info',
      rule: 'SMOKE-L005',
      file: 'atlas/logs/',
      message: '入场日志可带时间戳，便于验证报告未过期。',
    });
  }

  if (incremental) {
    reporter.add({
      severity: 'info',
      rule: 'SMOKE-INCREMENTAL',
      file: 'atlas/logs/',
      message: '同会话增量模式：dev-complete 已全量验过，此为增量确认。',
    });
  }
}
