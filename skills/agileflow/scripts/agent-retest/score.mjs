#!/usr/bin/env node
/**
 * 对复测工作区打分：Agent 是否按 skill 落盘（形柱），不信口头「完成」。
 *
 * 用法:
 *   node scripts/agent-retest/score.mjs --root <项目根> [--mode ai|user] [--continues N] [--user-sim-rounds N]
 *
 * --mode：复测决策维（默认 ai）。硬检 AF_DECIDE。
 * --continues：考官人工 resume 次数；mode=ai 时必须显式提供，且 >0 会失败。
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
import { loadFlow, listFlowSteps } from '../validate-atlas/lib/flow.mjs';
import { loadCurrentPointer, loadRun, eventsFile } from '../runtime/run-state.mjs';
import { runtimeGateStatus } from '../runtime/receipts.mjs';
import { STEP_EXIT_GATE } from '../runtime/gates.mjs';

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
    continuesProvided: false,
    userSimRounds: 0,
    mode: 'ai',
    checkAfCommands: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skill-root') out.skillRoot = path.resolve(argv[++i] || '');
    else if (a === '--root') out.root = path.resolve(argv[++i] || '');
    else if (a === '--continues') {
      out.continuesProvided = true;
      out.continues = Number(argv[++i] || '0') || 0;
    }
    else if (a === '--user-sim-rounds') out.userSimRounds = Number(argv[++i] || '0') || 0;
    else if (a === '--mode') out.mode = (argv[++i] || 'ai').trim();
    else if (a === '--check-af-commands') out.checkAfCommands = true;
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
  for (const id of ['af-research', 'af-ux-spike', 'af-preflight']) {
    if (!flowText.includes(`id: ${id}`)) {
      checks.push({ id: 'FLOW_YAML', ok: false, msg: `flow 缺步 ${id}` });
      return checks;
    }
  }
  checks.push({ id: 'FLOW_YAML', ok: true, msg: 'flow 含 af-research/af-ux-spike/af-preflight' });

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
  const needSteps = ['af-research', 'af-ux-spike'];
  const missingLedger = needSteps.filter((id) => !ledgerSteps.has(id));
  checks.push({
    id: 'LEDGER_STEPS',
    ok: missingLedger.length === 0,
    msg:
      missingLedger.length === 0
        ? '台账含 af-research / af-ux-spike'
        : `台账缺 stepId：${missingLedger.join(', ')}（走过须记账；直做步 role=orch-direct）`,
  });

  const preflightSkipped = /id:\s*af-preflight[\s\S]*?skip:\s*true/m.test(flowText);
  const preflightFile = fileNonEmpty(root, 'atlas/logs/preflight.md');
  if (preflightSkipped) {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: true, msg: 'preflight 已在 flow skip' });
  } else if (preflightFile) {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: true, msg: 'preflight.md 已落盘' });
  } else {
    checks.push({ id: 'CUSTOM_PREFLIGHT', ok: false, msg: 'preflight 未 skip 且无 preflight.md' });
  }

  if (flowText.includes('id: af-mod') && /skip:\s*true/.test(flowText.split('id: af-mod')[1]?.split('id: af-sol')[0] || '')) {
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
  for (const id of ['af-research', 'af-competitor', 'af-req']) {
    if (!flowText.includes(`id: ${id}`)) {
      checks.push({ id: 'FLOW_YAML', ok: false, msg: `flow 缺步 ${id}` });
      return checks;
    }
  }
  checks.push({ id: 'FLOW_YAML', ok: true, msg: 'flow 含 af-research/af-competitor/af-req' });

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
  const need = ['af-research', 'af-competitor'];
  const missing = need.filter((id) => !ledgerSteps.has(id));
  checks.push({
    id: 'PARALLEL_LEDGER',
    ok: missing.length === 0,
    msg:
      missing.length === 0
        ? '台账含 af-research + af-competitor（并行波）'
        : `台账缺 stepId：${missing.join(', ')}`,
  });

  const pointer = loadCurrentPointer(root);
  const run = pointer?.runId ? loadRun(root, pointer.runId) : null;
  let sameWave = false;
  if (run) {
    try {
      const events = fs
        .readFileSync(eventsFile(root, run.runId), 'utf8')
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      sameWave = events.some(
        (event) =>
          event.event === 'step.advanced' &&
          Array.isArray(event.to) &&
          event.to.includes('af-research') &&
          event.to.includes('af-competitor'),
      );
    } catch {
      sameWave = false;
    }
  }
  checks.push({
    id: 'PARALLEL_SAME_WAVE',
    ok: sameWave,
    msg: sameWave
      ? 'Runtime 事件证明 research + competitor 同波'
      : '无 Runtime step.advanced 同波证据（仅两个文件存在不算并行）',
  });

  return checks;
}

function scoreAcBackfill(root) {
  const reporter = new Reporter();
  validateReqAcBackfill(root, reporter, { force: true });
  const errs = reporter.getIssues().filter((i) => i.severity === 'error' && i.rule === 'REQ-AC-未回填');
  return { ok: errs.length === 0, count: errs.length, messages: errs.map((e) => e.message) };
}

/** 指令留痕 af-commands.md（全栈默认硬检；快捷可用 --check-af-commands 加严） */
function scoreAfCommands(root, opts = {}) {
  const expectQuick = Boolean(opts.expectQuick);
  const p = path.join(root, 'atlas', 'logs', 'af-commands.md');
  if (!fs.existsSync(p)) {
    return { ok: false, msg: '缺 atlas/logs/af-commands.md（须 agileflow log 留痕）' };
  }
  const text = fs.readFileSync(p, 'utf8');
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('[/af'));
  if (lines.length === 0) {
    return { ok: false, msg: 'af-commands.md 无有效 [/af…] 行（空 logs/ 不算）' };
  }

  const lineRe =
    /^\[(\/af[a-z0-9-]*)\]\[[^\]]{1,20}\]\[\d{4}-\d{2}-\d{2}\]\[→[^\]]+\]\[[✅⬆️❌⏸️]\]\s*$/;
  const valid = lines.filter((l) => lineRe.test(l));
  if (valid.length === 0) {
    return {
      ok: false,
      msg: `有 ${lines.length} 行但格式全错（须 [门牌][摘要][日期][→路由][状态]）`,
    };
  }
  const auto = valid.filter((line) => line.includes('[闸门自动留痕]'));
  if (auto.length > 0) {
    return {
      ok: false,
      msg: `发现 ${auto.length} 条闸门自动留痕；自动补写不能作为真实命令证据`,
    };
  }
  const successful = valid.filter((line) => line.endsWith('[✅]'));

  if (expectQuick) {
    const quickHit = successful.some((l) =>
      /\[\/af-(fix|refactor|tweak|perf|chore|ut|revise)\]/i.test(l),
    );
    if (!quickHit) {
      return { ok: false, msg: '期望快捷门牌留痕（/af-fix|/af-revise/…），未命中' };
    }
    return { ok: true, msg: `af-commands 快捷留痕 ${valid.length} 行合法` };
  }

  const ledgerSteps = new Set(scoreDispatch(root).stepIds || []);
  const expectedDoors = [];
  for (const [stepId, door] of [
    ['af-init', '/af-init'],
    ['af-req', '/af-req'],
    ['af-mod', '/af-mod'],
    ['af-sol', '/af-sol'],
    ['af-dev', '/af-dev'],
    ['af-test', '/af-test'],
  ]) {
    if (ledgerSteps.has(stepId)) expectedDoors.push(door);
  }
  if (expectedDoors.length === 0) {
    return { ok: false, msg: '台账没有可核对的 flow step；裸 /af 入口不能作为阶段完成证据' };
  }
  const missingDoors = expectedDoors.filter(
    (door) =>
      !successful.some((line) => {
        const match = line.match(/^\[(\/af[a-z0-9-]*)\]/);
        const actual = match?.[1] === '/af-tests' ? '/af-test' : match?.[1];
        return actual === door;
      }),
  );
  if (missingDoors.length > 0) {
    return {
      ok: false,
      msg: `缺已走阶段的显式成功留痕：${missingDoors.join(', ')}（裸 /af 不算）`,
    };
  }

  const doors = new Set(
    valid.map((l) => {
      const m = l.match(/^\[(\/af[a-z0-9-]*)\]/);
      return m ? m[1] : '';
    }),
  );
  return {
    ok: true,
    msg: `af-commands ${valid.length} 行合法 · 门牌 ${[...doors].filter(Boolean).join(',')}`,
  };
}

