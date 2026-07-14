import path from 'node:path';
import { validateAtlas, runDevLiteralCheck, resolveRiskTier } from '../index.mjs';
import { AI_GATES } from './phase-spec.mjs';
import { Reporter } from './reporter.mjs';
import { readText } from './fs-utils.mjs';
import { formatPortableGateCommand } from './skill-path.mjs';

/** 旧闸门 ID → 新 ID（兼容） */
const GATE_ALIASES = {
  'dev-a7': 'dev-step1-literal',
};

/**
 * 列出所有 AI 流程闸门
 */
export function listGates() {
  return { ...AI_GATES };
}

/**
 * 解析闸门 ID（含旧名兼容）
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
 * @param {{ projectRoot?: string, brownfield?: boolean | 'auto', devFile?: string, mode?: 'fast'|'strict'|'auto', verbose?: boolean }} [opts]
 */
export function runGate(gateId, opts = {}) {
  const resolved = resolveGateId(gateId);
  const gate = getGate(gateId);
  const projectRoot = opts.projectRoot ?? process.cwd();

  if (resolved === 'dev-step1-literal') {
    if (!opts.devFile) {
      throw new Error('dev-step1-literal 闸门须指定 devFile（atlas/dev/T-xxx-*.md）');
    }
    const projectRoot = opts.projectRoot ?? process.cwd();
    const todoContent = readText(path.join(projectRoot, 'atlas', 'todo.md')) || '';
    const tier = opts.tier ?? resolveRiskTier(todoContent);
    const literal = runDevLiteralCheck(opts.devFile, { mode: opts.mode, tier });
    const reporter = new Reporter();
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
    return { passed: literal.passed, gateId: resolved, gate, reporter, literal };
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
