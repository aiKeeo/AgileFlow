#!/usr/bin/env node
/**
 * 对复测工作区打分：Agent 是否按 skill 落盘（形柱），不信口头「完成」。
 *
 * 用法:
 *   node scripts/agent-retest/score.mjs --root <项目根> [--mode ai|user] [--continues N] [--user-sim-rounds N]
 *
 * --mode：复测决策维（默认 ai）。硬检 AF_DECIDE。
 * --continues：考官人工 resume 次数；仅 mode=ai 且 >0 时 GATE_AUTONOMY 失败。
 * --user-sim-rounds：user-sim 答卡轮数（记入报告，不单独判失败）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateNarrativeFlow } from '../validate-atlas/lib/rules/dev/narrative-flow.mjs';
import { validateReqAcBackfill } from '../validate-atlas/lib/rules/requirements.mjs';
import { Reporter } from '../validate-atlas/lib/reporter.mjs';
import { loadCustomRoles } from '../validate-atlas/lib/rules/role-custom.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SKILL_ROOT = path.resolve(__dirname, '../..');

function normalizeMode(mode) {
  const m = String(mode || 'ai').toLowerCase();
  if (m === 'ai') return 'ai';
  if (m === 'user') return 'user';
  return '';
}

function expectedDecide(modeId) {
  return modeId === 'user' ? 'user' : 'ai';
}

function parseArgs(argv) {
  const out = {
    skillRoot: DEFAULT_SKILL_ROOT,
    root: '',
    json: false,
    continues: 0,
    userSimRounds: 0,
    mode: 'ai',
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill-root') out.skillRoot = path.resolve(argv[++i] || '');
    else if (a === '--root') out.root = path.resolve(argv[++i] || '');
    else if (a === '--continues') out.continues = Number(argv[++i] || '0') || 0;
    else if (a === '--user-sim-rounds') out.userSimRounds = Number(argv[++i] || '0') || 0;
    else if (a === '--mode') out.mode = (argv[++i] || 'ai').trim();
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
  if (!fs.existsSync(p)) {
    return { exists: false, entries: 0, missingSubagentId: 0, missingStepId: 0, devMissingTaskId: 0, degraded: false, stepIds: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.entries) ? raw.entries : [];
    const degraded = raw.mode === 'degraded-single-session';
    let missingSubagentId = 0;
    let devMissingTaskId = 0;
    let missingStepId = 0;
    if (!degraded) {
      for (const e of list) {
        if (!e?.stepId || String(e.stepId).trim() === '') missingStepId++;
        const role = e?.role != null ? String(e.role) : '';
        const sub = e?.subagentId != null ? String(e.subagentId).trim() : '';
        if (role === 'orch-direct') {
          if (sub !== 'orch-direct') missingSubagentId++;
        } else if (!sub) {
          missingSubagentId++;
        }
        if (role === 'dev' && (!e.taskId || !/^T-\d+/.test(String(e.taskId)))) devMissingTaskId++;
      }
    }
    return {
      exists: true,
      entries: list.length,
      missingSubagentId,
      missingStepId,
      devMissingTaskId,
      degraded,
      stepIds: list.map((e) => e?.stepId).filter(Boolean),
    };
  } catch {
    return { exists: true, entries: 0, parseError: true, missingSubagentId: 0, missingStepId: 0, devMissingTaskId: 0, degraded: false, stepIds: [] };
  }
}

/** 直接验 AC 回填（不依赖 gate 相位） */
function readMeta(root) {
  const p = path.join(root, 'agent-retest.meta.json');
  if (!fs.existsSync(p)) return { scenario: 'slimtrack' };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { scenario: 'slimtrack' };
  }
}

function fileNonEmpty(root, rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return false;
  try {
    return fs.statSync(p).size > 20;
  } catch {
    return false;
  }
}

