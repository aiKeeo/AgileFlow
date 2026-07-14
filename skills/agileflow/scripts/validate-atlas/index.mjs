import path from 'node:path';
import { readText } from './lib/fs-utils.mjs';
import { detectBrownfield } from './lib/brownfield.mjs';import { Reporter } from './lib/reporter.mjs';
import { loadAfEnv, validateAfEnv } from './lib/af-env.mjs';
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
import { validateReqTrace } from './lib/rules/trace.mjs';

/**
 * @typedef {Object} ValidateOptions
 * @property {string} [projectRoot]
 * @property {'all'|'0'|'1'|'2'|'3'|'4'|'5'} [phase]
 * @property {boolean | 'auto'} [brownfield]
 * @property {'fast'|'strict'|'auto'} [mode]
 * @property {boolean} [verbose]
 * @property {string[]} [only]
 */

/** 风险维度关键词 → 命中即完整档 */
const RISK_DIMENSIONS = [
  /支付|payment|alipay|微信支付|交易退款/i,
  /权限|permission|auth\b|RBAC|角色管理|鉴权/i,
  /DB\s*schema|数据库迁移|migration\b|DDL\b|ALTER\sTABLE|CREATE\sTABLE/i,
  /多模块|跨模块|microservice/i,
];

/**
 * 风险分档：精简 / 标准 / 完整
 * 替代原 T≥3 强制严谨——分档由风险维度决定，不由 T 数量决定
 * @param {string} todo
 * @returns {'lite'|'standard'|'full'}
 */
export function resolveRiskTier(todo) {
  if (!todo) return 'standard';

  // 1. 显式标注 [精简|标准|完整]
  if (/\[精简\]|\[lite\]/i.test(todo)) return 'lite';
  if (/\[完整\]|\[full\]/i.test(todo)) return 'full';
  if (/\[标准\]|\[standard\]/i.test(todo)) return 'standard';

  // 2. 模块配置区 dev-doc 字段
  const moduleConfig = todo.match(/##\s*模块配置[\s\S]*?(?=\n##\s|$)/);
  if (moduleConfig) {
    const devDocMatch = moduleConfig[0].match(/dev-doc:\s*(\S+)/i);
    if (devDocMatch) {
      const val = devDocMatch[1].toLowerCase();
      if (/lite|精简|3段?/.test(val)) return 'lite';
      if (/full|完整/.test(val)) return 'full';
      if (/standard|标准|5段?/.test(val)) return 'standard';
    }
  }

  // 3. 风险维度自动检测 → full
  for (const pattern of RISK_DIMENSIONS) {
    if (pattern.test(todo)) return 'full';
  }

  // 4. BE+FE → standard
  const hasBe = /T-\d+[^\n]*BE|-BE\.md|端：\*\*BE\*\*|【BE】/i.test(todo);
  const hasFe = /T-\d+[^\n]*FE|-FE\.md|端：\*\*FE\*\*|【FE】/i.test(todo);
  if (hasBe && hasFe) return 'standard';

  // 5. 默认 standard（不再用 T≥3 强制）
  return 'standard';
}

/**
 * 解析模式：agileflow.env 优先 → full 档 → todo 字样 → 默认 fast
 * @param {string} projectRoot
 * @param {'fast'|'strict'|'auto'|undefined} requested
 * @param {'lite'|'standard'|'full'} [tier]
 * @param {{ flow?: 'fast'|'strict' } | null} [afState]
 */
function resolveMode(projectRoot, requested, tier, afState) {
  if (requested && requested !== 'auto') return requested;
  if (afState?.flow && afState.flow !== 'pending') return afState.flow;
  if (tier === 'full') return 'strict';
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
  if (/模式：.*严谨|强制严谨/.test(todo)) return 'strict';
  if (/模式：.*快速/.test(todo)) return 'fast';
  return 'fast';
}

/**
 * 解析档位：显式 options → env AF_TIER → todo 推断
 * @param {string | undefined} requested
 * @param {string} todoContent
 * @param {{ tier?: string } | null} afState
 */
function resolveTier(requested, todoContent, afState) {
  if (requested) return requested;
  if (afState?.tier) return afState.tier;
  return resolveRiskTier(todoContent);
}

export function validateAtlas(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const phase = options.phase ?? 'all';
  const brownfield =
    options.brownfield === 'auto' || options.brownfield === undefined
      ? detectBrownfield(projectRoot)
      : options.brownfield;
  const todoContent = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';

  const reporter = new Reporter();
  const only = options.only ?? null;
  const shouldRun = (name) => !only || only.includes(name);

  /** @type {import('./lib/af-env.mjs').AfState | null} */
  let afState = null;
  if (shouldRun('af-env')) {
    afState = validateAfEnv(projectRoot, reporter, {
      brownfield,
      gatePhase: phase,
      requireEnv: true,
    });
  } else {
    const loaded = loadAfEnv(projectRoot);
    if (loaded.ok) afState = loaded.state;
  }

  const tier = resolveTier(options.tier, todoContent, afState);
  const mode = resolveMode(projectRoot, options.mode, tier, afState);
  const devOpts = { mode, tier };
  // todo phase：完成闸门(4|5)以闸门为准（防 AF_PHASE=3 混过 dev-complete 跳过 dev 数核对）
  const todoPhase =
    phase === '4' || phase === '5'
      ? phase
      : afState?.phase ?? (phase !== 'all' ? phase : 'all');

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
    validateTodo(projectRoot, reporter, { tier, phase: todoPhase });
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
    validateSmokeEntry(projectRoot, reporter, { incremental: options.incremental });
  }
  if (shouldRun('pixel') && (phase === 'all' || phase === '4' || phase === '5')) {
    validatePixelCompare(projectRoot, reporter);
  }
  if (shouldRun('trace') && (phase === 'all' || phase === '3' || phase === '4' || phase === '5')) {
    validateReqTrace(projectRoot, reporter);
  }

  const decide = afState?.decide ?? '—';
  reporter.add({
    severity: 'info',
    rule: 'RUN-OK',
    message: `校验完成 phase=${phase} mode=${mode} tier=${tier} decide=${decide} brownfield=${brownfield}`,
  });

  return { passed: reporter.passed(), reporter, mode, tier, brownfield, afState };
}

export { detectBrownfield } from './lib/brownfield.mjs';
export { loadAfEnv, validateAfEnv, inferPhaseFromArtifacts } from './lib/af-env.mjs';
export { resolveSkillRoot, resolveValidateScript, formatPortableGateCommand } from './lib/skill-path.mjs';
export { runDevLiteralCheck, runA7Grep } from './lib/rules/dev.mjs';
export { Reporter } from './lib/reporter.mjs';
export { runGate, listGates, getGate, formatGateCommand } from './lib/workflow.mjs';
export { AI_GATES, PHASE_DIRS, RISK_TIERS } from './lib/phase-spec.mjs';
