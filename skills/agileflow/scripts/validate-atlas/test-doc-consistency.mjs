#!/usr/bin/env node
/**
 * 文档交叉一致性（防文案互相打架）
 * C 档纪律（AskQuestion 是否真停）脚本测不了；本文件只锁「关联文档说法一致」。
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

// —— 禁止旧冲突文案 / 断锚 ——
const stale = [
  ['SKILL.md', '建模建议跳过却不问人'],
  ['templates/askquestion-gate.md', '阶段性确认卡阶段-4-内--mvp--f-xxx-切片强制'],
  ['templates/askquestion-gate.md', '仍须发本卡（可用审阅式措辞），**禁止**静默连做下一 MVP'],
  ['phases/00-intent-routing.md', 'todowrite-强制展开防漏'],
  ['phases/04-development.md', 'todowrite-强制展开防漏'],
  ['phases/task-tracking.md', 'todowrite-强制展开防漏'],
  ['phases/00-intent-routing.md', '阶段性确认卡阶段-4-内--mvp--f-xxx-切片强制'],
];

for (const [rel, needle] of stale) {
  mustNotInclude(rel, needle);
}

// —— AI 停点：关联处同向 ——
mustInclude('SKILL.md', '每阶段最多 1 张审阅');
mustInclude('SKILL.md', 'F/MVP 切片对 `ai` **默认不停问**', 'ai 默认不停问 F/MVP');
mustInclude('templates/askquestion-gate.md', 'F/MVP 阶段性确认（默认）');
mustInclude('templates/askquestion-gate.md', '默认**不发**本卡');
mustInclude('templates/stage-delegation.md', 'F/MVP 阶段性确认（默认跳过）');
mustInclude('phases/04-development.md', 'AF_DECIDE=ai`**：默认继续下一 F');
mustInclude('templates/dev-quickstart.md', '`ai`：默认继续');
mustInclude('templates/flow-modes.md', 'AI自主 + 连续做');

// —— 建模跳过：user / ai 分叉 ——
mustInclude('SKILL.md', '`AF_DECIDE=ai`：自行落盘建模判定');
mustInclude('SKILL.md', '快路径');
mustInclude('phases/02-modeling.md', '建模跳过快路径：同条进 sol');
mustInclude('templates/todo.md', '## TodoWrite 强制展开');

// —— fast+ai 审阅降频 ——
mustInclude('templates/stage-delegation.md', 'fast+ai` 免发卡');
mustInclude('templates/flow-modes.md', '一行摘要+自动 skip_review');

// —— 小任务默认精简 ——
mustInclude('phases/04-development.md', '小任务默认');
mustInclude('phases/03-solution-design.md', '小任务默认精简');

// —— 阶段5 证据复用 ——
mustInclude('phases/05-testing.md', '证据来源：阶段4③复用');
mustInclude('templates/ac-guide.md', '默认不复跑');

// —— init：ai 走审阅 ——
mustInclude('phases/00-project-init.md', 'AF_DECIDE=ai` 已确认');
mustInclude('phases/00-project-init.md', '禁止**再发 init 确认卡');

// —— flow-modes 不再自称 AskQuestion 全局权威 ——
mustNotInclude('templates/flow-modes.md', 'AskQuestion 次数、dev 段数、建模粒度均以本文件为准');

// —— template 双模式 ——
mustInclude('SKILL.md', 'AF_TEMPLATE', 'AF_TEMPLATE 双模式');
mustInclude('SKILL.md', 'atlas/template/', 'atlas/template 路径');
mustInclude('SKILL.md', '双模式', '双模式 SSOT');

if (failed) {
  console.error(`\n${failed} consistency check(s) failed`);
  process.exit(1);
}
console.log('\nall doc-consistency checks passed');
