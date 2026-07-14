#!/usr/bin/env node
/**
 * agileflow.env / af-env 单元回归（对抗用例）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Reporter } from './lib/reporter.mjs';
import {
  parseEnvText,
  loadAfEnv,
  validateAfEnv,
  inferPhaseFromArtifacts,
  shouldCheckDevCount,
  isUserStackSettled,
} from './lib/af-env.mjs';
import { validateTodo } from './lib/rules/todo.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(__dirname, 'fixtures');

let passed = 0;
let failed = 0;

/**
 * @param {string} name
 * @param {boolean} cond
 * @param {string} [detail]
 */
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

/**
 * 写临时 atlas 工程
 * @param {Record<string, string>} files rel→content
 */
function writeProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-env-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
  }
  return root;
}

/**
 * @param {string} root
 * @param {object} [opts]
 */
function runAf(root, opts = {}) {
  const reporter = new Reporter();
  const state = validateAfEnv(root, reporter, { requireEnv: true, brownfield: false, ...opts });
  return { state, reporter, errors: reporter.getIssues().filter((i) => i.severity === 'error') };
}

/**
 * @param {import('./lib/reporter.mjs').ValidationIssue[]} errors
 * @param {string} rule
 */
function hasRule(errors, rule) {
  return errors.some((e) => e.rule === rule);
}

// —— parseEnvText ——
check('parse 忽略注释与空行', parseEnvText('# x\n\nAF_PHASE=3\n').AF_PHASE === '3');
check('parse 去引号', parseEnvText('AF_FLOW="fast"\n').AF_FLOW === 'fast');
check('parse 非法行跳过', Object.keys(parseEnvText('=no\nbad\nOK=1\n')).join() === 'OK');