function scoreRuntime(root) {
  const checks = [];
  const pointer = loadCurrentPointer(root);
  if (!pointer?.runId) {
    return [{ id: 'RUNTIME_RUN', ok: false, msg: '缺 atlas/state/current.json active/completed Run 指针' }];
  }
  const run = loadRun(root, pointer.runId);
  if (!run) {
    return [{ id: 'RUNTIME_RUN', ok: false, msg: `Run 不存在：${pointer.runId}` }];
  }
  checks.push({
    id: 'RUNTIME_RUN',
    ok: ['active', 'completed'].includes(run.status),
    msg: `run=${run.runId} status=${run.status}`,
  });
  const loaded = loadFlow(root);
  if (!loaded.ok || !loaded.flow) {
    checks.push({ id: 'RUNTIME_FLOW', ok: false, msg: '无法加载 flow.yaml' });
    return checks;
  }
  const enabled = listFlowSteps(loaded.flow).filter((step) => !step.skip).map((step) => step.id);
  const reached = Object.entries(run.steps || {}).filter(
    ([, state]) => state.status === 'passed' || state.status === 'ready',
  );
  const missingReached = enabled.filter(
    (stepId) =>
      !run.currentStep?.includes(stepId) &&
      run.steps?.[stepId]?.status !== 'passed' &&
      enabled.indexOf(stepId) < Math.max(...run.currentStep.map((id) => enabled.indexOf(id))),
  );
  checks.push({
    id: 'RUNTIME_LINEAGE',
    ok: missingReached.length === 0,
    msg:
      missingReached.length === 0
        ? `已达步骤血缘完整：${reached.map(([id]) => id).join(',')}`
        : `缺步骤血缘：${missingReached.join(',')}`,
  });
  const proofFailures = [];
  for (const [stepId, state] of reached) {
    const gateId = STEP_EXIT_GATE[stepId];
    if (!gateId) continue;
    const mustHaveProof =
      state.status === 'passed' ||
      (run.currentStep?.includes(stepId) &&
        ((stepId === 'af-dev' && Number(readEnv(root).AF_PHASE || 0) >= 4) ||
          stepId === 'af-test'));
    if (!mustHaveProof) continue;
    const status = runtimeGateStatus(root, gateId, { runId: run.runId });
    if (!status.valid) proofFailures.push(`${gateId}:${status.reason}`);
  }
  checks.push({
    id: 'RUNTIME_PROOFS',
    ok: proofFailures.length === 0,
    msg:
      proofFailures.length === 0
        ? '已走阶段均有当前 Run/attempt/input 的有效 PASS'
        : `Runtime 证明无效：${proofFailures.join(', ')}`,
  });
  return checks;
}

