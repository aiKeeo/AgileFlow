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

    files: [

      { path: 'README.md', required: true },

      { path: 'requirements/README.md', required: true },

    ],

  },

  '2': {

    id: 'mod',

    dirs: [{ path: 'model', required: true }],

    files: [

      { path: 'README.md', required: true },

      { path: 'model/README.md', required: true },

    ],

  },

  '3': {

    id: 'sol',

    dirs: [

      { path: 'solution', required: true },

      { path: 'solution/features', required: true },

      { path: 'solution/contracts', required: false },

    ],

    files: [

      { path: 'README.md', required: true },

      { path: 'solution/README.md', required: true },

      { path: 'solution/architecture.md', required: true },

      { path: 'todo.md', required: true },

    ],

  },

  '4': {

    id: 'dev',

    dirs: [{ path: 'dev', required: true }],

    files: [

      { path: 'README.md', required: true },

      { path: 'todo.md', required: true },

    ],

  },

  '5': {

    id: 'test',

    dirs: [{ path: 'tests', required: true }],

    files: [

      { path: 'README.md', required: true },

      { path: 'tests/README.md', required: true },

    ],

  },

};



/**

 * dev 必填段（v9.11 极简 SSOT：摘要 + 步骤 + 结果）

 */

export const DEV_SECTIONS = [

  { id: 'summary', heading: '## 摘要', tiers: ['lite', 'standard', 'full'] },

  { id: 'steps', heading: '## 步骤', tiers: ['lite', 'standard', 'full'] },

  { id: 'result', heading: '## 结果', tiers: ['lite', 'standard', 'full'] },

];



/** 各档最少 #### 步骤数 */

export const DEV_MIN_STEPS = {

  lite: 1,

  standard: 2,

  full: 3,

};



/** @deprecated 兼容旧引用 */

export const DEV_MIN_PURPOSE_STEPS = DEV_MIN_STEPS;



export const RISK_TIERS = {

  lite: {

    label: '精简档',

    sections: ['summary', 'steps', 'result'],

    literalCheck: false,

    fakeHeadingCheck: false,

    minDocLength: 200,

    requireSummary: true,

    requireStructuredSummary: false,

  },

  standard: {

    label: '标准档',

    sections: ['summary', 'steps', 'result'],

    literalCheck: false,

    fakeHeadingCheck: false,

    minDocLength: 350,

    requireSummary: true,

    requireStructuredSummary: true,

  },

  full: {

    label: '完整档',

    sections: ['summary', 'steps', 'result'],

    literalCheck: true,

    fakeHeadingCheck: true,

    minDocLength: 500,

    requireSummary: true,

    requireStructuredSummary: true,

    requireFlowTable: true,

  },

};



export const AI_GATES = {

  'init-confirm': {

    phase: '0',

    modules: ['af-env', 'dir', 'init', 'anti-skip'],

    when: 'init 落盘完成 · AskQuestion 确认前',

    blocking: true,

    extra: '须维护 atlas/agileflow.env（AF_PHASE=0）',

  },

  'req-confirm': {

    phase: '1',

    modules: ['af-env', 'dir', 'req', 'anti-skip'],

    when: 'REQ 落盘 · 需求确认卡前',

    blocking: true,

    extra: '须 AF_PHASE=1；与产物推断一致',

  },

  'mod-confirm': {

    phase: '2',

    modules: ['af-env', 'dir', 'model', 'anti-skip'],

    when: 'model 落盘 · 建模确认前',

    blocking: true,

  },

  'sol-confirm': {

    phase: '3',

    modules: ['af-env', 'dir', 'sol', 'todo', 'req-confirmed', 'anti-skip'],

    when: '方案+todo 落盘 · 方案确认/阶段闸门前',

    blocking: true,

    extra:

      'A档：agileflow.env + architecture + REQ已确认 + F边界/暴露面；UI链API须字段绑定；AF_DECIDE=user 须栈来源已问；=ai 须 AI决策记录',

  },

  'dev-step1-literal': {

    phase: '4',

    modules: ['dev-step1-literal'],

    when: '单个 T 的 dev ① 落盘 · 勾 todo ① 前',

    blocking: true,

    extra:

      '按档位：摘要/步骤/结果；标准+摘要五 bullet；步骤优先流程表 S1…（注意点含落点）或 ####+涉及改动/改；legacy 可用 用户/系统/改；完整须流程表+字面量严检；ai 不减完整档流程拆解',

  },

  'dev-complete': {

    phase: '4',

    modules: ['af-env', 'dir', 'todo', 'dev', 'runnable', 'pixel', 'anti-skip'],

    when: '全部 T ③ 完成 · 标「开发实现 ✅」前',

    blocking: true,

    extra:
      'AF_PHASE=4；dev 文件数=T 头数；勾①②③须有文件/可运行证据（TODO-CHECK-*）；## 结果可运行；强制原型须 fe-pixel PASS',

  },

  'test-entry': {

    phase: '5',

    modules: ['af-env', 'dir', 'tests', 'todo', 'runnable', 'smoke', 'pixel', 'anti-skip'],

    when: '进入阶段 5 · 测试入场门禁前',

    blocking: true,

    extra: 'AF_PHASE=5；同会话增量 / 跨会话全量；强制原型须 fe-pixel PASS',

  },

  'anti-skip': {
    phase: 'all',
    modules: ['af-env', 'anti-skip'],
    when: '写业务源码前 / 任意声称进度前 · 源码与 atlas 对齐',
    blocking: true,
    extra: '有业务源码须 architecture+features+等量 T-*.md；禁 README 冒充 T；假进度硬挡',
  },
  'req-trace': {

    phase: '5',

    modules: ['trace'],

    when: '阶段 5 · 验收归档前 · 检查需求追溯链完整性',

    blocking: false,

    extra: 'REQ→F→T→AC→验收报告 链路检查；warn 不阻塞但须确认',

  },

};


