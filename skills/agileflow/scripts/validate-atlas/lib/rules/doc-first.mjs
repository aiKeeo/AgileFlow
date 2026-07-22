import fs from 'node:fs';
import path from 'node:path';
import { detectBusinessSource } from '../brownfield.mjs';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { Reporter } from '../reporter.mjs';
import {
  isModelingSkipped,
  solFeaturesRequired,
  countReqFiles,
  countFeatureFiles,
} from '../modeling.mjs';
import { validateRequirements, validateReqConfirmed } from './requirements.mjs';
import { validateModel } from './model/index.mjs';
import { validateSolution } from './solution.mjs';
import { validateTodo } from './todo.mjs';
import { validateGenericDocs } from './generic-doc.mjs';
import { runDevLiteralCheck } from './dev/index.mjs';
import {
  shouldSkipSolIntegrity,
  shouldSkipDevIntegrity,
  shouldSkipModelIntegrity,
} from './role-custom.mjs';
import { isStepSkipped } from '../flow.mjs';

/** @typedef {'integrity' | 'write-code'} DocFirstScope */

/**
 * 是否已启用 AgileFlow（有 env 或 requirements 目录）
 * @param {string} projectRoot
 */
export function isAgileFlowProject(projectRoot) {
  const atlas = path.join(projectRoot, 'atlas');
  if (!exists(atlas)) return false;
  if (exists(path.join(atlas, 'agileflow.env'))) return true;
  return exists(path.join(atlas, 'requirements'));
}

/**
 * 统计合规 T 级构思文件数
 * @param {string} devRoot
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
 * 统计 todo 中合法 T 头数
 * @param {string} todo
 */