/** E17：mod skip 或 model 落盘 */
function scoreModelSkip(root, skillRoot) {
  const checks = [];
  const flowPath = path.join(root, 'atlas', 'flow.yaml');
  if (!fs.existsSync(flowPath)) {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: false, msg: '缺 atlas/flow.yaml' });
    return checks;
  }
  const flowText = fs.readFileSync(flowPath, 'utf8');
  const modChunk = flowText.split('id: af-mod')[1]?.split(/\n  - id:/)[0] || '';
  const reason = modChunk.match(/reason:\s*["']?([^"'\n]+)/)?.[1]?.trim() || '';
  const modSkipped = /skip:\s*true/.test(modChunk) && reason.length >= 8;
  const modelReadme = fileNonEmpty(root, 'atlas/model/README.md');

  if (modSkipped) {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: true, msg: `af-mod 已 skip，reason=${reason}` });
  } else {
    checks.push({ id: 'MODEL_SKIP_FLOW', ok: false, msg: 'model-skip 场景必须 af-mod skip=true 且 reason 有实质内容' });
  }
  checks.push({
    id: 'MODEL_SKIP_NO_STUB',
    ok: !modelReadme,
    msg: modelReadme ? '存在 model/README.md；stub 不能冒充 skip' : '未用 model README stub 冒充 skip',
  });

  const gate = runGate(skillRoot, root, 'mod-confirm');
  checks.push({
    id: 'GATE_MOD',
    ok: gate.ok,
    msg: gate.ok ? 'mod-confirm 绿' : 'mod-confirm 未过',
  });

  const env = readEnv(root);
  const stepOk = env.AF_STEP === 'af-sol' || env.AF_STEP === 'af-dev' || Number(env.AF_PHASE || '0') >= 3;
  checks.push({
    id: 'AF_STEP_SOL',
    ok: stepOk,
    msg: stepOk ? `AF_STEP=${env.AF_STEP || '?'}（已过 mod）` : `AF_STEP=${env.AF_STEP || '(缺)'} 未进 sol`,
  });

  return checks;
}

