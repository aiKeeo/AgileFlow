import { DEV_MIN_STEPS, RISK_TIERS } from '../phase-spec.mjs';
import { resolveDevSteps } from './dev/steps.mjs';

/**
 * BE dev「## 步骤」校验：仅接受 4 列流程表 S1…
 */

export const StepIssueType = {
  REQUIRE_FLOW_TABLE: 'requireFlowTable',
  BAN_ATOM: 'banAtom',
  BAN_HASH: 'banHash',
  BAN_FLOW_5COL: 'banFlow5Col',
  MIN_STEPS: 'minSteps',
  MALFORMED: 'malformed',
  FLOW_ANCHOR: 'flowAnchor',
};

/**
 * @param {string} stepsSection - ## 步骤 的 body
 * @returns {Array<{ type: string, message: string, stepId?: string, reason?: string }>}
 */
export function validateDevStepsCore(stepsSection) {
  const issues = [];
  const tierDef = RISK_TIERS.full;
  const minSteps = DEV_MIN_STEPS;
  const resolved = resolveDevSteps(stepsSection);

  if (resolved.mode === 'atom') {
    issues.push({
      type: StepIssueType.BAN_ATOM,
      message: '禁 8 字段原子步骤表（#### + 字段表）；BE 须用 4 列流程表 | 步骤 | 动作 | 输入→输出 | 注意点 |。',
    });
    return issues;
  }

  if (resolved.mode === 'hash') {
    issues.push({
      type: StepIssueType.BAN_HASH,
      message: '禁纯 #### + 改 薄写；BE 须用 4 列流程表 S1…。',
    });
    return issues;
  }

  if (resolved.mode !== 'flow') {
    issues.push({
      type: StepIssueType.REQUIRE_FLOW_TABLE,
      message: `${tierDef.label}须用 4 列流程表（S1… 注意点含落点）。`,
    });
    return issues;
  }

  if (resolved.count < minSteps) {
    issues.push({
      type: StepIssueType.MIN_STEPS,
      message: `${tierDef.label}须至少 ${minSteps} 步流程表（当前 ${resolved.count}）。`,
    });
  }

  for (const malformed of resolved.malformed ?? []) {
    issues.push({
      type: StepIssueType.MALFORMED,
      message: `流程表行列数不一致：${malformed.reason} 行：${malformed.row.slice(0, 80)}`,
      reason: malformed.reason,
    });
  }

  for (const step of resolved.flow) {
    if (step.format === 5) {
      issues.push({
        type: StepIssueType.BAN_FLOW_5COL,
        stepId: step.id,
        message: `${step.id}：禁 5 列流程表（含「目的」列）；只用 4 列 | 步骤 | 动作 | 输入→输出 | 注意点 |。`,
      });
    }
    if (!step.hasAnchor) {
      issues.push({
        type: StepIssueType.FLOW_ANCHOR,
        stepId: step.id,
        message: `${step.id} 注意点须含代码落点 \`Class.method\` / \`path/\`（新写/在…上加/照…/复用）。`,
      });
    }
  }

  return issues;
}
