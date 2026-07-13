/**
 * Agileflow 各阶段目录/文件规范（单一来源，供 directory + workflow 共用）
 */

/** @typedef {'0'|'1'|'2'|'3'|'4'|'5'|'all'} PhaseId */

/**
 * 阶段目录规范
 * @type {Record<string, { id: string, dirs: { path: string, required: boolean, brownfieldOnly?: boolean }[], files: { path: string, required: boolean }[] }>}
 */
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
      { path: 'requirements/README.md', required: true },
    ],
  },
  '2': {
    id: 'mod',
    dirs: [{ path: 'model', required: true }],
    files: [
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
 * dev 九段标题（快速/严谨均须存在）
 */
export const DEV_NINE_SECTIONS = [
  { num: '一', title: '需求理解', key: 'sec1', compressible: false },
  { num: '二', title: '数据模型', key: 'sec2', compressible: true },
  { num: '三', title: null, key: 'sec3', compressible: false, altTitles: ['接口契约', 'UI 布局与 API 字段映射'] },
  { num: '四', title: '状态机', key: 'sec4', compressible: true },
  { num: '五', title: '核心流程', key: 'sec5', compressible: false },
  { num: '六', title: '异常与边界', key: 'sec6', compressible: true },
  { num: '七', title: '技术选型与依赖', key: 'sec7', compressible: true },
  { num: '八', title: 'REQ 验收对照', key: 'sec8', compressible: false },
  { num: '九', title: '实现结果', key: 'sec9', compressible: false, emptyBodyOkAtStep1: true },
];

/** 待补齐标记（快速模式可压缩段） */
export const PENDING_MARKERS = ['待补齐', 'TODO：', '（待补齐）', '→ 见', '→ ['];

/**
 * AI 流程闸门：落盘后 / AskQuestion 前 / 勾①前 必须跑的校验
 * @type {Record<string, { phase: PhaseId, modules: string[], when: string, blocking: boolean, extra?: string }>}
 */
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
    when: '单个 T 的 dev ① 落盘 · 勾 todo ① / TodoWrite ① completed 前',
    blocking: true,
    extra: '须对具体文件：--dev-file atlas/dev/T-xxx-*.md（① 时九可空；③ 前须 runnable）',
  },
  'dev-complete': {
    phase: '4',
    modules: ['dir', 'todo', 'dev', 'runnable', 'pixel'],
    when: '全部 T ③ 完成 · 标「开发实现 ✅」前',
    blocking: true,
    extra: 'A档：九段可运行；强制原型须 fe-pixel report PASS',
  },
  'test-entry': {
    phase: '5',
    modules: ['dir', 'tests', 'todo', 'runnable', 'smoke', 'pixel'],
    when: '进入阶段 5 · 测试入场门禁前（须 dev-complete 已过）',
    blocking: true,
    extra: 'A档：smoke logs；强制原型须 fe-pixel report PASS',
  },
};