function scoreCustomFlow(root) {
  const checks = [];
  const flowPath = path.join(root, 'atlas', 'flow.yaml');
  if (!fs.existsSync(flowPath)) {
    checks.push({ id: 'FLOW_YAML', ok: false, msg: '缺 atlas/flow.yaml' });
    return checks;
  }
  const flowText = fs.readFileSync(flowPath, 'utf8');
  for (const id of ['research', 'ux-spike', 'preflight']) {
    if (!flowText.includes(`id: ${id}`)) {
      checks.push({ id: 'FLOW_YAML', ok: false, msg: `flow 缺步 ${id}` });
      return checks;
    }
  }
  checks.push({ id: 'FLOW_YAML', ok: true, msg: 'flow 含 research/ux-spike/preflight' });

  const env = readEnv(root);
  if (env.AF_STEP) {
    checks.push({ id: 'AF_STEP', ok: true, msg: `AF_STEP=${env.AF_STEP}` });
  } else {
    checks.push({ id: 'AF_STEP', ok: false, msg: '缺 AF_STEP（有 flow 时应维护）' });
  }

  const researchRel = 'atlas/logs/research-water.md';
  const researchOk = fileNonEmpty(root, researchRel);
  let researchMsg = researchOk ? 'research-water.md 已落盘' : '缺 atlas/logs/research-water.md';
  let researchPass = researchOk;
  if (researchOk) {
    const reqDir = path.join(root, 'atlas', 'requirements');
    let firstReqMtime = null;
    if (fs.existsSync(reqDir)) {
      for (const n of fs.readdirSync(reqDir)) {
        if (!/^REQ-\d+/i.test(n)) continue;
        const mt = fs.statSync(path.join(reqDir, n)).mtimeMs;
        if (firstReqMtime == null || mt < firstReqMtime) firstReqMtime = mt;
      }
    }
    if (firstReqMtime != null) {
      const rMt = fs.statSync(path.join(root, researchRel)).mtimeMs;
      // 允许 2s 误差；调研不得明显晚于首个 REQ（事后补盘）
      if (rMt > firstReqMtime + 2000) {
        researchPass = false;
        researchMsg = 'research-water.md 修改时间晚于首个 REQ（疑事后补盘）';
      } else {
        researchMsg = 'research-water.md 已落盘且不晚于首个 REQ';
      }
    }
  }
  checks.push({ id: 'CUSTOM_RESEARCH', ok: researchPass, msg: researchMsg });

  const uxOk = fileNonEmpty(root, 'atlas/logs/ux-spike.md');
  checks.push({
    id: 'CUSTOM_UX',
    ok: uxOk,
    msg: uxOk ? 'ux-spike.md 已落盘' : '缺 atlas/logs/ux-spike.md',
  });

  const ledgerSteps = new Set(scoreDispatch(root).stepIds || []);
  const needSteps = ['research', 'ux-spike'];
  const missingLedger = needSteps.filter((id) => !ledgerSteps.has(id));
  checks.push({
    id: 'LEDGER_STEPS',
    ok: missingLedger.length === 0,
    msg:
      missingLedger.length === 0
        ? '台账含 research / ux-spike'
        : `台账缺 stepId：${missingLedger.join(', ')}（走过须记账；直做步 role=orch-direct）`,
  });

  const preflightSkipped = /id:\s*preflight[\s\S]*?skip:\s*true/m.test(flowText);
  const preflightFile = fileNonEmpty(root, 'atlas/logs/preflight.md');
  if (preflightSkipped) {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: true, msg: 'preflight 已在 flow skip' });
  } else if (preflightFile) {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: true, msg: 'preflight.md 已落盘' });
  } else {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: false, msg: 'preflight 未 skip 且无 preflight.md' });
  }

  if (flowText.includes('id: model') && /skip:\s*true/.test(flowText.split('id: model')[1]?.split('id: sol')[0] || '')) {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: true, msg: 'model 经 flow skip' });
  } else if (fs.existsSync(path.join(root, 'atlas', 'model', 'README.md'))) {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: true, msg: 'model 已落盘（未 skip）' });
  } else {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: false, msg: 'model 既未 flow skip 也无 README' });
  }

  return checks;
}

function scoreParallelFlow(root) {
  const checks = [];
  const flowPath = path.join(root, 'atlas', 'flow.yaml');
  if (!fs.existsSync(flowPath)) {
    checks.push({ id: 'FLOW_YAML', ok: false, msg: '缺 atlas/flow.yaml' });
    return checks;
  }
  const flowText = fs.readFileSync(flowPath, 'utf8');
  for (const id of ['research', 'competitor', 'req']) {
    if (!flowText.includes(`id: ${id}`)) {
      checks.push({ id: 'FLOW_YAML', ok: false, msg: `flow 缺步 ${id}` });
      return checks;
    }
  }
  checks.push({ id: 'FLOW_YAML', ok: true, msg: 'flow 含 research/competitor/req' });

  const env = readEnv(root);
  checks.push({
    id: 'AF_STEP',
    ok: Boolean(env.AF_STEP),
    msg: env.AF_STEP ? `AF_STEP=${env.AF_STEP}` : '缺 AF_STEP',
  });

  const researchOk = fileNonEmpty(root, 'atlas/logs/research-water.md');
  const competitorOk = fileNonEmpty(root, 'atlas/logs/competitor-water.md');
  checks.push({
    id: 'PARALLEL_RESEARCH',
    ok: researchOk,
    msg: researchOk ? 'research-water.md 已落盘' : '缺 research-water.md',
  });
  checks.push({
    id: 'PARALLEL_COMPETITOR',
    ok: competitorOk,
    msg: competitorOk ? 'competitor-water.md 已落盘' : '缺 competitor-water.md',
  });

  const ledgerSteps = new Set(scoreDispatch(root).stepIds || []);
  const need = ['research', 'competitor'];
  const missing = need.filter((id) => !ledgerSteps.has(id));
  checks.push({
    id: 'PARALLEL_LEDGER',
    ok: missing.length === 0,
    msg:
      missing.length === 0
        ? '台账含 research + competitor（并行波）'
        : `台账缺 stepId：${missing.join(', ')}`,
  });

  return checks;
}

