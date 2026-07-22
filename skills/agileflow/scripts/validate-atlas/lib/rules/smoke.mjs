import fs from 'node:fs';
import path from 'node:path';
import { exists, listFiles, readText, rel } from '../fs-utils.mjs';
import { hasCommandTrace, hasTimestamp } from './command-trace.mjs';

/** 入场冒烟相关文件名 */
const SMOKE_NAME = /smoke|compile|probe|test-entry|fe-smoke|be-smoke/i;

/** 项目根下视为「有 FE」的目录名（小程序含 miniprogram / miniapp） */
const FE_ROOT_DIRS = [
  'frontend',
  'miniprogram',
  'miniapp',
  'web',
  'client',
  'mp',
  'h5',
];

/**
 * 文件是否含通过/成功痕迹（listening/Started 仅为启动状态，不算通过）。
 * @param {string} content
 * @returns {boolean}
 */
function hasPassMarker(content) {
  return /exit\s*0|✅|通过|PASS|\bUP\b|成功|ok\b/i.test(content);
}

/**
 * 是否存在前端目录（有 FE → Playwright 截图目视硬门槛）。
 * @param {string} projectRoot
 * @returns {{ hasFe: boolean, feDir: string|null }}
 */
export function detectFrontendRoot(projectRoot) {
  for (const name of FE_ROOT_DIRS) {
    const full = path.join(projectRoot, name);
    if (exists(full)) {
      try {
        if (fs.statSync(full).isDirectory()) {
          return { hasFe: true, feDir: name };
        }
      } catch {
        /* ignore */
      }
    }
  }
  // apps/web · apps/frontend · packages/web
  for (const parent of ['apps', 'packages']) {
    const parentDir = path.join(projectRoot, parent);
    if (!exists(parentDir)) continue;
    try {
      for (const ent of fs.readdirSync(parentDir, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        if (/^(web|frontend|miniprogram|miniapp|h5|client|mp)$/i.test(ent.name)) {
          return { hasFe: true, feDir: `${parent}/${ent.name}` };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return { hasFe: false, feDir: null };
}

/**
 * 转义正则元字符
 * @param {string} s
 */
function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 目视记录是否声明已 Read 截图且每页 PASS、无 FAIL。
 * @param {string} text
 * @param {string[]} pageIds
 * @returns {{ ok: boolean, message?: string }}
 */
export function parseFeSmokeVisualReview(text, pageIds) {
  if (!text || text.trim().length < 10) {
    return { ok: false, message: 'fe-smoke-visual-review.md 为空或过短' };
  }
  if (!/screenshotsReviewed\s*:\s*true/i.test(text)) {
    return {
      ok: false,
      message: '须含 `screenshotsReviewed: true`（总控已 Read 每张截图后声明）',
    };
  }
  for (const id of pageIds) {
    const failRe = new RegExp(
      `(?:^|[\\|\\-])\\s*${escapeRegExp(id)}\\s*(?:[\\|:]|\\s+)\\s*FAIL\\b`,
      'im',
    );
    if (failRe.test(text)) {
      return { ok: false, message: `目视记录中 ${id} 为 FAIL，禁止进场` };
    }
    const passRe = new RegExp(
      `(?:^|[\\|\\-])\\s*${escapeRegExp(id)}\\s*(?:[\\|:]|\\s+)\\s*PASS\\b`,
      'im',
    );
    if (!passRe.test(text)) {
      return {
        ok: false,
        message: `目视记录缺少「${id} … PASS」行（表格或 \`- id: PASS\`）`,
      };
    }
  }
  return { ok: true };
}

/**
 * 有 FE 时硬检 Playwright 报告 + 截图 + AI 目视记录。
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {string} feDir
 */
export function validateFeSmokeHardGate(projectRoot, reporter, feDir) {
  const reportPath = path.join(projectRoot, 'atlas', 'logs', 'fe-smoke-report.json');
  const reviewPath = path.join(projectRoot, 'atlas', 'logs', 'fe-smoke-visual-review.md');

  if (!exists(reportPath)) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-NO-REPORT',
      file: 'atlas/logs/fe-smoke-report.json',
      message: `检测到前端目录 \`${feDir}/\`：须跑 Playwright fe-smoke 并落盘 fe-smoke-report.json（小程序用 H5）。禁止跳过。见 tools/fe-smoke-playwright.md`,
    });
    return;
  }

  let report;
  try {
    report = JSON.parse(readText(reportPath) || '{}');
  } catch (e) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-REPORT-JSON',
      file: 'atlas/logs/fe-smoke-report.json',
      message: `fe-smoke-report.json 无法解析：${e.message}`,
    });
    return;
  }

  const reportOk = report.ok === true || report.summary?.ok === true;
  if (!reportOk) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-REPORT-FAIL',
      file: 'atlas/logs/fe-smoke-report.json',
      message: 'fe-smoke-report.json 中 ok !== true（有页 FAIL）。须修 FE 后重跑 Playwright。',
    });
  }

  const results = Array.isArray(report.results) ? report.results : [];
  const checked = results.filter((r) => r && !r.skipped);
  if (checked.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-NO-PAGES',
      file: 'atlas/logs/fe-smoke-report.json',
      message: 'fe-smoke-report.json 无非 skip 页面结果；pages 清单不得全空/全跳过。',
    });
    return;
  }

  /** @type {string[]} */
  const pageIds = [];
  for (const r of checked) {
    const id = String(r.id || r.path || '').trim();
    if (!id) continue;
    pageIds.push(id);
    const shotRel = r.screenshot;
    if (!shotRel || typeof shotRel !== 'string') {
      reporter.add({
        severity: 'error',
        rule: 'FE-SMOKE-NO-SHOT',
        file: 'atlas/logs/fe-smoke-report.json',
        message: `页 ${id} 缺少 screenshot 字段；fe-smoke 须每页截图到 atlas/logs/fe-smoke-shots/`,
      });
      continue;
    }
    const shotAbs = path.isAbsolute(shotRel)
      ? shotRel
      : path.join(projectRoot, shotRel);
    if (!exists(shotAbs)) {
      reporter.add({
        severity: 'error',
        rule: 'FE-SMOKE-SHOT-MISSING',
        file: shotRel,
        message: `页 ${id} 截图文件不存在：${shotRel}`,
      });
    }
  }

  if (!exists(reviewPath)) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-NO-REVIEW',
      file: 'atlas/logs/fe-smoke-visual-review.md',
      message:
        '须写 fe-smoke-visual-review.md：总控 Read 每张截图后声明 screenshotsReviewed: true，且每页 PASS（防白屏/报错层）。',
    });
    return;
  }

  const reviewText = readText(reviewPath) || '';
  const parsed = parseFeSmokeVisualReview(reviewText, pageIds);
  if (!parsed.ok) {
    reporter.add({
      severity: 'error',
      rule: 'FE-SMOKE-REVIEW-FAIL',
      file: 'atlas/logs/fe-smoke-visual-review.md',
      message: parsed.message || '目视记录未通过',
    });
  }
}

/**
 * 测试入场门禁：要求 atlas/logs/ 存在冒烟/编译/探针证据文件
 * 闸门 test-entry 专用（不替真实跑命令，只挡「无痕迹声称入场」）
 * 有 FE 时额外硬检 Playwright 报告 + 截图 + 目视。
 *
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ incremental?: boolean }} [opts]
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
    // 仍可能有 FE 硬门槛提示
    const { hasFe, feDir } = detectFrontendRoot(projectRoot);
    if (hasFe && feDir) {
      validateFeSmokeHardGate(projectRoot, reporter, feDir);
    }
    return;
  }

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
  } else {
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
    } else {
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
    }
  }

  if (incremental) {
    reporter.add({
      severity: 'info',
      rule: 'SMOKE-INCREMENTAL',
      file: 'atlas/logs/',
      message: '同会话增量模式：dev-complete 已全量验过，此为增量确认。',
    });
  }

  const { hasFe, feDir } = detectFrontendRoot(projectRoot);
  if (hasFe && feDir) {
    validateFeSmokeHardGate(projectRoot, reporter, feDir);
  }
}
