import path from 'node:path';
import { validateAtlas, runDevLiteralCheck, resolveTierForDevFile } from '../index.mjs';
import { AI_GATES } from './phase-spec.mjs';
import { Reporter } from './reporter.mjs';
import { readText } from './fs-utils.mjs';
import { formatPortableGateCommand } from './skill-path.mjs';
import { validateDispatchLedger } from './rules/dispatch-ledger.mjs';
import { validateAfCommands } from './rules/af-commands.mjs';
import {
  loadCustomRoles,
  shouldSkipDocModule,
  customSkipMessage,
} from './rules/role-custom.mjs';
import { GATE_TO_STEP, isStepSkipped } from './flow.mjs';

/** 闸门 ID 别名 */
const GATE_ALIASES = {
  'dev-a7': 'dev-step1-literal',
  'anti-skip': 'write-code',
};

/**
 * 列出所有 AI 流程闸门
 */
export function listGates() {
  return { ...AI_GATES };
}

/**
 * 解析闸门 ID
 * @param {string} gateId
 */
function resolveGateId(gateId) {
  return GATE_ALIASES[gateId] ?? gateId;
}

/**
 * 获取单个闸门定义
 * @param {string} gateId
 */
export function getGate(gateId) {
  const resolved = resolveGateId(gateId);
  const gate = AI_GATES[resolved];
  if (!gate) {
    throw new Error(`未知闸门：${gateId}。可用：${Object.keys(AI_GATES).join(', ')}`);
  }
  return gate;
}

/**
 * 执行 AI 流程闸门校验
 * @param {string} gateId
 * @param {{ projectRoot?: string, brownfield?: boolean | 'auto', devFile?: string, mode?: 'full'|'auto', verbose?: boolean }} [opts]
 */
export function runGate(gateId, opts = {}) {
  const resolved = resolveGateId(gateId);
  const gate = getGate(gateId);
  const projectRoot = opts.projectRoot ?? process.cwd();

  const flowStepId = GATE_TO_STEP[resolved];
  if (flowStepId && isStepSkipped(projectRoot, flowStepId)) {
    const reporter = new Reporter();
    reporter.add({
      severity: 'info',
      rule: 'FLOW-STEP-SKIP',
      file: 'atlas/flow.yaml',
      message: `flow.yaml 中 ${flowStepId}.skip=true → 闸门 ${resolved} 视为 SKIP（不验该步产物）。`,
    });
    return {
      passed: true,
      gateId: resolved,
      gate,
      reporter,
      skippedByFlow: true,
    };
  }

  if (resolved === 'dev-step1-literal') {
    if (!opts.devFile) {
      throw new Error('dev-step1-literal 闸门须指定 devFile（atlas/dev/T-xxx-*.md）');
    }
    const todoContent = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
    const tier = opts.tier ?? resolveTierForDevFile(opts.devFile, todoContent);
    const customRoles = loadCustomRoles(projectRoot);
    const skipLiteral = shouldSkipDocModule('dev-step1-literal', customRoles);
    const reporter = new Reporter();
    /** @type {{ passed: boolean, issues: object[] } | undefined} */
    let literal;

    if (skipLiteral) {
      reporter.add({
        severity: 'info',
        rule: 'ROLE-CUSTOM-SKIP',
        file: 'atlas/role/role-dev.md',
        message: customSkipMessage('dev', 'dev-step1-literal'),
      });
      literal = { passed: true, issues: [] };
    } else {
      literal = runDevLiteralCheck(opts.devFile, { mode: opts.mode, tier });
      if (!literal.passed) {
        for (const issue of literal.issues) {
          reporter.add({ severity: 'error', rule: issue.rule, file: opts.devFile, message: issue.message });
        }
      } else {
        reporter.add({
          severity: 'info',
          rule: 'DEV-LIT-OK',
          file: opts.devFile,
          message: '字面量校验已命中，可勾 ①。',
        });
      }
    }

    validateDispatchLedger(projectRoot, reporter, {
      gateId: 'dev-step1-literal',
      devFile: opts.devFile,
    });
    validateAfCommands(projectRoot, reporter, { gateId: 'dev-step1-literal' });
    return {
      passed: reporter.passed(),
      gateId: resolved,
      gate,
      reporter,
      literal,
    };
  }

  const { passed, reporter } = validateAtlas({
    projectRoot,
    phase: gate.phase,
    brownfield: opts.brownfield ?? 'auto',
    only: gate.modules,
    mode: opts.mode,
    tier: opts.tier,
    incremental: opts.incremental,
    verbose: opts.verbose,
    docFirstScope: gate.docFirstScope ?? 'integrity',
    dispatchGate: resolved,
    devFile: opts.devFile,
  });

  return { passed, gateId: resolved, gate, reporter };
}

/**
 * 格式化 AI 须执行的命令（自动探测 skill 路径，勿写死 .cursor/skills/…）
 * @param {string} gateId
 * @param {{ projectRoot?: string, devFile?: string }} [ctx]
 */
export function formatGateCommand(gateId, ctx = {}) {
  const resolved = resolveGateId(gateId);
  getGate(gateId);
  return formatPortableGateCommand(resolved, ctx);
}
