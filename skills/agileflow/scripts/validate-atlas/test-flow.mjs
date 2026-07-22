/**
 * flow.yaml 解析与形状校验冒烟
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFlowYaml,
  validateFlowFile,
  isFlowStepSkipped,
  ensureFlowYaml,
  bandForStep,
  nextStep,
  nextEnabledStep,
  listParallelWave,
  resolvePrefixToStepId,
  listFlowCommandIds,
  inferWaveFromFlow,
} from './lib/flow.mjs';
import { isModelingSkipped } from './lib/modeling-skip.mjs';
import { Reporter } from './lib/reporter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');
const templateFlow = path.join(skillRoot, 'templates', 'flow.yaml');

let failed = 0;
function check(name, cond) {
  if (!cond) {
    console.error(`FAIL ${name}`);
    failed += 1;
  } else {
    console.log(`ok   ${name}`);
  }
}

const text = fs.readFileSync(templateFlow, 'utf8');
const flow = parseFlowYaml(text);
check('parse version', flow.version === 1);
check('parse 5 steps', Array.isArray(flow.steps) && flow.steps.length === 5);
check('req prompt', flow.steps[0].id === 'req' && flow.steps[0].prompt === 'req');
check('model orch', flow.steps[1].mode === 'orch' && flow.steps[1].criteria.length >= 4);
check('test prompt null', flow.steps[4].id === 'test' && flow.steps[4].prompt === null);
check('sol has depends', flow.steps[2].depends.includes('atlas/model/'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-flow-'));
const atlas = path.join(tmp, 'atlas');
fs.mkdirSync(path.join(atlas, 'role'), { recursive: true });
for (const k of ['req', 'model', 'sol', 'dev']) {
  fs.writeFileSync(path.join(atlas, 'role', `role-${k}.md`), `# role-${k}\n`);
}
ensureFlowYaml(tmp, skillRoot);
check('ensure created', fs.existsSync(path.join(atlas, 'flow.yaml')));

const reporter = new Reporter();
validateFlowFile(tmp, reporter, { requireFile: true });
if (reporter.errorCount() > 0) {
  console.error(reporter.getIssues().filter((i) => i.severity === 'error'));
}
check('validate default shape', reporter.errorCount() === 0);

const skipFlow = `
version: 1
steps:
  - id: model
    mode: orch
    prompt: model
    criteria:
      - "c1"
    depends: []
    outputs:
      - atlas/model/
    skip: true
    reason: "无新实体"
`;
fs.writeFileSync(path.join(atlas, 'flow.yaml'), skipFlow);
const loadedSkip = parseFlowYaml(skipFlow);
check('skip flag', isFlowStepSkipped(loadedSkip, 'model') === true);
check('isModelingSkipped', isModelingSkipped(tmp) === true);

// 闸门短路
fs.writeFileSync(
  path.join(atlas, 'flow.yaml'),
  `version: 1
steps:
  - id: model
    mode: orch
    prompt: model
    criteria: ["c1"]
    depends: []
    outputs: ["atlas/model/"]
    skip: true
    reason: "skip for gate test"
`,
);
const { runGate } = await import('./lib/workflow.mjs');
const modGate = runGate('mod-confirm', { projectRoot: tmp });
check('mod-confirm skipped by flow', modGate.passed === true && modGate.skippedByFlow === true);

const insertOk = `
version: 1
steps:
  - id: research
    mode: strict
    prompt: null
    depends: []
    outputs:
      - atlas/logs/research-demo.md
    reason: "插入调研"
  - id: req
    mode: strict
    prompt: req
    depends:
      - atlas/agileflow.env
    outputs:
      - atlas/requirements/
`;
fs.writeFileSync(path.join(atlas, 'flow.yaml'), insertOk);
const insertReporter = new Reporter();
validateFlowFile(tmp, insertReporter, { requireFile: true });
check('insert step shape ok', insertReporter.errorCount() === 0);

const insertBad = `
version: 1
steps:
  - id: research
    mode: strict
    prompt: null
    depends: []
    outputs: []
`;
fs.writeFileSync(path.join(atlas, 'flow.yaml'), insertBad);
const badReporter = new Reporter();
validateFlowFile(tmp, badReporter, { requireFile: true });
check(
  'insert without outputs fails',
  badReporter.getIssues().some((i) => i.rule === 'FLOW-INSERT-OUT'),
);

const customFlow = parseFlowYaml(`version: 1
steps:
  - id: research
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/logs/r.md]
  - id: req
    mode: strict
    prompt: req
    depends: []
    outputs: [atlas/requirements/]
  - id: model
    mode: orch
    prompt: model
    criteria: [c1]
    depends: []
    outputs: [atlas/model/]
`);
check('band custom step', bandForStep(customFlow, 'research') === '1');
check('band model', bandForStep(customFlow, 'model') === '2');
check('nextStep research', nextStep(customFlow, 'research') === 'req');
check('nextEnabled skip model', nextEnabledStep({ steps: [{ id: 'a' }, { id: 'model', skip: true }, { id: 'sol' }] }, 'a') === 'sol');

// 并行波：两步 depends 空 → 同波
const parallelRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-wave-'));
fs.mkdirSync(path.join(parallelRoot, 'atlas', 'logs'), { recursive: true });
fs.mkdirSync(path.join(parallelRoot, 'atlas', 'role'), { recursive: true });
for (const k of ['req', 'model', 'sol', 'dev']) {
  fs.writeFileSync(path.join(parallelRoot, 'atlas', 'role', `role-${k}.md`), `# ${k}\n`);
}
const parallelYaml = `version: 1
steps:
  - id: research
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/logs/research.md]
  - id: competitor
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/logs/competitor.md]
  - id: req
    mode: strict
    prompt: req
    depends:
      - atlas/logs/research.md
      - atlas/logs/competitor.md
    outputs: [atlas/requirements/]
`;
fs.writeFileSync(path.join(parallelRoot, 'atlas', 'flow.yaml'), parallelYaml);
const pFlow = parseFlowYaml(parallelYaml);
const wave0 = listParallelWave(parallelRoot, pFlow);
check('parallel wave both ready', wave0.join(',') === 'research,competitor');
check('resolve research prefix', resolvePrefixToStepId(pFlow, 'research') === 'research');
check('resolve mod alias', resolvePrefixToStepId(pFlow, 'mod') === null);
check('commands include research', listFlowCommandIds(pFlow).includes('research'));
fs.writeFileSync(path.join(parallelRoot, 'atlas', 'logs', 'research.md'), '# r\n');
fs.writeFileSync(path.join(parallelRoot, 'atlas', 'logs', 'competitor.md'), '# c\n');
const wave1 = listParallelWave(parallelRoot, pFlow);
check('after both done wave is req', wave1.join(',') === 'req');
const inferred = inferWaveFromFlow(parallelRoot, pFlow);
check('infer wave req', inferred.join(',') === 'req');

const reservedYaml = `version: 1
steps:
  - id: fix
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/logs/x.md]
`;
fs.writeFileSync(path.join(parallelRoot, 'atlas', 'flow.yaml'), reservedYaml);
const reservedReporter = new Reporter();
validateFlowFile(parallelRoot, reservedReporter, { requireFile: true });
check(
  'reserved id fix fails',
  reservedReporter.getIssues().some((i) => i.rule === 'FLOW-ID-RESERVED'),
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall ok');
