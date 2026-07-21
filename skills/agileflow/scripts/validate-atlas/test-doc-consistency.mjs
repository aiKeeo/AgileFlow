#!/usr/bin/env node
/**
 * 文档交叉一致性（防文案互相打架 / 防旧文件回潮）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');

let failed = 0;

function read(rel) {
  return fs.readFileSync(path.join(skillRoot, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(skillRoot, rel));
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL  ${msg}`);
    failed += 1;
  } else {
    console.log(`ok    ${msg}`);
  }
}

function mustInclude(rel, needle, label = needle) {
  assert(read(rel).includes(needle), `${rel} 须含「${label}」`);
}

function mustNotInclude(rel, needle, label = needle) {
  assert(!read(rel).includes(needle), `${rel} 禁止残留「${label}」`);
}

function mustExist(rel) {
  assert(exists(rel), `须存在 ${rel}`);
}

function mustNotExist(rel) {
  assert(!exists(rel), `须已删除 ${rel}`);
}

// —— 新 SSOT 必须存在 ——
mustExist('templates/contract.md');
mustExist('templates/dev.md');
mustExist('templates/solution.md');
mustExist('templates/init.md');
mustExist('templates/req.md');
mustExist('templates/uid.md');
mustExist('templates/model.md');

// —— KILL 清单不得回潮 ——
const killed = [
  'templates/stage-delegation.md',
  'templates/flow-modes.md',
  'templates/askquestion-gate.md',
  'templates/requirement-askquestion.md',
  'templates/subagent-contracts.md',
  'templates/visual-markers.md',
  'templates/dev-quickstart.md',
  'templates/dev-rationale.md',
  'templates/solution-core.md',
  'templates/solution-architecture.md',
  'phases/parallel-orchestration.md',
  'phases/task-tracking.md',
  'examples/fast-means-parallel.md',
];
for (const rel of killed) mustNotExist(rel);

// —— 首启默认问人 ——
mustInclude('SKILL.md', '**禁止**静默写 ai');
mustInclude('templates/contract.md', '契约未确认静默写');
mustInclude('templates/contract.md', '默认问人');
mustInclude('phases/01-requirement.md', '默认问人');
mustNotInclude('SKILL.md', 'AF_FLOW');
mustNotInclude('templates/contract.md', 'AF_FLOW');
mustNotInclude('templates/contract.md', '默认不问启动');
mustNotInclude('templates/contract.md', '默认不问：');

// —— 话术上下文（消双义）——
mustInclude('templates/contract.md', '后面都你定');
mustInclude('SKILL.md', '中途 AI 接管');

// —— ai 连做 / user 闸门 ——
mustInclude('SKILL.md', '同会话连做');
mustInclude('templates/contract.md', '同会话连做');
mustInclude('templates/orchestrator.md', '自治循环');
mustInclude('templates/orchestrator.md', '阻塞式');
mustInclude('SKILL.md', '派完一批等人「继续」');
mustInclude('templates/contract.md', 'AF_DECIDE');
mustInclude('templates/orchestrator.md', 'AF_DECIDE');

// —— AC 收口 ——
mustInclude('templates/orchestrator.md', 'REQ AC 回填');
mustInclude('scripts/validate-atlas/lib/phase-spec.mjs', 'req-ac-backfill');

// —— 并行在 04 ——
mustInclude('phases/04-development.md', '## 并行阶段-4');
mustInclude('phases/04-development.md', '自动并行');
mustInclude('phases/04-development.md', '必扫描');

// —— 多 Agent ——
mustInclude('SKILL.md', '多 Agent');
mustInclude('SKILL.md', 'WorkBuddy');
mustInclude('templates/orchestrator.md', '宿主义务');
mustInclude('templates/orchestrator.md', '用户话术');
mustInclude('templates/orchestrator.md', 'subagentId');
mustInclude('templates/orchestrator.md', '只开 2 个 subagent');
mustInclude('templates/orchestrator.md', 'AF_DECIDE');
mustInclude('SKILL.md', '只开写码 subagent');

// —— 路径铁律 ——
mustInclude('SKILL.md', '路径铁律');
mustInclude('SKILL.md', 'requirements/');
mustInclude('phases/00-intent-routing.md', '路径铁律');
mustInclude('templates/orchestrator.md', '落盘路径自检');

// —— 角色 ——
mustInclude('templates/role/README.md', 'atlas/role');
mustInclude('templates/role/README.md', 'baseline');
mustInclude('templates/validate-atlas-gate.md', 'ROLE-CUSTOM');
mustInclude('templates/role/role-dev.md', '一次派活');
mustInclude('templates/orchestrator.md', '一次派活');
mustInclude('SKILL.md', 'atlas/role/');
mustInclude('SKILL.md', 'bootstrap-scaffold');

// —— 派活台账路径（项目 atlas/，非 .cursor/）——
mustInclude('SKILL.md', 'atlas/agileflow-dispatch.json');
mustInclude('templates/orchestrator.md', 'atlas/agileflow-dispatch.json');
mustInclude('phases/00-intent-routing.md', 'agileflow-dispatch.json');
const dispatchDocFiles = [
  'SKILL.md',
  'templates/orchestrator.md',
  'templates/validate-atlas-gate.md',
  'TROUBLESHOOTING.md',
  'templates/role/README.md',
  'QUICKSTART.md',
];
for (const rel of dispatchDocFiles) {
  mustNotInclude(rel, '.cursor/agileflow-dispatch', '.cursor/agileflow-dispatch');
  mustNotInclude(rel, 'atlas/.agileflow-dispatch.json', 'atlas/.agileflow-dispatch.json');
}
mustInclude('templates/orchestrator.md', 'skill 目录', 'skill 目录说明');

// —— 闸门 ——
mustInclude('templates/validate-atlas-gate.md', '硬挡');
mustInclude('templates/validate-atlas-gate.md', '--gate req-confirm');
mustInclude('scripts/validate-atlas/lib/reporter.mjs', 'error 与 warn 均使校验失败');

// —— 质量 / 测试 ——
mustInclude('phases/04-development.md', '## 质量要求');
mustInclude('phases/05-testing.md', '证据来源：阶段4③复用');
mustInclude('phases/01-requirement.md', '摘要后连做');

// —— 加载指向 contract ——
mustInclude('SKILL.md', 'templates/contract.md');
mustInclude('SKILL.md', 'templates/dev.md');

// —— 禁止旧路径字符串残留在关键文件 ——
mustNotInclude('SKILL.md', 'stage-delegation.md');
mustNotInclude('SKILL.md', 'flow-modes.md');
mustNotInclude('SKILL.md', 'askquestion-gate.md');
mustNotInclude('SKILL.md', 'dev-quickstart.md');
mustNotInclude('SKILL.md', 'parallel-orchestration.md');
mustNotInclude('SKILL.md', 'subagent-contracts.md');
mustNotInclude('phases/01-requirement.md', 'stage-delegation.md');
mustNotInclude('phases/04-development.md', 'parallel-orchestration.md');

// —— 版本号与 package.json 一致 ——
const skillVersion = read('SKILL.md').match(/^version:\s*([^\n]+)/m)?.[1]?.trim();
const pkgVersion = JSON.parse(read('package.json')).version;
assert(skillVersion === pkgVersion, `SKILL.md version (${skillVersion}) 须与 package.json (${pkgVersion}) 一致`);

// —— 禁止旧「模式」/ AF_FLOW 残留 ——
const noModeBanFiles = [
  'templates/todo.md',
  'examples/dev-glance-login/atlas/todo.md',
  'examples/dev-glance-login/atlas/README.md',
];
for (const rel of noModeBanFiles) {
  mustNotInclude(rel, '模式：快速');
  mustNotInclude(rel, '模式：严谨');
  mustNotInclude(rel, 'AF_FLOW');
}

const fixturesTodoRoot = path.join(skillRoot, 'scripts/validate-atlas/fixtures');
for (const name of fs.readdirSync(fixturesTodoRoot)) {
  const todoRel = path.join('scripts/validate-atlas/fixtures', name, 'atlas/todo.md');
  const abs = path.join(skillRoot, todoRel);
  if (!fs.existsSync(abs)) continue;
  mustNotInclude(todoRel, '模式：快速');
  mustNotInclude(todoRel, '模式：严谨');
  mustNotInclude(todoRel, 'AF_FLOW');
}

mustInclude('templates/validate-atlas-gate.md', 'dev-complete');
mustInclude('templates/validate-atlas-gate.md', '台账溯源审计');
mustInclude('scripts/validate-atlas/lib/phase-spec.mjs', "'dispatch-ledger'");
mustNotInclude('scripts/validate-atlas/lib/phase-spec.mjs', 'ai/fast');

// —— 脚本仍在 ——
mustInclude('scripts/validate-atlas/lib/af-env.mjs', "AF_TIER: new Set(['full'])");
mustInclude('scripts/validate-atlas/lib/rules/directory.mjs', 'DIR-TODO-PATH');

if (failed) {
  console.error(`\n${failed} consistency check(s) failed`);
  process.exit(1);
}
console.log('\nall doc-consistency checks passed');
