import fs from 'node:fs';
import path from 'node:path';
import { detectBusinessSource } from '../brownfield.mjs';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 统计合规 T 级构思文件数（T-xxx-*.md，排除 README/temp）
 * @param {string} devRoot
 * @returns {number}
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
 * 统计 todo 中合法 T 头数（### / ####）
 * @param {string} todo
 * @returns {number}
 */
function countTodoTHeaders(todo) {
  if (!todo) return 0;
  return [...todo.matchAll(/^#{3,4}\s+T-\d+/gm)].length;
}

/**
 * 统计 REQ-*.md（排除 ui/）
 * @param {string} projectRoot
 * @returns {number}
 */
function countReqFiles(projectRoot) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return 0;
  return collectFiles(reqRoot, '.md').filter((f) => {
    const base = path.basename(f);
    return base.startsWith('REQ-') && !f.includes(`${path.sep}ui${path.sep}`);
  }).length;
}

/**
 * 统计 F-*.md
 * @param {string} projectRoot
 * @returns {number}
 */
function countFeatureFiles(projectRoot) {
  const featRoot = path.join(projectRoot, 'atlas', 'solution', 'features');
  if (!exists(featRoot)) return 0;
  return collectFiles(featRoot, '.md').filter((f) =>
    /^F-\d+-.+\.md$/.test(path.basename(f)),
  ).length;
}

/**
 * 流程进度是否已勾「方案设计」
 * @param {string} todo
 */
function claimedSolDone(todo) {
  return /方案设计\s*✅/.test(todo) || /^\s*-\s+\[[xX]\].*方案设计/m.test(todo);
}

/**
 * 流程进度是否已勾「开发实现」
 * @param {string} todo
 */
function claimedDevDone(todo) {
  return /开发实现\s*✅/.test(todo) || /^\s*-\s+\[[xX]\].*开发实现/m.test(todo);
}

/**
 * 流程进度是否已勾「测试验收」
 * @param {string} todo
 */
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

/**
 * dev/README 是否用 T-xxx 小节冒充分文件构思
 * @param {string} readme
 */
function readmeMimicsTFiles(readme) {
  if (!readme) return false;
  return /^#{2,4}\s+T-\d+/m.test(readme);
}

/**
 * 反偷懒：业务源码 / 假进度 / README 冒充 T 与 atlas 合规产物对齐
 * 任意闸门应挂本模块；有业务码或假进度即硬挡
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ afPhase?: string }} [opts]
 */
export function validateAntiSkip(projectRoot, reporter, opts = {}) {
  const atlas = path.join(projectRoot, 'atlas');
  if (!exists(atlas)) return;

  const todoPath = path.join(atlas, 'todo.md');
  const todo = readText(todoPath) || '';
  const todoRel = exists(todoPath) ? rel(projectRoot, todoPath) : 'atlas/todo.md';
  const archPath = path.join(atlas, 'solution', 'architecture.md');
  const hasArch = exists(archPath);
  const hasBusiness = detectBusinessSource(projectRoot);
  const tHeaders = countTodoTHeaders(todo);
  const devCount = countDevFiles(path.join(atlas, 'dev'));
  const reqCount = countReqFiles(projectRoot);
  const featCount = countFeatureFiles(projectRoot);
  const afPhase = opts.afPhase;
  const phaseNum = afPhase && /^\d+$/.test(afPhase) ? Number(afPhase) : null;

  // —— 假进度（不依赖业务源码）——
  if (claimedSolDone(todo) && !hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-方案进度假',
      file: todoRel,
      message:
        '流程进度已标「方案设计 ✅」，但缺少 atlas/solution/architecture.md——禁止用 solution/README 揉方案冒充完成。',
    });
  }

  if (claimedSolDone(todo) && reqCount > 0 && featCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-方案无features',
      file: 'atlas/solution/features/',
      message:
        '流程进度已标「方案设计 ✅」，且有 REQ，但缺少 atlas/solution/features/F-*.md——禁止把边界揉进 README。',
    });
  }

  if (claimedDevDone(todo)) {
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

  // AF_PHASE≥4 却无合规 dev（堵只改 env 不落盘）
  if (phaseNum !== null && phaseNum >= 4 && tHeaders > 0 && devCount !== tHeaders) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-PHASE4无dev',
      file: 'atlas/agileflow.env',
      message: `AF_PHASE=${afPhase} 要求每 T 有合规构思文件，当前 dev(${devCount}) ≠ T头(${tHeaders})。`,
    });
  }

  if (phaseNum !== null && phaseNum >= 3 && !hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-PHASE3无architecture',
      file: 'atlas/agileflow.env',
      message: `AF_PHASE=${afPhase}≥3 但缺少 atlas/solution/architecture.md——禁止虚假阶段。`,
    });
  }

  // —— README 冒充 T 文件 ——
  const devReadmePath = path.join(atlas, 'dev', 'README.md');
  const devReadme = readText(devReadmePath) || '';
  if (readmeMimicsTFiles(devReadme) && (devCount === 0 || (tHeaders > 0 && devCount !== tHeaders))) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-README冒充T',
      file: rel(projectRoot, devReadmePath),
      message:
        'atlas/dev/README.md 含 T-xxx 章节，但缺少等量合规 T-*.md——禁止用 README 汇总冒充分文件构思。',
    });
  }

  // —— 假测试进度（不依赖业务源码；须在 early-return 前）——
  if (claimedTestDone(todo)) {
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

  // —— 有业务源码：必须已有合规 sol，且有 T 时必须有等量 dev ——
  if (!hasBusiness) {
    reporter.add({
      severity: 'info',
      rule: 'SKIP-OK',
      message: '未探测到业务源码目录，跳过源码对齐检查。',
    });
    return;
  }

  if (!hasArch) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无architecture',
      file: 'atlas/solution/architecture.md',
      message:
        '已探测到业务源码，但缺少 atlas/solution/architecture.md——禁止先码后补方案（solution/README 揉契约不够）。',
    });
  }

  if (reqCount > 0 && featCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无features',
      file: 'atlas/solution/features/',
      message:
        '已探测到业务源码且存在 REQ，但缺少 features/F-*.md——禁止跳过方案边界落盘。',
    });
  }

  if (tHeaders > 0 && devCount === 0) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-无dev',
      file: 'atlas/dev/',
      message: `已探测到业务源码且 todo 有 ${tHeaders} 个 T 头，但 atlas/dev/ 下无合规 T-*.md——禁止先码后补构思。`,
    });
  } else if (tHeaders > 0 && devCount !== tHeaders) {
    reporter.add({
      severity: 'error',
      rule: 'SKIP-CODE-dev数不符',
      file: 'atlas/dev/',
      message: `已探测到业务源码：dev 文件数(${devCount}) ≠ T 头数(${tHeaders})。`,
    });
  } else if (tHeaders === 0 && claimedDevDone(todo) === false && phaseNum !== null && phaseNum >= 4) {
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