/** H3：L2 REQ 变更须留纠偏行且 REQ 含双渠道 */
function scoreChangeL2(root) {
  const checks = [];
  const readmePath = path.join(root, 'atlas', 'README.md');
  let readmeText = '';
  if (fs.existsSync(readmePath)) {
    readmeText = fs.readFileSync(readmePath, 'utf8');
  }
  const hasCorrection = /纠偏[：:]\s*L2/i.test(readmeText);
  checks.push({
    id: 'CHANGE_L2_LINE',
    ok: hasCorrection,
    msg: hasCorrection ? 'README 含纠偏：L2' : 'README 缺纠偏：L2 行',
  });

  const reqDir = path.join(root, 'atlas', 'requirements');
  let reqText = '';
  if (fs.existsSync(reqDir)) {
    for (const n of fs.readdirSync(reqDir)) {
      if (/^REQ-\d+/i.test(n)) {
        reqText += fs.readFileSync(path.join(reqDir, n), 'utf8');
      }
    }
  }
  const changedAc = reqText
    .split(/\r?\n/)
    .find((line) => line.includes('AC-001-01')) || '';
  const dualChannel = /支付宝/.test(changedAc) && /微信/.test(changedAc);
  checks.push({
    id: 'CHANGE_L2_REQ',
    ok: dualChannel,
    msg: dualChannel ? 'AC-001-01 已精确改为微信+支付宝' : 'AC-001-01 未同步双渠道',
  });

  const solRoot = path.join(root, 'atlas', 'solution');
  let solText = '';
  if (fs.existsSync(solRoot)) {
    for (const file of fs.readdirSync(solRoot, { recursive: true })) {
      const rel = String(file);
      const absolute = path.join(solRoot, rel);
      if (fs.existsSync(absolute) && fs.statSync(absolute).isFile() && rel.endsWith('.md')) {
        solText += fs.readFileSync(absolute, 'utf8');
      }
    }
  }
  const solutionSynced = /支付宝/.test(solText) && /微信/.test(solText);
  checks.push({
    id: 'CHANGE_L2_SOL',
    ok: solutionSynced,
    msg: solutionSynced ? 'solution 已同步双渠道影响' : 'solution 未同步支付宝+微信',
  });
  const impactRecorded = /影响(分析|范围|面)/.test(readmeText);
  checks.push({
    id: 'CHANGE_L2_IMPACT',
    ok: impactRecorded,
    msg: impactRecorded ? 'README 已记录影响分析' : 'README 缺影响分析记录',
  });

  return checks;
}

