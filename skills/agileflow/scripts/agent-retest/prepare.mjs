#!/usr/bin/env node
/**
 * 准备一次 Agent 端到端复测工作区，并打印「最小提示词」。
 *
 * 用法:
 *   node scripts/agent-retest/prepare.mjs --skill-root <skill> --work-root <dir>
 *   node scripts/agent-retest/prepare.mjs --work-root <dir>   # skill-root 默认推算
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SKILL_ROOT = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const out = { skillRoot: DEFAULT_SKILL_ROOT, workRoot: '', scenario: 'slimtrack' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill-root') out.skillRoot = path.resolve(argv[++i] || '');
    else if (a === '--work-root') out.workRoot = path.resolve(argv[++i] || '');
    else if (a === '--scenario') out.scenario = argv[++i] || 'slimtrack';
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function loadTemplate(skillRoot) {
  const p = path.join(skillRoot, 'tools/agent-retest/PROMPT.template.md');
  if (!fs.existsSync(p)) {
    throw new Error(`缺少提示模板: ${p}`);
  }
  return fs.readFileSync(p, 'utf8');
}

function renderPrompt(template, skillRoot, workRoot) {
  return template
    .replaceAll('{{SKILL_ROOT}}', skillRoot)
    .replaceAll('{{WORK_ROOT}}', workRoot)
    .trim() + '\n';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.workRoot) {
    console.log(`用法:
  node scripts/agent-retest/prepare.mjs --work-root <新项目目录> [--skill-root <skill>]

作用:
  1. 创建空工作区（若已存在则保留，不覆盖）
  2. 写出 agent-retest.meta.json
  3. 打印应原样发给被试 Task 的最小提示词
`);
    process.exit(args.help ? 0 : 1);
  }

  const skillRoot = args.skillRoot;
  const skillMd = path.join(skillRoot, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    console.error(`不是合法 skill 根（缺 SKILL.md）: ${skillRoot}`);
    process.exit(1);
  }

  fs.mkdirSync(args.workRoot, { recursive: true });
  const prompt = renderPrompt(loadTemplate(skillRoot), skillRoot, args.workRoot);
  const meta = {
    createdAt: new Date().toISOString(),
    skillRoot,
    workRoot: args.workRoot,
    scenario: args.scenario,
    continueToken: '继续',
    note: '被试 Task 只用下方 prompt；中途停了只发 continueToken；禁止夹带流程提示。',
  };
  fs.writeFileSync(path.join(args.workRoot, 'agent-retest.meta.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(path.join(args.workRoot, 'agent-retest.prompt.txt'), prompt);

  console.log('=== AgileFlow Agent 复测 · 已准备 ===');
  console.log(`skill:  ${skillRoot}`);
  console.log(`work:   ${args.workRoot}`);
  console.log(`meta:   ${path.join(args.workRoot, 'agent-retest.meta.json')}`);
  console.log('');
  console.log('--- 复制以下全文作为 Task prompt（不要加任何说明）---');
  console.log(prompt);
  console.log('--- 结束 ---');
  console.log('');
  console.log('考官续跑：resume 被试时只发「继续」');
  console.log(`打分：node ${path.join(skillRoot, 'scripts/agent-retest/score.mjs')} --root ${args.workRoot} --skill-root ${skillRoot}`);
}

main();
