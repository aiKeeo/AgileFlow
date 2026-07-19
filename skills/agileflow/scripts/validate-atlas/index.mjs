import path from 'node:path';
import { readText } from './lib/fs-utils.mjs';
import { detectBrownfield } from './lib/brownfield.mjs';
import { Reporter } from './lib/reporter.mjs';
import { loadAfEnv, validateAfEnv } from './lib/af-env.mjs';
import { resolveTemplateMode, resolveTemplatePreset } from './lib/template-loader.mjs';
import { validateDirectory } from './lib/rules/directory.mjs';
import { validateInit } from './lib/rules/init.mjs';
import { validateRequirements, validateReqConfirmed } from './lib/rules/requirements.mjs';
import { validateModel } from './lib/rules/model/index.mjs';
import { validateSolution } from './lib/rules/solution.mjs';
import { validateTodo } from './lib/rules/todo.mjs';
import { validateDev } from './lib/rules/dev/index.mjs';
import { validateGenericDocs } from './lib/rules/generic-doc.mjs';
import { validateTests } from './lib/rules/tests.mjs';
import { validateRunnable } from './lib/rules/runnable.mjs';
import { validateSmokeEntry } from './lib/rules/smoke.mjs';
import { validatePixelCompare } from './lib/rules/pixel.mjs';
import { validateReqTrace } from './lib/rules/trace.mjs';
import { validateDocFirst } from './lib/rules/doc-first.mjs';
import { validateDispatchLedger } from './lib/rules/dispatch-ledger.mjs';
import {
  loadCustomRoles,
  shouldSkipDocModule,
  resolveCustomRoleForModule,
  customSkipMessage,
} from './lib/rules/role-custom.mjs';

/**
 * @typedef {Object} ValidateOptions
 * @property {string} [projectRoot]
 * @property {'all'|'0'|'1'|'2'|'3'|'4'|'5'} [phase]
 * @property {boolean | 'auto'} [brownfield]
 * @property {'fast'|'strict'|'auto'} [mode]
 * @property {boolean} [verbose]
 * @property {string[]} [only]
 * @property {boolean} [templateMode]
 * @property {'integrity'|'write-code'} [docFirstScope]
 * @property {string} [dispatchGate]
 * @property {string} [devFile]
 */

/**
 * template 模式：按 phase 调用 generic-doc（与 legacy req/sol/dev 互斥）
 * @param {string} projectRoot
 * @param {import('./lib/reporter.mjs').Reporter} reporter
 * @param {{ phase: string, tier: string, shouldRun: (name: string) => boolean }} ctx
 */
function runTemplateDocValidation(projectRoot, reporter, ctx) {
  const { phase, tier, shouldRunDoc: runDoc } = ctx;
  const docOpts = { tier };

  if (runDoc('req') && (phase === 'all' || phase === '1')) {
    validateGenericDocs(projectRoot, reporter, { ...docOpts, phase: '1' });
  }
  if (runDoc('sol') && (phase === 'all' || phase === '3')) {
    validateGenericDocs(projectRoot, reporter, { ...docOpts, phase: '3' });
  }
  if (runDoc('dev') && (phase === 'all' || phase === '4')) {
    validateGenericDocs(projectRoot, reporter, { ...docOpts, phase: '4' });
  }
}

/**
 * 始终 full（参数仅兼容旧 CLI）
 * @param {string} [_todo]
 * @returns {'full'}
 */
export function resolveRiskTier(_todo) {
  return 'full';
}

/**
 * @param {string} [_devFile]
 * @param {string} [_todoContent]
 * @returns {'full'}
 */
export function resolveTierForDevFile(_devFile, _todoContent) {
  return 'full';
}

/**
 * 解析模式：agileflow.env / 请求 / todo 字样 → 默认 fast
 * @param {string} projectRoot
 * @param {'fast'|'strict'|'auto'|undefined} requested
 * @param {string} [_tier]
 * @param {{ flow?: 'fast'|'strict' } | null} [afState]
 */
function resolveMode(projectRoot, requested, _tier, afState) {
  if (requested && requested !== 'auto') return requested;
  if (afState?.flow && afState.flow !== 'pending') return afState.flow;
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
  if (/模式：.*严谨|强制严谨/.test(todo)) return 'strict';
  if (/模式：.*快速/.test(todo)) return 'fast';
  return 'fast';
}

/**
 * @param {string | undefined} [_requested]
 * @param {string} [_todoContent]
 * @param {{ tier?: string } | null} [_afState]
 * @returns {'full'}
 */