function scoreAcBackfill(root) {
  const reporter = new Reporter();
  validateReqAcBackfill(root, reporter, { force: true });
  const errs = reporter.getIssues().filter((i) => i.severity === 'error' && i.rule === 'REQ-AC-未回填');
  return { ok: errs.length === 0, count: errs.length, messages: errs.map((e) => e.message) };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const modeId = normalizeMode(args.mode);
  if (args.help || !args.root || !modeId) {
    console.log(`用法:
  node scripts/agent-retest/score.mjs --root <复测项目根> [--mode ai|user] [--skill-root <skill>] [--continues N] [--user-sim-rounds N] [--json]

--mode ai|user（默认 ai）：硬检 AF_DECIDE
--continues：仅 ai 模式 >0 时 GATE_AUTONOMY 失败
`);
    process.exit(args.help ? 0 : 1);
  }

  const wantDecide = expectedDecide(modeId);
  const meta = readMeta(args.root);
  const env = readEnv(args.root);
  const customRoles = loadCustomRoles(args.root);
  const devFiles = listDevFiles(args.root);
  const narrative = scoreDevNarrative(devFiles);
  const todo = scoreTodo(args.root);
  const dispatch = scoreDispatch(args.root);

  const checks = [];
  const fail = (id, msg) => checks.push({ id, ok: false, msg });
  const pass = (id, msg) => checks.push({ id, ok: true, msg });

  if (!fs.existsSync(path.join(args.root, 'atlas'))) fail('ATLAS', '无 atlas/ 目录');
  else pass('ATLAS', '有 atlas/');

  if (env.AF_DECIDE === wantDecide) {
    pass('DECIDE', `AF_DECIDE=${wantDecide}（mode=${modeId}）`);
  } else {
    fail('DECIDE', `期望 AF_DECIDE=${wantDecide}（mode=${modeId}），实际 ${env.AF_DECIDE || '(缺)'}`);
  }

  if (env.AF_TIER === 'full') pass('TIER', 'AF_TIER=full');
  else fail('TIER', `期望 AF_TIER=full，实际 ${env.AF_TIER || '(缺)'}`);

  if (dispatch.exists && dispatch.entries > 0) {
    if (dispatch.degraded) {
      pass('ORCH', `派活台账 entries=${dispatch.entries}（degraded 模式）`);
    } else if (dispatch.missingStepId > 0) {
      fail('ORCH', `台账 ${dispatch.missingStepId} 条缺 stepId（走过的步必须记账）`);
    } else if (dispatch.missingSubagentId > 0) {
      fail('ORCH', `台账 ${dispatch.missingSubagentId} 条缺 subagentId（疑似主线程包办后补假账）`);
    } else if (dispatch.devMissingTaskId > 0) {
      fail('ORCH', `台账 ${dispatch.devMissingTaskId} 条 dev 缺 taskId`);
    } else {
      pass('ORCH', `派活台账 entries=${dispatch.entries}（含 subagentId）`);
    }
  } else fail('ORCH', '缺 atlas/agileflow-dispatch.json 或条目为空（总控未记台账）');

  if (todo.exists && todo.tHeaders >= 1) pass('TODO', `todo T 头=${todo.tHeaders}，勾①${todo.checked1}/②${todo.checked2}/③${todo.checked3}`);
  else fail('TODO', '缺合法 todo T 头');

  if (devFiles.length === 0) fail('DEV_FILES', 'atlas/dev 无 T-*.md');
  else if (customRoles.has('dev')) {
    pass('DEV_NARRATIVE', `role-dev 已自定义 → 跳过五段式硬检（${narrative.total} 个构思）`);
  } else if (narrative.fail > 0) {
    fail('DEV_NARRATIVE', `${narrative.fail}/${narrative.total} 个构思未过完整质量线（五段式/→语义）`);
  } else pass('DEV_NARRATIVE', `${narrative.total} 个构思均过完整质量线`);

  const phase = Number(env.AF_PHASE || '0');
  const gates = {};

  const ac = scoreAcBackfill(args.root);
  if (ac.ok) pass('GATE_AC', 'REQ AC 已回填（无过半「③ 后填」）');
  else fail('GATE_AC', `REQ AC 未回填（${ac.count} 个 REQ 仍「③ 后填」）——禁止假装交付`);

  if (phase === 4) {
    gates['dev-complete'] = runGate(args.skillRoot, args.root, 'dev-complete');
    if (gates['dev-complete'].ok) pass('GATE_DEV', 'dev-complete 绿');
    else fail('GATE_DEV', 'dev-complete 未过（开发收口证据不足或 AC/可运行等）');
  } else if (phase >= 5) {
    gates['test-entry'] = runGate(args.skillRoot, args.root, 'test-entry');
    if (gates['test-entry'].ok) pass('GATE_DEV', 'test-entry 绿（phase≥5 收口）');
    else {
      const out = `${gates['test-entry'].stdout || ''}\n${gates['test-entry'].stderr || ''}`;
      const acHit = /REQ-AC-未回填/.test(out);
      fail(
        'GATE_DEV',
        acHit
          ? 'test-entry 未过：含 REQ-AC-未回填'
          : 'test-entry 未过（测试入场/收口证据不足）',
      );
    }
  } else if (phase >= 3) {
    gates['sol-confirm'] = runGate(args.skillRoot, args.root, 'sol-confirm');
    if (gates['sol-confirm']?.ok) pass('GATE_SOL', 'sol-confirm 绿');
    else fail('GATE_SOL', 'sol-confirm 未过（尚未到开发收口）');
    fail('GATE_DEV', `AF_PHASE=${phase} 尚未到开发收口（期望 ≥4）`);
  } else {
    fail('GATE_DEV', `AF_PHASE=${phase} 过早，无法验开发收口`);
  }

  const reqDir = path.join(args.root, 'atlas', 'requirements');
  const hasReq =
    fs.existsSync(reqDir) && fs.readdirSync(reqDir).some((n) => /^REQ-\d+/i.test(n));
  if (phase >= 2 && hasReq) pass('GATE_REQ', `REQ 已落盘且 AF_PHASE=${phase}`);
  else if (!hasReq) fail('GATE_REQ', '无 REQ 落盘');
  else pass('GATE_REQ', '有 REQ');

  if (todo.checked3 >= todo.tHeaders && todo.tHeaders > 0) pass('TODO_③', '全部 T 已勾 ③');
  else fail('TODO_③', `③ 未齐：${todo.checked3}/${todo.tHeaders}`);

  if (meta.scenario === 'custom-flow') {
    for (const c of scoreCustomFlow(args.root)) {
      if (c.ok) pass(c.id, c.msg);
      else fail(c.id, c.msg);
    }
  }
  if (meta.scenario === 'parallel-flow') {
    for (const c of scoreParallelFlow(args.root)) {
      if (c.ok) pass(c.id, c.msg);
      else fail(c.id, c.msg);
    }
  }

  if (modeId === 'ai') {
    if (args.continues > 0) {
      fail(
        'GATE_AUTONOMY',
        `考官人工「继续」×${args.continues}——AI 自主本应阻塞式派活同会话循环，不应甩续跑给人`,
      );
    } else {
      pass('GATE_AUTONOMY', '无人工「继续」记录（或未传 --continues）');
    }
  } else {
    pass(
      'GATE_AUTONOMY',
      `mode=user：续跑/答卡属契约（continues=${args.continues}，userSimRounds=${args.userSimRounds}）`,
    );
  }

  const failed = checks.filter((c) => !c.ok);
  const report = {
    scoredAt: new Date().toISOString(),
    root: args.root,
    skillRoot: args.skillRoot,
    mode: modeId,
    expectedDecide: wantDecide,
    continues: args.continues,
    userSimRounds: args.userSimRounds,
    customRoles: [...customRoles],
    env,
    todo,
    dispatch,
    narrative,
    acOk: ac.ok,
    gates: Object.fromEntries(
      Object.entries(gates).map(([k, v]) => [k, { ok: v.ok, exitCode: v.exitCode }]),
    ),
    checks,
    passed: failed.length === 0,
    summary: failed.length === 0 ? 'PASS：形柱+AC+收口+决策维' : `FAIL：${failed.length} 项`,
  };

  const logDir = path.join(args.root, 'atlas', 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const outPath = path.join(logDir, 'agent-retest-score.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`=== Agent 复测打分 · ${report.summary} ===`);
    console.log(`mode: ${modeId}`);
    console.log(`root: ${args.root}`);
    console.log(`report: ${outPath}`);
    for (const c of checks) {
      console.log(`${c.ok ? '✅' : '❌'} [${c.id}] ${c.msg}`);
    }
    if (narrative.fail > 0 && !customRoles.has('dev')) {
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