function countTodoTHeaders(todo) {
  if (!todo) return 0;
  return [...todo.matchAll(/^#{3,4}\s+T-\d+/gm)].length;
}

/** @param {string} todo */
function claimedSolDone(todo) {
  return /方案设计\s*✅/.test(todo) || /^\s*-\s+\[[xX]\].*方案设计/m.test(todo);
}

/** @param {string} todo */
function claimedDevDone(todo) {
  return /开发实现\s*✅/.test(todo) || /^\s*-\s+\[[xX]\].*开发实现/m.test(todo);
}

/** @param {string} todo */
function claimedTestDone(todo) {
  return /测试验收\s*✅/.test(todo) || /^\s*-\s+\[[xX]\].*测试验收/m.test(todo);
}

/**
 * 是否有验收报告 / smoke 日志
 * @param {string} atlas
 */
function hasTestEvidence(atlas) {
  const testsRoot = path.join(atlas, 'tests');
  const reports = exists(testsRoot)
    ? collectFiles(testsRoot, '.md').filter(
        (f) => path.basename(f).includes('验收报告') || /REQ-\d+.*验收/.test(path.basename(f)),
      )
    : [];
  if (reports.length > 0) return true;
  const logsRoot = path.join(atlas, 'logs');
  if (!exists(logsRoot)) return false;
  return fs.readdirSync(logsRoot).some((f) => /smoke|compile|probe|test-entry|fe-smoke|be-smoke/i.test(f));
}

/** @param {string} readme */
function readmeMimicsTFiles(readme) {
  if (!readme) return false;
  return /^#{2,4}\s+T-\d+/m.test(readme);
}

/**
 * 合并子 Reporter 的 error/warn 到主 Reporter
 * @param {import('../reporter.mjs').Reporter} target
 * @param {import('../reporter.mjs').Reporter} source
 */
function mergeBlockingIssues(target, source) {
  for (const issue of source.getIssues()) {
    if (issue.severity === 'error' || issue.severity === 'warn') {
      target.add(issue);
    }
  }
}

/**
 * @typedef {Object} AtlasContext
 * @property {string} atlas
 * @property {string} todo
 * @property {string} todoRel
 * @property {boolean} hasArch
 * @property {number} tHeaders
 * @property {number} devCount
 * @property {number} reqCount
 * @property {number} featCount
 * @property {number | null} phaseNum
 * @property {boolean} needFeatures
 */

/**
 * 读取 atlas 上下文
 * @param {string} projectRoot
 * @param {{ afPhase?: string, templateMode?: boolean }} opts
 */
function loadAtlasContext(projectRoot, opts) {
  const atlas = path.join(projectRoot, 'atlas');
  const todoPath = path.join(atlas, 'todo.md');
  const todo = readText(todoPath) || '';
  const afPhase = opts.afPhase;
  return {
    atlas,
    todo,
    todoRel: exists(todoPath) ? rel(projectRoot, todoPath) : 'atlas/todo.md',
    hasArch: exists(path.join(atlas, 'solution', 'architecture.md')),
    tHeaders: countTodoTHeaders(todo),
    devCount: countDevFiles(path.join(atlas, 'dev')),
    reqCount: countReqFiles(projectRoot),
    featCount: countFeatureFiles(projectRoot),
    phaseNum: afPhase && /^\d+$/.test(afPhase) ? Number(afPhase) : null,
    needFeatures: solFeaturesRequired(projectRoot, opts.templateMode ?? false),
  };
}

/**
 * integrity 档：假进度 / README 冒充 T / AF_PHASE 对齐（与业务源码无关）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {AtlasContext} ctx
 * @param {Set<string>} [customRoles]
 */
function validateProgressIntegrity(projectRoot, reporter, ctx, customRoles = new Set()) {
  const { atlas, todo, todoRel, hasArch, tHeaders, devCount, reqCount, featCount, phaseNum, needFeatures } = ctx;
  const skipSol = shouldSkipSolIntegrity(customRoles) || isStepSkipped(projectRoot, 'sol');
  const skipDev = shouldSkipDevIntegrity(customRoles) || isStepSkipped(projectRoot, 'dev');
  const skipModel = shouldSkipModelIntegrity(customRoles);
  const skipReq = customRoles.has('req') || isStepSkipped(projectRoot, 'req');
  const skipTest = isStepSkipped(projectRoot, 'test');

  if (!skipSol && claimedSolDone(todo) && !hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-方案进度假',
      file: todoRel,
      message:
        '流程进度已标「方案设计 ✅」，但缺少 atlas/solution/architecture.md——禁止用 solution/README 揉方案冒充完成。',
    });
  }

  if (!skipSol && claimedSolDone(todo) && reqCount > 0 && featCount === 0 && needFeatures) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-方案无features',
      file: 'atlas/solution/features/',
      message:
        '流程进度已标「方案设计 ✅」，且有 REQ，但缺少 atlas/solution/features/F-*.md——禁止把边界揉进 README。',
    });
  }

  if (!skipDev && claimedDevDone(todo)) {
    if (tHeaders === 0) {
      reporter.add({
        severity: 'error',
        rule: 'SKIP-开发进度无T',
        file: todoRel,
        message: '流程进度已标「开发实现 ✅」，但无 ### T-xxx——禁止假完成。',
      });
    } else if (devCount !== tHeaders) {
      reporter.add({
        severity: 'error',
        rule: 'SKIP-开发进度无dev',
        file: 'atlas/dev/',
        message: `流程进度已标「开发实现 ✅」，但合规 T 构思文件数(${devCount}) ≠ T 头数(${tHeaders})——禁止空勾/README 汇总冒充。`,
      });
    }
  }

  if (!skipDev && phaseNum !== null && phaseNum >= 4 && tHeaders > 0 && devCount !== tHeaders) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-PHASE4无dev',
      file: 'atlas/agileflow.env',
      message: `AF_PHASE=${phaseNum} 要求每 T 有合规构思文件，当前 dev(${devCount}) ≠ T头(${tHeaders})。`,
    });
  }

  if (!skipSol && phaseNum !== null && phaseNum >= 3 && !hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-PHASE3无architecture',
      file: 'atlas/agileflow.env',
      message: `AF_PHASE=${phaseNum}≥3 但缺少 atlas/solution/architecture.md——禁止虚假阶段。`,
    });
  }

  if (!skipSol && phaseNum !== null && phaseNum >= 3 && reqCount > 0 && featCount === 0 && needFeatures) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-PHASE3无features',
      file: 'atlas/solution/features/',
      message: `AF_PHASE=${phaseNum}≥3 且有 REQ，但缺少 features/F-*.md——禁止无边界进方案/开发。`,
    });
  }

  if (!skipModel && phaseNum !== null && phaseNum >= 3 && !isModelingSkipped(projectRoot)) {
    const modelReadme = path.join(atlas, 'model', 'README.md');
    if (!exists(modelReadme)) {
      reporter.add({
        severity: 'error',
        rule: 'SKIP-MODEL-无判定',
        file: todoRel,
        message:
          'AF_PHASE≥3 但缺少 atlas/model/，且 flow.yaml 未 skip model（亦无旧版 todo 跳过判定）——禁止静默跳过建模。',
      });
    }
  }

  const devReadmePath = path.join(atlas, 'dev', 'README.md');
  const devReadme = readText(devReadmePath) || '';
  if (!skipDev && readmeMimicsTFiles(devReadme) && (devCount === 0 || (tHeaders > 0 && devCount !== tHeaders))) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-README冒充T',
      file: rel(projectRoot, devReadmePath),
      message:
        'atlas/dev/README.md 含 T-xxx 章节，但缺少等量合规 T-*.md——禁止用 README 汇总冒充分文件构思。',
    });
  }

  if (claimedTestDone(todo) && !skipTest) {
    const testsReadme = readText(path.join(atlas, 'tests', 'README.md')) || '';
    if (!/\bPASS\b/.test(testsReadme)) {
      reporter.add({
        severity: 'error',
        rule: 'SKIP-测试进度假',
        file: 'atlas/tests/README.md',
        message:
          '流程进度已标「测试验收 ✅」，但 tests/README 无字面量 PASS——禁止用「静态通过」等冒充验收。',
      });
    }
    if (!hasTestEvidence(atlas)) {
      reporter.add({
        severity: 'error',
        rule: 'SKIP-测试无证据',
        file: todoRel,
        message:
          '流程进度已标「测试验收 ✅」，但缺少验收报告（tests/REQ-*-验收报告.md）或 logs smoke 文件。',
      });
    }
  }
}