function resolveTier(_requested, _todoContent, _afState) {
  return 'full';
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
  const customRoles = loadCustomRoles(projectRoot);
  /** @type {Set<string>} */
  const customSkipLogged = new Set();

  /**
   * 文档模块：custom role 时跳过默认格式闸门
   * @param {string} name
   */
  const shouldRunDoc = (name) => {
    if (!shouldRun(name)) return false;
    if (!shouldSkipDocModule(name, customRoles)) return true;
    if (!customSkipLogged.has(name)) {
      customSkipLogged.add(name);
      const roleKey = resolveCustomRoleForModule(name, customRoles);
      if (roleKey) {
        reporter.add({
          severity: 'info',
          rule: 'ROLE-CUSTOM-SKIP',
          file: `atlas/role/role-${roleKey}.md`,
          message: customSkipMessage(roleKey, name),
        });
      }
    }
    return false;
  };

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
  const templateMode = options.templateMode ?? resolveTemplateMode(projectRoot);
  const templatePreset = templateMode ? resolveTemplatePreset(projectRoot) : null;
  const docOpts = { mode, tier, templateMode };
  // todo phase：完成闸门(4|5)以闸门为准（防 AF_PHASE=3 混过 dev-complete 跳过 dev 数核对）
  const todoPhase =
    phase === '4' || phase === '5'
      ? phase
      : afState?.phase ?? (phase !== 'all' ? phase : 'all');

  if (shouldRun('dir')) {
    validateDirectory(projectRoot, reporter, { phase, brownfield, templateMode });
  }
  if (shouldRun('init') && (phase === 'all' || phase === '0')) {
    validateInit(projectRoot, reporter);
  }

  if (templateMode) {
    runTemplateDocValidation(projectRoot, reporter, { phase, tier, shouldRunDoc });
    if (shouldRunDoc('sol') && (phase === 'all' || phase === '3')) {
      validateSolution(projectRoot, reporter, { ...docOpts, templateMode: true });
    }
  } else {
    if (shouldRunDoc('req') && (phase === 'all' || phase === '1')) {
      validateRequirements(projectRoot, reporter, docOpts);
    }
    if (shouldRunDoc('sol') && (phase === 'all' || phase === '3')) {
      validateSolution(projectRoot, reporter, docOpts);
    }
    if (shouldRunDoc('dev') && (phase === 'all' || phase === '4')) {
      validateDev(projectRoot, reporter, docOpts);
    }
  }

  if (shouldRunDoc('req-confirmed') && (phase === 'all' || phase === '3')) {
    validateReqConfirmed(projectRoot, reporter);
  }
  if (shouldRunDoc('model') && (phase === 'all' || phase === '2')) {
    validateModel(projectRoot, reporter);
  }
  if (shouldRun('todo') && (phase === 'all' || phase === '3' || phase === '4' || phase === '5')) {
    validateTodo(projectRoot, reporter, { tier, phase: todoPhase, customRoles });
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
  // 文档先行 / 假进度 integrity（write-code 档见 --gate write-code）
  if (shouldRun('doc-first')) {
    validateDocFirst(projectRoot, reporter, {
      scope: options.docFirstScope ?? 'integrity',
      afPhase: afState?.phase,
      templateMode,
      tier,
      mode,
      customRoles,
    });
  }
  if (shouldRun('dispatch-ledger') && options.dispatchGate) {
    validateDispatchLedger(projectRoot, reporter, {
      gateId: options.dispatchGate,
      devFile: options.devFile,
    });
  }

  const decide = afState?.decide ?? '—';
  reporter.add({
    severity: 'info',
    rule: 'RUN-OK',
    message: `校验完成 phase=${phase} mode=${mode} tier=${tier} decide=${decide} brownfield=${brownfield} templateMode=${templateMode}${templatePreset ? ` templatePreset=${templatePreset}` : ''}`,
  });

  return { passed: reporter.passed(), reporter, mode, tier, brownfield, afState, templateMode, templatePreset };
}

export { resolveTemplateMode, resolveTemplatePreset } from './lib/template-loader.mjs';
export { detectBrownfield } from './lib/brownfield.mjs';
export { loadAfEnv, validateAfEnv, inferPhaseFromArtifacts } from './lib/af-env.mjs';
export { resolveSkillRoot, resolveValidateScript, formatPortableGateCommand } from './lib/skill-path.mjs';
export { runDevLiteralCheck, runA7Grep } from './lib/rules/dev/index.mjs';
export { Reporter } from './lib/reporter.mjs';
export { runGate, listGates, getGate, formatGateCommand } from './lib/workflow.mjs';
export { AI_GATES, PHASE_DIRS, RISK_TIERS } from './lib/phase-spec.mjs';
