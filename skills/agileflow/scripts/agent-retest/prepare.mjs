#!/usr/bin/env node
/**
 * 准备一次 Agent 端到端复测工作区，并打印「最小提示词」。
 *
 * 用法:
 *   node scripts/agent-retest/prepare.mjs --work-root <dir> --mode <ai|user>
 *   node scripts/agent-retest/prepare.mjs --skill-root <skill> --work-root <dir> --mode ai
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SKILL_ROOT = path.resolve(__dirname, '../..');

const SCENARIOS = {
  slimtrack: { promptSuffix: '' },
  'custom-flow': {
    promptFile: 'PROMPT.ai.custom-flow.md',
    seed: 'custom-flow',
    note: '预置含 research/ux-spike/preflight 的 flow.yaml；验 AF_STEP 与自定义步落盘。勿教被试步名。',
  },
  'parallel-flow': {
    promptFile: 'PROMPT.ai.parallel-flow.md',
    seed: 'parallel-flow',
    note: '预置 research∥competitor 同波并行再 req；prompt 含 research: 门牌切入。',
  },
};

const MODES = {
  ai: {
    decide: 'ai',
    promptFile: 'PROMPT.ai.md',
    autonomyRule: 'fail_on_continues',
    note:
      '被试 Task 只用下方 prompt。AI 自主本应自治到交付；中途停等「继续」= 失败信号，捞盘时只发 continueToken 并计入 --continues N。禁止夹带流程提示。',
  },
  user: {
    decide: 'user',
    promptFile: 'PROMPT.user.md',
    autonomyRule: 'continues_ok',
    note:
      '被试 Task 只用下方 prompt。用户决策须开 user-sim 逐轮答卡；答卡续跑不算自治失败。禁止夹带流程提示。user-sim 见 tools/agent-retest/USER-SIM.prompt.md。',
  },
};

function parseArgs(argv) {
  const out = { skillRoot: DEFAULT_SKILL_ROOT, workRoot: '', scenario: 'slimtrack', mode: 'ai' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill-root') out.skillRoot = path.resolve(argv[++i] || '');
    else if (a === '--work-root') out.workRoot = path.resolve(argv[++i] || '');
    else if (a === '--scenario') out.scenario = argv[++i] || 'slimtrack';
    else if (a === '--mode') out.mode = (argv[++i] || 'ai').trim();
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function normalizeMode(mode) {
  const m = String(mode || 'ai').toLowerCase();
  if (m === 'ai') return 'ai';
  if (m === 'user') return 'user';
  return '';
}

function loadTemplate(skillRoot, modeId, scenarioId) {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.slimtrack;
  const cfg = MODES[modeId];
  const promptFile = scenario.promptFile && modeId === 'ai' ? scenario.promptFile : cfg.promptFile;
  const p = path.join(skillRoot, 'tools/agent-retest', promptFile);
  if (!fs.existsSync(p)) {
    throw new Error(`缺少提示模板: ${p}`);
  }
  return fs.readFileSync(p, 'utf8');
}

function seedScenarioWorkdir(skillRoot, workRoot, scenarioId) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario?.seed) return;
  const seedDir = path.join(skillRoot, 'tools/agent-retest/scenarios', scenario.seed);
  const atlas = path.join(workRoot, 'atlas');
  fs.mkdirSync(path.join(atlas, 'role'), { recursive: true });
  fs.mkdirSync(path.join(atlas, 'logs'), { recursive: true });
  const flowSrc = path.join(seedDir, 'flow.yaml');
  if (fs.existsSync(flowSrc)) {
    fs.copyFileSync(flowSrc, path.join(atlas, 'flow.yaml'));
  }
  for (const name of fs.readdirSync(seedDir)) {
    if (name.startsWith('role-') && name.endsWith('.md')) {
      fs.copyFileSync(path.join(seedDir, name), path.join(atlas, 'role', name));
    }
  }
}

function renderPrompt(template, skillRoot, workRoot) {
  return template
    .replaceAll('{{SKILL_ROOT}}', skillRoot)
    .replaceAll('{{WORK_ROOT}}', workRoot)
    .trim() + '\n';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const modeId = normalizeMode(args.mode);
  if (args.help || !args.workRoot || !modeId) {
    console.log(`用法:
  node scripts/agent-retest/prepare.mjs --work-root <新项目目录> [--mode ai|user] [--scenario slimtrack|custom-flow] [--skill-root <skill>]

作用:
  1. 创建空工作区（若已存在则保留，不覆盖）
  2. 写出 agent-retest.meta.json
  3. 打印应原样发给被试 Task 的最小提示词

--mode:
  ai   AI 自主（默认；「你定」）
  user 用户决策（须开 user-sim）

--scenario:
  slimtrack     默认（减肥小程序全栈）
  custom-flow   预置特殊 flow 步（饮水打卡瘦需求）
  parallel-flow research∥competitor 并行波 + research: 切入
`);
    process.exit(args.help ? 0 : 1);
  }

  const skillRoot = args.skillRoot;
  const skillMd = path.join(skillRoot, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    console.error(`不是合法 skill 根（缺 SKILL.md）: ${skillRoot}`);
    process.exit(1);
  }

  const cfg = MODES[modeId];
  fs.mkdirSync(args.workRoot, { recursive: true });
  seedScenarioWorkdir(skillRoot, args.workRoot, args.scenario);
  const prompt = renderPrompt(loadTemplate(skillRoot, modeId, args.scenario), skillRoot, args.workRoot);
  const meta = {
    createdAt: new Date().toISOString(),
    skillRoot,
    workRoot: args.workRoot,
    scenario: args.scenario,
    mode: modeId,
    expectedDecide: cfg.decide,
    autonomyRule: cfg.autonomyRule,
    continueToken: '继续',
    note: (SCENARIOS[args.scenario]?.note) || cfg.note,
  };
  fs.writeFileSync(path.join(args.workRoot, 'agent-retest.meta.json'), JSON.stringify(meta, null, 2) + '\n');
  fs.writeFileSync(path.join(args.workRoot, 'agent-retest.prompt.txt'), prompt);

  console.log('=== AgileFlow Agent 复测 · 已准备 ===');
  console.log(`mode:     ${modeId}（AF_DECIDE=${cfg.decide}）`);
  console.log(`scenario: ${args.scenario}`);
  console.log(`skill:  ${skillRoot}`);
  console.log(`work:   ${args.workRoot}`);
  console.log(`meta:   ${path.join(args.workRoot, 'agent-retest.meta.json')}`);
  console.log('');
  console.log('--- 复制以下全文作为 Task prompt（不要加任何说明）---');
  console.log(prompt);
  console.log('--- 结束 ---');
  console.log('');
  if (modeId === 'ai') {
    console.log('中途停等「继续」= 自治失败；捞盘只发「继续」，打分加 --continues N');
  } else {
    console.log('须开 user-sim 答卡；答卡续跑正常。打分加 --user-sim-rounds R');
  }
  console.log(
    `打分：node ${path.join(skillRoot, 'scripts/agent-retest/score.mjs')} --root ${args.workRoot} --skill-root ${skillRoot} --mode ${modeId} --continues 0`,
  );
}

main();
