/**
 * @deprecated 已废弃。全端叙述五段式见 `dev/narrative-flow.mjs`。
 * 本文件保留为空壳，防止旧 import 炸掉；**禁止再接入任何校验入口**。
 */

export const StepIssueType = {
  DEPRECATED: 'deprecated',
};

/**
 * @deprecated
 * @returns {Array<{ type: string, message: string }>}
 */
export function validateDevStepsCore() {
  return [
    {
      type: StepIssueType.DEPRECATED,
      message: '「## 步骤」/4 列流程表/原子表已废弃；须用 ## 主流程 + ## 边界 + ## 实现说明。',
    },
  ];
}
