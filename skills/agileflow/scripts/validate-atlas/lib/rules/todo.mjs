import fs from 'node:fs';
import path from 'node:path';
import { exists, readText, rel } from '../fs-utils.mjs';
import { extractSectionResult, hasRunnableEvidence } from './runnable.mjs';
import { runDevLiteralCheck } from './dev/index.mjs';
import {
  shouldSkipTodoSolFormat,
  shouldSkipTodoDevCheck,
  customSkipMessage,
} from './role-custom.mjs';
import { detectBusinessSource } from '../brownfield.mjs';
import { effectiveGatePass } from '../effective-gate.mjs';

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
 * 取某 T 头到下一同级/更高级头之间的正文块
 * @param {string} content
 * @param {number} startLine 1-based header line
 */
function extractTaskBlock(content, startLine) {
  const lines = content.split('\n');
  const slice = lines.slice(startLine).join('\n');
  const nextHeader = slice.search(/^#{2,4}\s+/m);
  return nextHeader === -1 ? slice : slice.slice(0, nextHeader);
}

/**
 * 检查 T 头下是否有 ①②③ 三行
 */
function checkThreeSteps(block) {
  return {
    // 与 parseStepChecks 同宽：不强制「构思/写码/AC」字样
    has1: /①/.test(block) && /atlas\/dev\/T-\d+/.test(block),
    has2: /②/.test(block),
    has3: /③/.test(block),
  };
}

/**
 * 解析块内 ①②③ checkbox 勾选态与 dev 路径
 * @param {string} block
 */
function parseStepChecks(block) {
  const lines = block.split('\n');
  /** @type {{ checked: boolean, path: string|null, lineInBlock: number } | null} */
  let step1 = null;
  /** @type {{ checked: boolean, lineInBlock: number } | null} */
  let step2 = null;
  /** @type {{ checked: boolean, lineInBlock: number } | null} */
  let step3 = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const box = line.match(/^\s*-\s+\[([ xX])\]/);
    if (!box) continue;
    const checked = box[1].toLowerCase() === 'x';

    // ①/②/③：不强制「构思/写码/AC」字样（堵 `- [x] **①** → path` 漏检）
    if (/①/.test(line) && !/②/.test(line) && !/③/.test(line)) {
      const pathMatch = line.match(/`?(atlas\/dev\/T-\d+[^`\s]*)`?/);
      step1 = { checked, path: pathMatch ? pathMatch[1].replace(/[`'"]/g, '') : null, lineInBlock: i };
    } else if (/②/.test(line) && !/①/.test(line) && !/③/.test(line)) {
      step2 = { checked, lineInBlock: i };
    } else if (/③/.test(line) && !/①/.test(line) && !/②/.test(line)) {
      step3 = { checked, lineInBlock: i };
    }
  }

  return { step1, step2, step3 };
}

/**
 * 解析 todo 中声明的 dev 路径；若无则按 T-id 在 atlas/dev/ 下查找
 * @param {string} projectRoot
 * @param {string} taskId
 * @param {string|null} declaredPath
 */
function resolveDevFile(projectRoot, taskId, declaredPath) {
  if (declaredPath) {
    const abs = path.join(projectRoot, declaredPath);
    if (exists(abs)) return { rel: declaredPath, abs };
  }

  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return null;

  const match = fs.readdirSync(devRoot).find(
    (f) =>
      f.startsWith(`${taskId}-`) &&
      f.endsWith('.md') &&
      !f.includes('README') &&
      !f.startsWith('temp') &&
      !f.includes('⚠️'),
  );
  if (!match) return null;
  return { rel: `atlas/dev/${match}`, abs: path.join(devRoot, match) };
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
      !f.includes('⚠️'),
  ).length;
}

/**
 * 勾选证据闸门：勾了就必须有落盘 / 可运行证据（堵 AI 空跑勾选）
 * @param {string} projectRoot
 * @param {string} content
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {string} relPath
 * @param {ReturnType<typeof extractTaskHeaders>} headers
 * @param {{ skipDevCheck?: boolean, skipSolClaimed?: boolean }} [opts]
 */
