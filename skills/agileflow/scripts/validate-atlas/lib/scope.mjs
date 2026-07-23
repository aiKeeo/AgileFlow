/**
 * flow 管辖边界：stepId / AF_STEP 须在 flow.yaml steps 内
 */
import { loadFlow, listFlowSteps, resolvePrefixToStepId, normalizeStepId } from './flow.mjs';
import { loadAfEnv } from './af-env.mjs';
import { loadDispatchLedger } from './rules/dispatch-ledger.mjs';

/** 门牌 alias → flow step id（catalog aliasOf；须在 normalizeStepId 之后） */
const STEP_ALIASES = {
  'af-tests': 'af-test',
  'af-model': 'af-mod',
};

/**
 * alias 门牌 → canonical flow step id
 * @param {string} stepId
 * @returns {string}
 */
export function normalizeStepIdForFlow(stepId) {
  const raw = String(stepId || '').trim();
  if (!raw) return raw;
  const legacy = normalizeStepId(raw);
  const lower = legacy.toLowerCase();
  return STEP_ALIASES[lower] || STEP_ALIASES[legacy] || legacy;
}

/**
 * flow 中所有 step id（规范化小写集合 + 原 id 列表）
 * @param {object} flow
 */
export function listFlowStepIds(flow) {
  return listFlowSteps(flow).map((s) => String(s.id));
}

/**
 * stepId 是否在 flow steps 中
 * @param {object} flow
 * @param {string} stepId
 */
export function isStepInFlow(flow, stepId) {
  const norm = normalizeStepIdForFlow(stepId);
  return listFlowStepIds(flow).some((id) => id === norm || String(id).toLowerCase() === norm.toLowerCase());
}

/**
 * 校验 dispatch 台账 stepId 与 AF_STEP
 * @param {string} projectRoot
 * @returns {import('./reporter.mjs').ValidationIssue[]}
 */
export function validateFlowScope(projectRoot) {
  /** @type {import('./reporter.mjs').ValidationIssue[]} */
  const issues = [];
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) return issues;

  const flowIds = listFlowStepIds(loaded.flow);
  if (flowIds.length === 0) return issues;

  const ledger = loadDispatchLedger(projectRoot);
  if (ledger.ok && Array.isArray(ledger.ledger.entries)) {
    for (const ent of ledger.ledger.entries) {
      const sid = ent?.stepId;
      if (!sid) continue;
      const norm = normalizeStepIdForFlow(sid);
      if (!isStepInFlow(loaded.flow, norm)) {
        issues.push({
          level: 'error',
          rule: 'ORCH-STEP-NOT-IN-FLOW',
          message: `派活台账 stepId=${JSON.stringify(sid)} 不在 atlas/flow.yaml steps 中（合法 id：${flowIds.join(', ')}）`,
          file: 'atlas/agileflow-dispatch.json',
          fix: 'stepId 须为 flow.yaml 中某步 id；alias 门牌 /af-tests 应记 af-test',
        });
      }
    }
  }

  const env = loadAfEnv(projectRoot);
  if (env.ok && env.state.step) {
    const parts = String(env.state.step)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const part of parts) {
      const norm = normalizeStepIdForFlow(part);
      if (!isStepInFlow(loaded.flow, norm)) {
        issues.push({
          level: 'error',
          rule: 'AF-ENV-STEP-DRIFT',
          message: `AF_STEP 含 ${JSON.stringify(part)}，不在 flow.yaml steps 中`,
          file: 'atlas/agileflow.env',
          fix: 'AF_STEP 只能为 flow.yaml steps 内的 id；init/快捷/探索不得写入 AF_STEP',
        });
      }
    }
  }

  return issues;
}

/**
 * 解析门牌前缀是否在 flow 中
 * @param {string} projectRoot
 * @param {string} prefix
 */
export function resolveFlowStepFromPrefix(projectRoot, prefix) {
  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) return null;
  return resolvePrefixToStepId(loaded.flow, prefix);
}
