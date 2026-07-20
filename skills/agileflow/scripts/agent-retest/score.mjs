#!/usr/bin/env node
/**
 * 对复测工作区打分：Agent 是否按 skill 落盘（形柱），不信口头「完成」。
 *
 * 用法:
 *   node scripts/agent-retest/score.mjs --root <项目根> [--skill-root <skill>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateNarrativeFlow } from '../validate-atlas/lib/rules/dev/narrative-flow.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SKILL_ROOT = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const out = { skillRoot: DEFAULT_SKILL_ROOT, root: '', json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill-root') out.skillRoot = path.resolve(argv[++i] || '');
    else if (a === '--root') out.root = path.resolve(argv[++i] || '');
    else if (a === '--json') out.json = true;
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function readEnv(root) {
  const p = path.join(root, 'atlas', 'agileflow.env');
  if (!fs.existsSync(p)) return {};
  const map = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2].trim();
  }
  return map;
}

function listDevFiles(root) {
  const dir = path.join(root, 'atlas', 'dev');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^T-\d+-.+\.md$/i.test(n))
    .map((n) => path.join(dir, n));
}

function runGate(skillRoot, root, gate) {
  const cli = path.join(skillRoot, 'scripts', 'validate-atlas.mjs');
  const r = spawnSync(process.execPath, [cli, '--gate', gate, '--root', root], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    gate,
    exitCode: r.status ?? 1,
    ok: (r.status ?? 1) === 0,
    stderr: (r.stderr || '').slice(-800),
    stdout: (r.stdout || '').slice(-1200),
  };
}

function scoreDevNarrative(devFiles) {
  const results = [];
  let fail = 0;
  for (const file of devFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const bannedSteps = /^##\s*步骤(\s|$)/m.test(content);
    const issues = validateNarrativeFlow(content);
    const item = {
      file: path.basename(file),
      bannedSteps,
      narrativeOk: !bannedSteps && issues.length === 0,
      issues: issues.map((i) => i.message),
    };
    if (!item.narrativeOk) fail += 1;
    results.push(item);
  }
  return { total: devFiles.length, fail, results };
}

function scoreTodo(root) {
  const p = path.join(root, 'atlas', 'todo.md');
  if (!fs.existsSync(p)) return { exists: false, tHeaders: 0, checked1: 0, checked2: 0, checked3: 0 };
  const text = fs.readFileSync(p, 'utf8');
  const tHeaders = [...text.matchAll(/^#{3,4}\s+T-\d+/gm)].length;
  const checked1 = [...text.matchAll(/\[x\]\s*\*?\*?①/gi)].length;
  const checked2 = [...text.matchAll(/\[x\]\s*\*?\*?②/gi)].length;
  const checked3 = [...text.matchAll(/\[x\]\s*\*?\*?③/gi)].length;
  return { exists: true, tHeaders, checked1, checked2, checked3 };
}

function scoreDispatch(root) {
  const p = path.join(root, 'atlas', 'agileflow-dispatch.json');
  if (!fs.existsSync(p)) return { exists: false, entries: 0 };
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const entries = Array.isArray(raw) ? raw.length : Array.isArray(raw.entries) ? raw.entries.length : Object.keys(raw).length;
    return { exists: true, entries };
  } catch {
    return { exists: true, entries: 0, parseError: true };
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.root) {
    console.log(`用法:
  node scripts/agent-retest/score.mjs --root <复测项目根> [--skill-root <skill>] [--json]
`);
    process.exit(args.help ? 0 : 1);
  }

  const env = readEnv(args.root);
  const devFiles = listDevFiles(args.root);
  const narrative = scoreDevNarrative(devFiles);
  const todo = scoreTodo(args.root);
  const dispatch = scoreDispatch(args.root);

  const checks = [];
  const fail = (id, msg) => checks.push({ id, ok: false, msg });
  const pass = (id, msg) => checks.push({ id, ok: true, msg });

  if (!fs.existsSync(path.join(args.root, 'atlas'))) fail('ATLAS', '无 atlas/ 目录');
  else pass('ATLAS', '有 atlas/');

  if (env.AF_DECIDE === 'ai') pass('DECIDE', 'AF_DECIDE=ai（委托）');
  else fail('DECIDE', `期望 AF_DECIDE=ai，实际 ${env.AF_DECIDE || '(缺)'}`);

  if (env.AF_FLOW === 'fast') pass('FLOW', 'AF_FLOW=fast');
  else fail('FLOW', `期望 AF_FLOW=fast，实际 ${env.AF_FLOW || '(缺)'}`);

  if (env.AF_TIER === 'full') pass('TIER', 'AF_TIER=full');
  else fail('TIER', `期望 AF_TIER=full，实际 ${env.AF_TIER || '(缺)'}`);

  if (dispatch.exists && dispatch.entries > 0) pass('ORCH', `派活台账 entries=${dispatch.entries}`);
  else fail('ORCH', '缺 atlas/agileflow-dispatch.json 或条目为空（总控未记台账）');

  if (todo.exists && todo.tHeaders >= 1) pass('TODO', `todo T 头=${todo.tHeaders}，勾①${todo.checked1}/②${todo.checked2}/③${todo.checked3}`);
  else fail('TODO', '缺合法 todo T 头');

  if (devFiles.length === 0) fail('DEV_FILES', 'atlas/dev 无 T-*.md');
  else if (narrative.fail > 0) fail('DEV_NARRATIVE', `${narrative.fail}/${narrative.total} 个构思未过完整质量线（五段式/→语义）`);
  else pass('DEV_NARRATIVE', `${narrative.total} 个构思均过完整质量线`);

  const phase = Number(env.AF_PHASE || '0');
  const gates = {};
  const gateList =
    phase >= 4
      ? ['write-code', 'dev-complete']
      : phase >= 3
        ? ['sol-confirm', 'write-code', 'dev-complete']
        : phase >= 2
          ? ['mod-confirm', 'sol-confirm', 'dev-complete']
          : ['req-confirm', 'sol-confirm', 'dev-complete'];

  for (const g of gateList) {
    gates[g] = runGate(args.skillRoot, args.root, g);
  }

  const reqDir = path.join(args.root, 'atlas', 'requirements');
  const hasReq =
    fs.existsSync(reqDir) && fs.readdirSync(reqDir).some((n) => /^REQ-\d+/i.test(n));
  if (phase >= 2 && hasReq) pass('GATE_REQ', `REQ 已落盘且 AF_PHASE=${phase}（跳过 req-confirm 相位校验）`);
  else if (gates['req-confirm']?.ok) pass('GATE_REQ', 'req-confirm 绿');
  else if (gates['req-confirm']) fail('GATE_REQ', 'req-confirm 未过');
  else if (!hasReq) fail('GATE_REQ', '无 REQ 落盘');
  else pass('GATE_REQ', '有 REQ');

  if (gates['dev-complete']?.ok) pass('GATE_DEV', 'dev-complete 绿（开发完毕）');
  else fail('GATE_DEV', 'dev-complete 未过（开发未完毕或证据不足）');

  if (todo.checked3 >= todo.tHeaders && todo.tHeaders > 0) pass('TODO_③', '全部 T 已勾 ③');
  else fail('TODO_③', `③ 未齐：${todo.checked3}/${todo.tHeaders}`);

  const failed = checks.filter((c) => !c.ok);
  const report = {
    scoredAt: new Date().toISOString(),
    root: args.root,
    skillRoot: args.skillRoot,
    env,
    todo,
    dispatch,
    narrative,
    gates: Object.fromEntries(
      Object.entries(gates).map(([k, v]) => [k, { ok: v.ok, exitCode: v.exitCode }]),
    ),
    checks,
    passed: failed.length === 0,
    summary: failed.length === 0 ? 'PASS：skill 形柱达标且 dev-complete 绿' : `FAIL：${failed.length} 项`,
  };

  const logDir = path.join(args.root, 'atlas', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const outPath = path.join(logDir, 'agent-retest-score.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`=== Agent 复测打分 · ${report.summary} ===`);
    console.log(`root: ${args.root}`);
    console.log(`report: ${outPath}`);
    for (const c of checks) {
      console.log(`${c.ok ? '✅' : '❌'} [${c.id}] ${c.msg}`);
    }
    if (narrative.fail > 0) {
      console.log('\n— 构思失败摘要 —');
      for (const r of narrative.results.filter((x) => !x.narrativeOk)) {
        console.log(`  ${r.file}${r.bannedSteps ? ' (禁 ## 步骤)' : ''}`);
        for (const m of r.issues.slice(0, 3)) console.log(`    - ${m}`);
      }
    }
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

main();