function validateCheckboxEvidence(projectRoot, content, reporter, relPath, headers, opts = {}) {
  const skipDevCheck = opts.skipDevCheck ?? false;
  const skipSolClaimed = opts.skipSolClaimed ?? false;

  if (!skipDevCheck) {
  let anyChecked = false;
  let allComplete = headers.length > 0;

  for (const header of headers) {
    const block = extractTaskBlock(content, header.line);
    const { step1, step2, step3 } = parseStepChecks(block);
    const absLine = (inBlock) => header.line + 1 + inBlock;

    if (step1?.checked || step2?.checked || step3?.checked) anyChecked = true;

    const s1 = !!step1?.checked;
    const s2 = !!step2?.checked;
    const s3 = !!step3?.checked;
    if (!(s1 && s2 && s3)) allComplete = false;

    if (s1 || s2 || s3) {
      const resolved = resolveDevFile(projectRoot, header.id, step1?.path ?? null);

      if (s1 && !resolved) {
        reporter.add({
          severity: 'error',
          rule: 'TODO-CHECK-①无文件',
          file: relPath,
          line: step1 ? absLine(step1.lineInBlock) : header.line,
          message: `${header.id} 已勾 ①，但缺少对应构思文件（须存在 ${step1?.path ?? `atlas/dev/${header.id}-*.md`}）。禁止空跑勾选。`,
        });
      }

      // 勾①须过构思闸门（五段式字面量）；堵「范围/做法 + 写码后填」空壳
      if (s1 && resolved) {
        const lit = runDevLiteralCheck(resolved.abs, { stage: 'step1' });
        if (!lit.passed) {
          const top = lit.issues.slice(0, 2).map((i) => i.rule).join(', ');
          reporter.add({
            severity: 'error',
            rule: 'TODO-CHECK-①格式',
            file: resolved.rel,
            line: step1 ? absLine(step1.lineInBlock) : header.line,
            message: `${header.id} 已勾 ①，但 ${resolved.rel} 未过构思闸门（${top}…）。须先写 ## 摘要 + 主流程+边界+实现说明，禁止空壳或写码后回填。`,
          });
        }
      }

      if (s2 && !s1) {
        reporter.add({
          severity: 'error',
          rule: 'TODO-CHECK-②缺①',
          file: relPath,
          line: step2 ? absLine(step2.lineInBlock) : header.line,
          message: `${header.id} 已勾 ②，但 ① 未勾——禁止先码后补勾选。`,
        });
      }

      if (s2 && s1 && !resolved) {
        reporter.add({
          severity: 'error',
          rule: 'TODO-CHECK-②无文件',
          file: relPath,
          line: step2 ? absLine(step2.lineInBlock) : header.line,
          message: `${header.id} 已勾 ②，但无合规 ① 构思文件。`,
        });
      }

      // ② 须有写码闸门回执或已探测业务源码（堵空勾②）
      if (s2 && s1 && resolved) {
        const hasCode =
          detectBusinessSource(projectRoot) || effectiveGatePass(projectRoot, 'write-code').valid;
        if (!hasCode) {
          reporter.add({
            severity: 'error',
            rule: 'TODO-CHECK-②无写码证据',
            file: relPath,
            line: step2 ? absLine(step2.lineInBlock) : header.line,
            message: `${header.id} 已勾 ②，但无业务源码且无 write-code 闸门 PASS 回执——禁止空勾写码步。先跑 agileflow gate --gate write-code 再写码。`,
          });
        }
      }

      if (s3 && !s2) {
        reporter.add({
          severity: 'error',
          rule: 'TODO-CHECK-③缺②',
          file: relPath,
          line: step3 ? absLine(step3.lineInBlock) : header.line,
          message: `${header.id} 已勾 ③，但 ② 未勾——禁止假验收。`,
        });
      }

      if (s3) {
        if (!resolved) {
          reporter.add({
            severity: 'error',
            rule: 'TODO-CHECK-③无文件',
            file: relPath,
            line: step3 ? absLine(step3.lineInBlock) : header.line,
            message: `${header.id} 已勾 ③，但无对应 atlas/dev 构思——禁止假验收。`,
          });
        } else {
          const devContent = readText(resolved.abs) || '';
          const resultBody = extractSectionResult(devContent);
          if (!hasRunnableEvidence(resultBody)) {
            reporter.add({
              severity: 'error',
              rule: 'TODO-CHECK-③无可运行',
              file: resolved.rel,
              message: `${header.id} 已勾 ③，但 ${resolved.rel}「## 结果」缺可运行证据（编译+启/冒烟+exit0/✅/PASS）。禁止空跑勾选。`,
            });
          }
        }
      }
    }
  }

  // 流程进度声称开发完成 → 每个 T 必须 ①②③ 齐且证据过关
  const claimedDevDone =
    /开发实现\s*✅/.test(content) ||
    /^\s*-\s+\[[xX]\].*开发实现/m.test(content);

  if (claimedDevDone) {
    if (headers.length === 0) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-CHECK-开发完成无T',
        file: relPath,
        message: '流程进度已标「开发实现 ✅」，但无 ### T-xxx 任务。',
      });
    } else if (!allComplete) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-CHECK-开发完成未齐',
        file: relPath,
        message: '流程进度已标「开发实现 ✅」，但存在未勾满 ①②③ 的 T——禁止假完成。',
      });
    }
    if (!anyChecked && headers.length > 0) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-CHECK-开发完成空勾',
        file: relPath,
        message: '流程进度已标「开发实现 ✅」，但所有 T 的 ①②③ 均未勾选。',
      });
    }
  }
  }

  // 流程进度声称方案完成 → 须有 architecture（堵 README 揉方案）
  if (!skipSolClaimed) {
  const claimedSolDone =
    /方案设计\s*✅/.test(content) ||
    /^\s*-\s+\[[xX]\].*方案设计/m.test(content);
  if (claimedSolDone) {
    const archPath = path.join(projectRoot, 'atlas', 'solution', 'architecture.md');
    if (!exists(archPath)) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-CHECK-方案完成无arch',
        file: relPath,
        message:
          '流程进度已标「方案设计 ✅」，但缺少 atlas/solution/architecture.md——禁止假完成。',
      });
    }
  }
  }

  const claimedTestDone =
    /测试验收\s*✅/.test(content) ||
    /^\s*-\s+\[[xX]\].*测试验收/m.test(content);
  if (claimedTestDone) {
    const testsReadme = readText(path.join(projectRoot, 'atlas', 'tests', 'README.md')) || '';
    if (!/\bPASS\b/.test(testsReadme)) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-CHECK-测试无PASS',
        file: relPath,
        message: '流程进度已标「测试验收 ✅」，但 atlas/tests/README 无字面量 PASS。',
      });
    }
  }
}

