import fs from 'node:fs';
import path from 'node:path';
import { exists, listFiles, readText, rel } from '../fs-utils.mjs';

/** 入场冒烟相关文件名 */
const SMOKE_NAME = /smoke|compile|probe|test-entry|fe-smoke|be-smoke/i;

/**
 * 文件是否含过线痕迹
 * @param {string} content
 * @returns {boolean}
 */
function hasPassMarker(content) {
  return /exit\s*0|✅|通过|PASS|UP|成功|ok\b|listening|Started/i.test(content);
}

/**
 * 测试入场门禁：要求 atlas/logs/ 存在冒烟/编译/探针证据文件
 * A 档闸门 test-entry 专用（不替真实跑命令，只挡「无痕迹声称入场」）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateSmokeEntry(projectRoot, reporter) {
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

  const candidates = listFiles(logsDir).filter((f) => {
    try {
      return fs.statSync(f).isFile() && SMOKE_NAME.test(path.basename(f));
    } catch {
      return false;
    }
  });

  if (candidates.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L002',
      file: 'atlas/logs/',
      message:
        'atlas/logs/ 无冒烟/编译/探针文件（文件名须含 smoke|compile|probe|test-entry|fe-smoke|be-smoke）。',
    });
    return;
  }

  let anyPass = false;
  for (const file of candidates) {
    const content = readText(file);
    if (content && content.trim().length >= 20 && hasPassMarker(content)) {
      anyPass = true;
      break;
    }
  }

  if (!anyPass) {
    const sample = rel(projectRoot, candidates[0]);
    reporter.add({
      severity: 'error',
      rule: 'SMOKE-L003',
      file: sample,
      message: '入场日志存在但无过线痕迹（须含 exit 0 / ✅ / 通过 / PASS / UP 等）。禁止空文件充数。',
    });
  }
}