/**
 * write-code 档：首笔写码前（尚无业务源码）须 todo T 与 dev ① 对齐
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {AtlasContext} ctx
 * @param {Set<string>} [customRoles]
 */
function validatePreCodeTodoDev(reporter, ctx, customRoles = new Set()) {
  if (shouldSkipDevIntegrity(customRoles)) return;
  const { tHeaders, devCount, todoRel } = ctx;

  if (tHeaders === 0) {
    reporter.add({
      severity: 'error',
      rule: 'DOC-FIRST-无T',
      file: todoRel,
      message: 'AgileFlow 项目写码前须在 todo 有 ### T-xxx，且每 T 有合规 dev 构思（① 已过 literal）。',
    });
    return;
  }

  if (devCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'DOC-FIRST-无dev',
      file: 'atlas/dev/',
      message: `todo 有 ${tHeaders} 个 T 头，但 atlas/dev/ 无合规 T-*.md——写码前须先落盘 dev ① 并通过 literal。`,
    });
    return;
  }

  if (devCount !== tHeaders) {
    reporter.add({
      severity: 'error',
      rule: 'DOC-FIRST-dev数不符',
      file: 'atlas/dev/',
      message: `写码前：dev 文件数(${devCount}) ≠ T 头数(${tHeaders})。`,
    });
  }
}

/**
 * write-code 档：有业务源码时的存在性对齐（不含 dev ① 字面量，全链统一查）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {AtlasContext} ctx
 * @param {Set<string>} [customRoles]
 */
function validateCodeDocAlignment(projectRoot, reporter, ctx, customRoles = new Set()) {
  const { todoRel, hasArch, tHeaders, devCount, reqCount, featCount, phaseNum, needFeatures, todo } = ctx;
  const skipReq = customRoles.has('req') || isStepSkipped(projectRoot, 'req');
  const skipSol = shouldSkipSolIntegrity(customRoles) || isStepSkipped(projectRoot, 'sol');
  const skipDev = shouldSkipDevIntegrity(customRoles) || isStepSkipped(projectRoot, 'dev');

  if (!skipSol && !hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无architecture',
      file: 'atlas/solution/architecture.md',
      message:
        '已探测到业务源码，但缺少 atlas/solution/architecture.md——禁止先码后补方案（solution/README 揉契约不够）。',
    });
  }

  if (!skipReq && reqCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'DOC-FIRST-无REQ',
      file: 'atlas/requirements/',
      message: '已探测到业务源码，但无合规 REQ 文件——写码前须先落盘并确认需求。',
    });
  }

  if (!skipSol && reqCount > 0 && featCount === 0 && needFeatures) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无features',
      file: 'atlas/solution/features/',
      message:
        '已探测到业务源码且存在 REQ，但缺少 features/F-*.md——禁止跳过方案边界落盘。',
    });
  }

  if (!skipDev && tHeaders > 0 && devCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无dev',
      file: 'atlas/dev/',
      message: `已探测到业务源码且 todo 有 ${tHeaders} 个 T 头，但 atlas/dev/ 下无合规 T-*.md——禁止先码后补构思。`,
    });
  } else if (!skipDev && tHeaders > 0 && devCount !== tHeaders) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-dev数不符',
      file: 'atlas/dev/',
      message: `已探测到业务源码：dev 文件数(${devCount}) ≠ T 头数(${tHeaders})。`,
    });
  } else if (!skipDev && tHeaders === 0 && !claimedDevDone(todo) && phaseNum !== null && phaseNum >= 4) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无T',
      file: todoRel,
      message: '已探测到业务源码且 AF_PHASE≥4，但 todo 无 ### T-xxx——禁止无任务写码。',
    });
  }

  reporter.add({
    severity: 'info',
    rule: 'SKIP-CODE-探测',
    message: `已探测业务源码；arch=${hasArch} features=${featCount} T头=${tHeaders} dev=${devCount}`,
  });
}

