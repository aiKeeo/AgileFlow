import fs from 'node:fs';
import path from 'node:path';
import { exists, readText, rel } from '../fs-utils.mjs';

/** 非法 T 头：## T- 不算 */
const ILLEGAL_T_HEADER = /^##\s+T-\d+/gm;

/** 扁平列表形态 */
const FLAT_T_ITEM = /^-\s+\[[ x]\]\s+T-\d+/gm;

/**
 * 从 todo 内容提取 T 任务头
 * @param {string} content
 */
function extractTaskHeaders(content) {
  const headers = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{3,4})\s+(T-\d+)[：:\s]/);
    if (match) {
      headers.push({ line: i + 1, id: match[2], raw: lines[i] });
    }
  }
  return headers;
}

/**
 * 检查 T 头下是否有 ①②③ 三行
 */
function checkThreeSteps(content, startLine) {
  const lines = content.split('\n');
  const slice = lines.slice(startLine).join('\n');
  const nextHeader = slice.search(/^#{2,4}\s+/m);
  const block = nextHeader === -1 ? slice : slice.slice(0, nextHeader);

  return {
    has1: /①.*构思/.test(block) && /atlas\/dev\/T-\d+/.test(block),
    has2: /②/.test(block) && /写码|按.*(?:五|做法)/.test(block),
    has3: /③/.test(block) && /AC|验收/.test(block),
  };
}

/**
 * 统计合规 dev 文件数
 */
function countDevFiles(devRoot) {
  if (!exists(devRoot)) return 0;
  return fs.readdirSync(devRoot).filter(
    (f) =>
      /^T-\d+-.+\.md$/.test(f) &&
      !f.includes('README') &&
      !f.startsWith('temp') &&
      !f.includes('⚠️')
  ).length;
}

/**
 * 校验 atlas/todo.md（开发完成格式门槛 + 三段式）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ tier?: string, phase?: string }} [opts]
 */
export function validateTodo(projectRoot, reporter, opts = {}) {
  const tier = opts.tier ?? 'standard';
  const phase = opts.phase ?? 'all';
  const todoPath = path.join(projectRoot, 'atlas', 'todo.md');
  if (!exists(todoPath)) {
    reporter.add({
      severity: 'warn',
      rule: 'TODO-001',
      file: 'atlas/todo.md',
      message: '缺少 atlas/todo.md。',
    });
    return;
  }

  const content = readText(todoPath);
  if (!content) return;

  const relPath = rel(projectRoot, todoPath);

  if (!/^## 流程进度/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'TODO-F001',
      file: relPath,
      message: 'todo 缺少「## 流程进度」区。',
    });
  }

  if (!/^## 开发任务/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'TODO-F002',
      file: relPath,
      message: 'todo 缺少「## 开发任务」区。',
    });
  }

  if (!/① 质量门槛/.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'TODO-QUALITY-缺门槛区',
      file: relPath,
      message: 'todo 缺少「① 质量门槛（冻结区）」。',
    });
  } else if (!/机械 grep/.test(content)) {
    // 完整档须有 grep 表；精简/标准档降为 warn（字面量校验仅完整档强制）
    reporter.add({
      severity: tier === 'full' ? 'error' : 'warn',
      rule: 'TODO-QUALITY-缺grep表',
      file: relPath,
      message: tier === 'full'
        ? '质量门槛区缺少「机械 grep」表（完整档强制）。'
        : '质量门槛区建议含「机械 grep」表（完整档强制，当前档位可选）。',
    });
  }

  for (const m of content.matchAll(ILLEGAL_T_HEADER)) {
    const line = content.slice(0, m.index).split('\n').length;
    reporter.add({
      severity: 'error',
      rule: 'TODO-FORMAT-头级非法',
      file: relPath,
      line,
      message: `非法 T 头「${m[0].trim()}」——仅 ### / #### 合法。`,
    });
  }

  for (const m of content.matchAll(FLAT_T_ITEM)) {
    const line = content.slice(0, m.index).split('\n').length;
    reporter.add({
      severity: 'error',
      rule: 'TODO-FORMAT-扁平列表',
      file: relPath,
      line,
      message: `扁平任务列表「${m[0].trim()}」——须 ### T-xxx + ①②③。`,
    });
  }

  const headers = extractTaskHeaders(content);
  for (const header of headers) {
    // A 档：每个 T 头须标注风险档位
    if (!/\[精简\]|\[标准\]|\[完整\]/.test(header.raw)) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-缺档位',
        file: relPath,
        line: header.line,
        message: `${header.id} 头须含档位标注 [精简|标准|完整]（例：### T-001：[BE] … — F-001 [标准]）。`,
      });
    }

    const steps = checkThreeSteps(content, header.line);
    if (!steps.has1) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-缺①',
        file: relPath,
        line: header.line,
        message: `${header.id} 缺少 ① 构思落盘行（须含 atlas/dev/T-xxx）。`,
      });
    }
    if (!steps.has2) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-缺②',
        file: relPath,
        line: header.line,
        message: `${header.id} 缺少 ② 写码步骤。`,
      });
    }
    if (!steps.has3) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-缺③',
        file: relPath,
        line: header.line,
        message: `${header.id} 缺少 ③ AC 验收步骤。`,
      });
    }
  }

  // 开发完成格式：dev 文件数=T 头数 —— 仅阶段 4/5（阶段 3 sol-confirm 尚未写 atlas/dev/）
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  const checkDevCount = phase === '4' || phase === '5';
  if (checkDevCount && headers.length > 0) {
    const devCount = countDevFiles(devRoot);
    if (devCount !== headers.length) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-dev数不符',
        file: relPath,
        message: `dev 文件数(${devCount}) ≠ T 头数(${headers.length})（仅 AF_PHASE/gate phase 为 4|5 时检查）。`,
      });
    }
  }

  reporter.add({
    severity: 'info',
    rule: 'TODO-FORMAT-OK',
    file: relPath,
    message: `检测到 ${headers.length} 个合法 T 头。`,
  });
}
