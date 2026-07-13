import path from 'node:path';
import { readText } from './lib/fs-utils.mjs';
import { detectBrownfield } from './lib/brownfield.mjs';import { Reporter } from './lib/reporter.mjs';
import { validateDirectory } from './lib/rules/directory.mjs';
import { validateInit } from './lib/rules/init.mjs';
import { validateRequirements, validateReqConfirmed } from './lib/rules/requirements.mjs';
import { validateModel } from './lib/rules/model.mjs';
import { validateSolution } from './lib/rules/solution.mjs';
import { validateTodo } from './lib/rules/todo.mjs';
import { validateDev } from './lib/rules/dev.mjs';
import { validateTests } from './lib/rules/tests.mjs';
import { validateRunnable } from './lib/rules/runnable.mjs';
import { validateSmokeEntry } from './lib/rules/smoke.mjs';
import { validatePixelCompare } from './lib/rules/pixel.mjs';

/**
 * @typedef {Object} ValidateOptions
 * @property {string} [projectRoot]
 * @property {'all'|'0'|'1'|'2'|'3'|'4'|'5'} [phase]
 * @property {boolean | 'auto'} [brownfield]
 * @property {'fast'|'strict'|'auto'} [mode]
 * @property {boolean} [verbose]
 * @property {string[]} [only]
 */

/**
 * 统计 todo 中合法 T 头数量
 * @param {string} todo
 */
function countTHeaders(todo) {
  return (todo.match(/^#{3,4}\s+T-\d+/gm) || []).length;
}

/**
 * T≥3 或同时出现 BE+FE 任务 → 强制严谨（文档铁律）
 * @param {string} todo
 */
function shouldForceStrict(todo) {
  if (!todo) return false;
  if (countTHeaders(todo) >= 3) return true;
  const hasBe = /T-\d+[^\n]*BE|-BE\.md|端：\*\*BE\*\*|【BE】/i.test(todo);
  const hasFe = /T-\d+[^\n]*FE|-FE\.md|端：\*\*FE\*\*|【FE】/i.test(todo);
  return hasBe && hasFe;
}

/**
 * 解析模式：显式严谨优先；T≥3/BE+FE 强制严谨；否则尊重快速；默认 fast
 * @param {string} projectRoot
 * @param {'fast'|'strict'|'auto'|undefined} requested
 */
function resolveMode(projectRoot, requested) {
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
  if (shouldForceStrict(todo)) return 'strict';
  if (requested && requested !== 'auto') return requested;
  if (/模式：.*严谨|强制严谨/.test(todo)) return 'strict';
  if (/模式：.*快速/.test(todo)) return 'fast';
  return 'fast';
}

export function validateAtlas(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const phase = options.phase ?? 'all';
  const brownfield =
    options.brownfield === 'auto' || options.brownfield === undefined
      ? detectBrownfield(projectRoot)
      : options.brownfield;
  const mode = resolveMode(projectRoot, options.mode);

  const reporter = new Reporter();
  const only = options.only ?? null;
  const shouldRun = (name) => !only || only.includes(name);
  const devOpts = { mode };

  if (shouldRun('dir')) {
    validateDirectory(projectRoot, reporter, { phase, brownfield });
  }
  if (shouldRun('init') && (phase === 'all' || phase === '0')) {
    validateInit(projectRoot, reporter);
  }
  if (shouldRun('req') && (phase === 'all' || phase === '1')) {
    validateRequirements(projectRoot, reporter);
  }
  if (shouldRun('req-confirmed') && (phase === 'all' || phase === '3')) {
    validateReqConfirmed(projectRoot, reporter);
  }
  if (shouldRun('model') && (phase === 'all' || phase === '2')) {
    validateModel(projectRoot, reporter);
  }
  if (shouldRun('sol') && (phase === 'all' || phase === '3')) {
    validateSolution(projectRoot, reporter);
  }
  if (shouldRun('todo') && (phase === 'all' || phase === '3' || phase === '4' || phase === '5')) {
    validateTodo(projectRoot, reporter);
  }
  if (shouldRun('dev') && (phase === 'all' || phase === '4')) {
    validateDev(projectRoot, reporter, devOpts);
  }
  if (shouldRun('runnable') && (phase === 'all' || phase === '4' || phase === '5')) {
    validateRunnable(projectRoot, reporter);
  }
  if (shouldRun('tests') && (phase === 'all' || phase === '5')) {
    validateTests(projectRoot, reporter);
  }
  if (shouldRun('smoke') && (phase === 'all' || phase === '5')) {
    validateSmokeEntry(projectRoot, reporter);
  }
  if (shouldRun('pixel') && (phase === 'all' || phase === '4' || phase === '5')) {
    validatePixelCompare(projectRoot, reporter);
  }

  reporter.add({
    severity: 'info',
    rule: 'RUN-OK',
    message: `校验完成 phase=${phase} mode=${mode} brownfield=${brownfield}`,
  });

  return { passed: reporter.passed(), reporter, mode, brownfield };
}

export { detectBrownfield } from './lib/brownfield.mjs';
export { resolveSkillRoot, resolveValidateScript, formatPortableGateCommand } from './lib/skill-path.mjs';
export { runDevLiteralCheck, runA7Grep } from './lib/rules/dev.mjs';
export { Reporter } from './lib/reporter.mjs';
export { runGate, listGates, getGate, formatGateCommand } from './lib/workflow.mjs';
export { AI_GATES, PHASE_DIRS, DEV_NINE_SECTIONS } from './lib/phase-spec.mjs';