/**
 * 每个 T 的 dev ① 字面量校验（write-code 全链唯一入口）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateDevStep1ForAllT(projectRoot, reporter) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return;

  const files = collectFiles(devRoot, '.md').filter((f) => {
    const base = path.basename(f);
    return /^T-\d+-.+\.md$/.test(base) && !base.startsWith('temp');
  });

  for (const file of files) {
    const lit = runDevLiteralCheck(file, { stage: 'step1', tier: 'full' });
    if (!lit.passed) {
      for (const issue of lit.issues) {
        reporter.add({
          severity: 'error',
          rule: issue.rule,
          file: rel(projectRoot, file),
          message: issue.message,
        });
      }
    }
  }
}

/**
 * write-code 档：AF 项目 + 有源码 → upstream 全链格式校验
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ templateMode?: boolean, tier?: string, mode?: string, customRoles?: Set<string> }} opts
 */
function validateWriteCodeFullChain(projectRoot, reporter, opts) {
  const tier = opts.tier ?? 'full';
  const customRoles = opts.customRoles ?? new Set();
  const docOpts = { tier, mode: opts.mode ?? 'full', templateMode: opts.templateMode ?? false };
  const sub = new Reporter();

  if (docOpts.templateMode) {
    if (!customRoles.has('req')) {
      validateGenericDocs(projectRoot, sub, { ...docOpts, phase: '1' });
    }
    if (!customRoles.has('sol')) {
      validateGenericDocs(projectRoot, sub, { ...docOpts, phase: '3' });
    }
    if (!customRoles.has('dev')) {
      validateGenericDocs(projectRoot, sub, { ...docOpts, phase: '4' });
    }
    if (!customRoles.has('sol')) {
      validateSolution(projectRoot, sub, { ...docOpts, templateMode: true });
    }
  } else {
    if (!customRoles.has('req') && !isStepSkipped(projectRoot, 'req')) {
      validateRequirements(projectRoot, sub, docOpts);
      validateReqConfirmed(projectRoot, sub);
    }
    if (!shouldSkipModelIntegrity(customRoles) && !isModelingSkipped(projectRoot)) {
      validateModel(projectRoot, sub);
    }
    if (!customRoles.has('sol') && !isStepSkipped(projectRoot, 'sol')) {
      validateSolution(projectRoot, sub, docOpts);
    }
    if (!isStepSkipped(projectRoot, 'dev')) {
      validateTodo(projectRoot, sub, { tier, phase: '4', customRoles });
    }
  }

  mergeBlockingIssues(reporter, sub);
  if (!customRoles.has('dev') && !isStepSkipped(projectRoot, 'dev')) {
    validateDevStep1ForAllT(projectRoot, reporter);
  }
}

/**
 * 文档先行硬锁（合并原 anti-skip）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ scope?: DocFirstScope, afPhase?: string, templateMode?: boolean, tier?: string, mode?: string, customRoles?: Set<string> }} [opts]
 */
export function validateDocFirst(projectRoot, reporter, opts = {}) {
  const scope = opts.scope ?? 'integrity';
  const customRoles = opts.customRoles ?? new Set();
  const atlas = path.join(projectRoot, 'atlas');
  if (!exists(atlas)) return;

  const ctx = loadAtlasContext(projectRoot, opts);
  validateProgressIntegrity(projectRoot, reporter, ctx, customRoles);

  if (scope === 'integrity') {
    return;
  }

  if (!isAgileFlowProject(projectRoot)) {
    reporter.add({
      severity: 'info',
      rule: 'DOC-FIRST-OK',
      message: 'write-code：非 AgileFlow 项目（无 agileflow.env / requirements/），跳过全链格式校验。',
    });
    return;
  }

  const hasBusiness = detectBusinessSource(projectRoot);
  reporter.add({
    severity: 'info',
    rule: 'DOC-FIRST-触发',
    message: hasBusiness
      ? 'AgileFlow 项目已探测到业务源码——执行文档先行全链格式校验（与 AF_DECIDE 无关）。'
      : 'AgileFlow 项目写码前闸门——首笔写码亦须 REQ→sol→dev① 全链格式通过。',
  });

  if (hasBusiness) {
    validateCodeDocAlignment(projectRoot, reporter, ctx, customRoles);
  } else {
    validatePreCodeTodoDev(reporter, ctx, customRoles);
  }

  validateWriteCodeFullChain(projectRoot, reporter, { ...opts, customRoles });

  if (reporter.getIssues().every((i) => i.severity !== 'error' && i.severity !== 'warn')) {
    reporter.add({
      severity: 'info',
      rule: 'DOC-FIRST-OK',
      message: '文档先行全链校验通过，允许 Write 业务源码。',
    });
  }
}

/** @deprecated 使用 validateDocFirst；保留别名供过渡期引用 */
export function validateAntiSkip(projectRoot, reporter, opts = {}) {
  validateDocFirst(projectRoot, reporter, { ...opts, scope: 'write-code' });
}
