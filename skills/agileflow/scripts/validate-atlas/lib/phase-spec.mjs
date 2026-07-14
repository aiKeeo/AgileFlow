/**
 * Agileflow 各阶段目录/文件规范（单一来源）
 */

/** @typedef {'0'|'1'|'2'|'3'|'4'|'5'|'all'} PhaseId */

export const PHASE_DIRS = {
  '0': {
    id: 'init',
    dirs: [
      { path: 'init', required: true, brownfieldOnly: true },
      { path: 'init/codebase', required: false, brownfieldOnly: true },
      { path: 'init/data', required: false, brownfieldOnly: true },
    ],
    files: [
      { path: 'init/README.md', required: true },
      { path: 'init/p0-business.md', required: true },
    ],
  },
  '1': {
    id: 'req',
    dirs: [{ path: 'requirements', required: true }],
    files: [{ path: 'requirements/README.md', required: true }],
  },
  '2': {
    id: 'mod',
    dirs: [{ path: 'model', required: true }],
    files: [{ path: 'model/README.md', required: true }],
  },
  '3': {
    id: 'sol',
    dirs: [
      { path: 'solution', required: true },
      { path: 'solution/features', required: true },
      { path: 'solution/contracts', required: false },
    ],
    files: [
      { path: 'solution/README.md', required: true },
      { path: 'solution/architecture.md', required: true },
      { path: 'todo.md', required: true },
    ],
  },
  '4': {
    id: 'dev',
    dirs: [{ path: 'dev', required: true }],
    files: [{ path: 'todo.md', required: true }],
  },
  '5': {
    id: 'test',
    dirs: [{ path: 'tests', required: true }],
    files: [{ path: 'tests/README.md', required: true }],
  },
};

/**
 * dev 必填段（语义标题，无一二三编号）
 * lite: 范围/做法/结果 · standard|full: +契约 +AC
 */
export const DEV_SECTIONS = [
  { id: 'scope', heading: '## 范围', tiers: ['lite', 'standard', 'full'] },
  { id: 'contract', heading: '## 契约', tiers: ['standard', 'full'] },
  { id: 'steps', heading: '## 做法', tiers: ['lite', 'standard', 'full'] },
  { id: 'ac', heading: '## AC', tiers: ['standard', 'full'] },
  { id: 'result', heading: '## 结果', tiers: ['lite', 'standard', 'full'] },
];

/** @deprecated 兼容旧名 */
export const DEV_NINE_SECTIONS = DEV_SECTIONS;

export const RISK_TIERS = {
  lite: {
    label: '精简档',
    sections: ['scope', 'steps', 'result'],
    literalCheck: false,
    fakeHeadingCheck: false,
    minDocLength: 280,
  },
  standard: {
    label: '标准档',
    sections: ['scope', 'contract', 'steps', 'ac', 'result'],
    literalCheck: false,
    fakeHeadingCheck: false,
    minDocLength: 450,
  },
  full: {
    label: '完整档',
    sections: ['scope', 'contract', 'steps', 'ac', 'result'],
    literalCheck: true,
    fakeHeadingCheck: true,
    minDocLength: 700,
  },
};

export const PENDING_MARKERS = ['待补齐', 'TODO：', '（待补齐）', '→ 见', '→ ['];

export const AI_GATES = {
  'init-confirm': {
    phase: '0',
    modules: ['dir', 'init'],
    when: 'init 落盘完成 · AskQuestion 确认前',
    blocking: true,
  },
  'req-confirm': {
    phase: '1',
    modules: ['dir', 'req'],
    when: 'REQ 落盘 · 需求确认卡前',
    blocking: true,
  },
  'mod-confirm': {
    phase: '2',
    modules: ['dir', 'model'],
    when: 'model 落盘 · 建模确认前',
    blocking: true,
  },
  'sol-confirm': {
    phase: '3',
    modules: ['dir', 'sol', 'todo', 'req-confirmed'],
    when: '方案+todo 落盘 · 方案确认/阶段闸门前',
    blocking: true,
    extra: 'A档：architecture 必存在；至少 1 份 REQ 状态=已确认/已实现',
  },
  'dev-step1-literal': {
    phase: '4',
    modules: ['dev-step1-literal'],
    when: '单个 T 的 dev ① 落盘 · 勾 todo ① 前',
    blocking: true,
    extra: '按档位：精简=范围/做法/结果；标准·完整=+契约+AC；完整另字面量严检',
  },
  'dev-complete': {
    phase: '4',
    modules: ['dir', 'todo', 'dev', 'runnable', 'pixel'],
    when: '全部 T ③ 完成 · 标「开发实现 ✅」前',
    blocking: true,
    extra: '## 结果 须含可运行证据；强制原型须 fe-pixel PASS',
  },
  'test-entry': {
    phase: '5',
    modules: ['dir', 'tests', 'todo', 'runnable', 'smoke', 'pixel'],
    when: '进入阶段 5 · 测试入场门禁前',
    blocking: true,
    extra: '同会话增量 / 跨会话全量；强制原型须 fe-pixel PASS',
  },
};