/** 单点场景打分（不做全栈 D1 硬检） */
function runSpotScenario(meta, root, skillRoot, modeId) {
  const checks = [];
  const fail = (id, msg) => checks.push({ id, ok: false, msg });
  const pass = (id, msg) => checks.push({ id, ok: true, msg });

  if (!fs.existsSync(path.join(root, 'atlas'))) fail('ATLAS', '无 atlas/');
  else pass('ATLAS', '有 atlas/');
  const env = readEnv(root);
  const wantDecide = expectedDecide(modeId);
  if (env.AF_DECIDE === wantDecide) pass('DECIDE', `AF_DECIDE=${wantDecide}`);
  else fail('DECIDE', `期望 AF_DECIDE=${wantDecide}，实际 ${env.AF_DECIDE || '(缺)'}`);

  if (meta.scenario === 'model-skip') {
    for (const c of scoreModelSkip(root, skillRoot)) {
      if (c.ok) pass(c.id, c.msg);
      else fail(c.id, c.msg);
    }
  } else if (meta.scenario === 'change-l2') {
    for (const c of scoreChangeL2(root)) {
      if (c.ok) pass(c.id, c.msg);
      else fail(c.id, c.msg);
    }
  }

  return checks;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const modeId = normalizeMode(args.mode);
  if (args.help || !args.root || !modeId) {
    console.log(`用法:
  node scripts/agent-retest/score.mjs --root <复测项目根> [--mode ai|user] [--skill-root <skill>] [--continues N] [--user-sim-rounds N] [--check-af-commands] [--json]

--mode ai|user（默认 ai）：硬检 AF_DECIDE
--continues：ai 模式必须显式提供，且 >0 时 GATE_AUTONOMY 失败
--check-af-commands：额外加严「须含快捷门牌」留痕（E1/E16）；全栈默认已硬检 flow 留痕
--scenario model-skip|change-l2：自动走单点检查（见 agent-retest.meta.json）
`);
    process.exit(args.help ? 0 : 1);
  }

  const wantDecide = expectedDecide(modeId);
  const meta = readMeta(args.root);
  const spotScenario = meta.scenario === 'model-skip' || meta.scenario === 'change-l2';

  if (spotScenario) {
    const checks = runSpotScenario(meta, args.root, args.skillRoot, modeId);
    // change-l2=/af-revise 快捷轨：默认按快捷留痕验；其它单点验 flow 门牌；--check-af-commands 一律加严快捷
    const ac = scoreAfCommands(args.root, {
      expectQuick: meta.scenario === 'change-l2' || Boolean(args.checkAfCommands),
    });
    if (ac.ok) checks.push({ id: 'AF_COMMANDS', ok: true, msg: ac.msg });
    else checks.push({ id: 'AF_COMMANDS', ok: false, msg: ac.msg });
    const failed = checks.filter((c) => !c.ok);
    const report = {
      scoredAt: new Date().toISOString(),
      root: args.root,
      skillRoot: args.skillRoot,
      mode: modeId,
      scenario: meta.scenario,
      spot: true,
      checks,
      passed: failed.length === 0,
      summary: failed.length === 0 ? `PASS：${meta.scenario} 单点` : `FAIL：${failed.length} 项`,
    };
    const logDir = path.join(args.root, 'atlas', 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const outPath = path.join(logDir, 'agent-retest-score.json');
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
    if (args.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`=== Agent 复测打分 · ${report.summary} ===`);
      console.log(`scenario: ${meta.scenario}（单点）`);
      console.log(`root: ${args.root}`);
      for (const c of checks) console.log(`${c.ok ? '✅' : '❌'} [${c.id}] ${c.msg}`);
    }
    process.exit(failed.length === 0 ? 0 : 1);
  }

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

  for (const c of scoreRuntime(args.root)) {
    if (c.ok) pass(c.id, c.msg);
    else fail(c.id, c.msg);
  }

  // 全栈默认硬检留痕（闸门 AF-CMD-* 之外再亮一盏灯）
  {
    const cmdLog = scoreAfCommands(args.root, { expectQuick: Boolean(args.checkAfCommands) });
    if (cmdLog.ok) pass('AF_COMMANDS', cmdLog.msg);
    else fail('AF_COMMANDS', cmdLog.msg);
  }

  if (modeId === 'ai') {
    if (!args.continuesProvided) {
      fail('GATE_AUTONOMY', '未显式传 --continues 0|N，无法证明没有人工续跑');
    } else if (args.continues > 0) {
      fail(
        'GATE_AUTONOMY',
        `考官人工「继续」×${args.continues}——AI 自主本应阻塞式派活同会话循环，不应甩续跑给人`,
      );
    } else {
      pass('GATE_AUTONOMY', '已显式记录 --continues 0，无人工「继续」');
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
    summary: failed.length === 0 ? 'PASS：形柱+AC+收口+留痕+决策维' : `FAIL：${failed.length} 项`,
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

const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) main();

export {
  scoreAfCommands,
  scoreChangeL2,
  scoreModelSkip,
  scoreParallelFlow,
  scoreRuntime,
};