/**
 * 校验 atlas/todo.md（开发完成格式门槛 + 三段式 + 勾选证据）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ tier?: string, phase?: string, customRoles?: Set<string> }} [opts]
 */
export function validateTodo(projectRoot, reporter, opts = {}) {
  const phase = opts.phase ?? 'all';
  const customRoles = opts.customRoles ?? new Set();
  const skipSolFormat = shouldSkipTodoSolFormat(customRoles);
  const skipDevCheck = shouldSkipTodoDevCheck(customRoles);

  if (skipSolFormat) {
    reporter.add({
      severity: 'info',
      rule: 'ROLE-CUSTOM-SKIP',
      file: 'atlas/role/role-sol.md',
      message: customSkipMessage('sol', 'todo 格式(T头)'),
    });
  }
  if (skipDevCheck) {
    reporter.add({
      severity: 'info',
      rule: 'ROLE-CUSTOM-SKIP',
      file: 'atlas/role/role-dev.md',
      message: customSkipMessage('dev', 'todo DEV/TODO-CHECK'),
    });
  }

  const todoPath = path.join(projectRoot, 'atlas', 'todo.md');
  if (!exists(todoPath)) {
    const phaseNum = Number(phase);
    const mustHave = phase === 'all' || (!Number.isNaN(phaseNum) && phaseNum >= 3);
    reporter.add({
      severity: mustHave ? 'error' : 'warn',
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

  if (!skipSolFormat) {
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
  }

  const headers = extractTaskHeaders(content);
  if (!skipSolFormat) {
  for (const header of headers) {
    // 旧稿残留的方括号标签（与端标签 [BE]/[FE] 不同：紧贴描述尾或单独成段）
    if (/\[(?:精简|标准|完整|lite|standard|full)\]/i.test(header.raw)) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-禁标签',
        file: relPath,
        line: header.line,
        message: `${header.id} T 头格式：### T-xxx：[端] 描述 — F-xxx（勿加额外方括号标签）。`,
      });
    }

    const block = extractTaskBlock(content, header.line);
    const steps = checkThreeSteps(block);
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
  }

  validateCheckboxEvidence(projectRoot, content, reporter, relPath, headers, {
    skipDevCheck,
    skipSolClaimed: skipSolFormat,
  });

  // 开发完成格式：dev 文件数=T 头数 —— 阶段 4/5/all，或已标「开发实现 ✅」
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  const claimedDevDoneForCount =
    /开发实现\s*✅/.test(content) ||
    /^\s*-\s+\[[xX]\].*开发实现/m.test(content);
  const checkDevCount =
    phase === '4' || phase === '5' || phase === 'all' || claimedDevDoneForCount;
  if (!skipDevCheck && checkDevCount && headers.length > 0) {
    const devCount = countDevFiles(devRoot);
    if (devCount !== headers.length) {
      reporter.add({
        severity: 'error',
        rule: 'TODO-FORMAT-dev数不符',
        file: relPath,
        message: `dev 文件数(${devCount}) ≠ T 头数(${headers.length})（phase 为 4|5|all，或已标「开发实现 ✅」时检查）。`,
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