// —— 首启 pending 必挡 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_FLOW=pending\nAF_DECIDE=pending\nAF_TIER=standard\nAF_STACK_SOURCE=pending\n',
    'atlas/todo.md': '# t\n',
  });
  try {
    const { errors } = runAf(root);
    check('pending → AF-ENV-BOOT', hasRule(errors, 'AF-ENV-BOOT'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— 枚举 / 缺失 ——
{
  const root = writeProject({
    'atlas/agileflow.env': 'AF_PHASE=9\nAF_FLOW=fast\nAF_DECIDE=ai\nAF_TIER=standard\nAF_STACK_SOURCE=pending\n',
  });
  try {
    const loaded = loadAfEnv(root);
    check('非法 AF_PHASE 加载失败', !loaded.ok && !loaded.missing);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = writeProject({ 'atlas/todo.md': '# t\n' });
  try {
    const { errors } = runAf(root);
    check('缺 env → AF-ENV-000', hasRule(errors, 'AF-ENV-000'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— 阶段推断 ——
{
  const root = writeProject({
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n',
  });
  try {
    check('REQ已确认+sol草稿 → infer 3', inferPhaseFromArtifacts(root, false) === '3');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const root = writeProject({
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：已确认\n',
    'atlas/todo.md': `## 开发任务
### T-001：[BE] x — F-001 [标准]
- [ ] **① 构思落盘** → \`atlas/dev/T-001.md\`
- [ ] **② 按 ## 做法 写码**
- [ ] **③ 对照 REQ 验收 AC**
`,
  });
  try {
    check('sol已确认+开放T → infer 4', inferPhaseFromArtifacts(root, false) === '4');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— PHASE 不一致 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=1\nAF_FLOW=fast\nAF_DECIDE=ai\nAF_TIER=standard\nAF_STACK_SOURCE=pending\n',
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n',
    'atlas/solution/architecture.md': '## 技术栈\n| 层 | x |\n',
  });
  try {
    const { errors } = runAf(root);
    check('AF_PHASE 落后 → AF-ENV-PHASE', hasRule(errors, 'AF-ENV-PHASE'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— user pending ——
{
  const { errors } = runAf(path.join(fixtures, 'bad-sol-user-pending'), { gatePhase: '3' });
  check('fixture user+pending → AF-STACK-USER', hasRule(errors, 'AF-STACK-USER'));
}

// —— user 禁止 ai_record 冒充 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=3\nAF_FLOW=fast\nAF_DECIDE=user\nAF_TIER=standard\nAF_STACK_SOURCE=ai_record\n',
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n\n## AI 决策记录\n| a | b |\n',
    'atlas/solution/architecture.md': '## 技术栈\n| FE | x |\n',
  });
  try {
    const { errors } = runAf(root, { gatePhase: '3' });
    check('user+ai_record → AF-STACK-USER', hasRule(errors, 'AF-STACK-USER'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— ai 无决策记录 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=3\nAF_FLOW=fast\nAF_DECIDE=ai\nAF_TIER=standard\nAF_STACK_SOURCE=ai_record\n',
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n',
    'atlas/solution/architecture.md': '## 技术栈\n| FE | x |\n',
  });
  try {
    const { errors } = runAf(root, { gatePhase: '3' });
    check('ai 无 AI决策记录 → AF-STACK-AI', hasRule(errors, 'AF-STACK-AI'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— 仅正文含「技术栈」三字不够 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=3\nAF_FLOW=fast\nAF_DECIDE=ai\nAF_TIER=standard\nAF_STACK_SOURCE=ai_record\n',
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n\n## AI 决策记录\n| 技术栈 | Nest | 依据 |\n',
    'atlas/solution/architecture.md': '# 架构\n本文提到技术栈但无正式节\n',
  });
  try {
    const { errors } = runAf(root, { gatePhase: '3' });
    check('无 ## 技术栈 节 → AF-STACK-ARCH', hasRule(errors, 'AF-STACK-ARCH'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— good-sol-confirm 应干净 ——
{
  const { errors } = runAf(path.join(fixtures, 'good-sol-confirm'), { gatePhase: '3' });
  check('good-sol-confirm af-env 无 error', errors.length === 0, errors.map((e) => e.rule).join(','));
}

// —— dev-complete 闸门要求 AF_PHASE=4 ——
{
  const root = writeProject({
    'atlas/agileflow.env':
      'AF_PHASE=3\nAF_FLOW=fast\nAF_DECIDE=ai\nAF_TIER=standard\nAF_STACK_SOURCE=ai_record\n',
    'atlas/requirements/REQ-001-a.md': '# [REQ-001]\n- 状态：已确认\n',
    'atlas/solution/README.md': '# sol\n- 状态：草稿\n\n## AI 决策记录\n| 技术栈 | x | y |\n',
    'atlas/solution/architecture.md': '## 技术栈\n| FE | x |\n',
  });
  try {
    const { errors } = runAf(root, { gatePhase: '4' });
    check('gate=4 但 AF_PHASE=3 → AF-ENV-GATE', hasRule(errors, 'AF-ENV-GATE'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

// —— todo：phase3 不查 dev 数；phase4 查 ——
{
  const todoBody = `# t
## 流程进度
## 开发任务
### ① 质量门槛（冻结）
### 机械 grep
| a | b |
### T-001：[BE] x — F-001 [标准]
- [ ] **① 构思落盘** → \`atlas/dev/T-001-x-BE.md\`
- [ ] **② 按 ## 做法 写码**
- [ ] **③ 对照 REQ 验收 AC**
`;
  const root = writeProject({ 'atlas/todo.md': todoBody });
  try {
    const r3 = new Reporter();
    validateTodo(root, r3, { tier: 'standard', phase: '3' });
    const e3 = r3.getIssues().filter((i) => i.rule === 'TODO-FORMAT-dev数不符');
    check('phase=3 不报 dev数不符', e3.length === 0);

    const r4 = new Reporter();
    validateTodo(root, r4, { tier: 'standard', phase: '4' });
    const e4 = r4.getIssues().filter((i) => i.rule === 'TODO-FORMAT-dev数不符');
    check('phase=4 报 dev数不符', e4.length === 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

check('shouldCheckDevCount(3)=false', shouldCheckDevCount('3') === false);
check('shouldCheckDevCount(4)=true', shouldCheckDevCount('4') === true);
check('isUserStackSettled(ai_record)=false', isUserStackSettled('ai_record') === false);
check('isUserStackSettled(askquestion)=true', isUserStackSettled('askquestion') === true);

console.log(`\naf-env: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
