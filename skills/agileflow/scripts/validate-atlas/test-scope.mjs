#!/usr/bin/env node
/**
 * flow 管辖边界（scope.mjs）冒烟
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateFlowScope, normalizeStepIdForFlow } from './lib/scope.mjs';
import { validateFlowFile } from './lib/flow.mjs';
import { Reporter } from './lib/reporter.mjs';
import { buildBody } from '../../cli/workflows/_skeleton.mjs';
import { BUILTIN_CATALOG } from '../../cli/catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let failed = 0;
function check(name, cond) {
  if (!cond) {
    console.error(`FAIL ${name}`);
    failed += 1;
  } else {
    console.log(`ok   ${name}`);
  }
}

check('normalize af-tests', normalizeStepIdForFlow('af-tests') === 'af-test');
check('normalize af-model', normalizeStepIdForFlow('af-model') === 'af-mod');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-scope-'));
const atlas = path.join(tmp, 'atlas');
fs.mkdirSync(atlas, { recursive: true });

fs.writeFileSync(
  path.join(atlas, 'flow.yaml'),
  `version: 1
steps:
  - id: af-req
    mode: strict
    prompt: req
    depends: []
    outputs: [atlas/requirements/]
  - id: af-test
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/tests/]
`,
);
fs.writeFileSync(
  path.join(atlas, 'agileflow.env'),
  `AF_DECIDE=ai
AF_TIER=full
AF_PHASE=1
AF_STEP=af-init
AF_STACK_SOURCE=pending
AF_TEMPLATE=no
AF_HOST_CAPABILITY=full
`,
);
fs.writeFileSync(
  path.join(atlas, 'agileflow-dispatch.json'),
  JSON.stringify(
    {
      version: 1,
      mode: 'normal',
      entries: [
        {
          at: '2026-07-23T00:00:00.000Z',
          phase: '1',
          role: 'req',
          stepId: 'af-init',
          gate: 'req-confirm',
          subagentId: '00000000-0000-4000-8000-000000000001',
          taskId: null,
          paths: ['atlas/requirements/REQ-001.md'],
        },
      ],
    },
    null,
    2,
  ) + '\n',
);

const issues = validateFlowScope(tmp);
check(
  'AF-ENV-STEP-DRIFT on af-init',
  issues.some((i) => i.rule === 'AF-ENV-STEP-DRIFT' && String(i.message).includes('af-init')),
);
check(
  'ORCH-STEP-NOT-IN-FLOW on af-init ledger',
  issues.some((i) => i.rule === 'ORCH-STEP-NOT-IN-FLOW' && String(i.message).includes('af-init')),
);
check(
  'alias af-tests normalizes to af-test in flow',
  normalizeStepIdForFlow('af-tests') === 'af-test' &&
    !validateFlowScope(
      (() => {
        const t2 = fs.mkdtempSync(path.join(os.tmpdir(), 'af-scope-a-'));
        fs.mkdirSync(path.join(t2, 'atlas'), { recursive: true });
        fs.writeFileSync(
          path.join(t2, 'atlas', 'flow.yaml'),
          `version: 1
steps:
  - id: af-test
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/tests/]
`,
        );
        fs.writeFileSync(
          path.join(t2, 'atlas', 'agileflow-dispatch.json'),
          JSON.stringify({
            version: 1,
            mode: 'normal',
            entries: [{ stepId: 'af-tests', subagentId: 'x', role: 'orch-direct', paths: [] }],
          }),
        );
        return t2;
      })(),
    ).some((i) => i.rule === 'ORCH-STEP-NOT-IN-FLOW'),
);

fs.writeFileSync(
  path.join(atlas, 'agileflow.env'),
  `AF_DECIDE=ai
AF_TIER=full
AF_PHASE=5
AF_STEP=af-test
AF_STACK_SOURCE=pending
AF_TEMPLATE=no
AF_HOST_CAPABILITY=full
`,
);
fs.writeFileSync(
  path.join(atlas, 'agileflow-dispatch.json'),
  JSON.stringify(
    {
      version: 1,
      mode: 'normal',
      entries: [
        {
          at: '2026-07-23T00:00:00.000Z',
          phase: '5',
          role: 'orch-direct',
          stepId: 'af-test',
          gate: 'test-entry',
          subagentId: 'orch-direct',
          taskId: null,
          paths: ['atlas/tests/README.md'],
        },
      ],
    },
    null,
    2,
  ) + '\n',
);
const okIssues = validateFlowScope(tmp);
check('valid stepId+AF_STEP no scope errors', okIssues.length === 0);

// 门牌正文 scope 隔离
const fixEntry = BUILTIN_CATALOG.find((e) => e.id === 'af-fix');
const reqEntry = BUILTIN_CATALOG.find((e) => e.id === 'af-req');
const testsEntry = BUILTIN_CATALOG.find((e) => e.id === 'af-tests');
const fixBody = buildBody({ entry: fixEntry, l0: 'L0' });
const reqBody = buildBody({ entry: reqEntry, l0: 'L0' });
const testsBody = buildBody({ entry: testsEntry, l0: 'L0' });
check('af-fix body 非 flow', fixBody.includes('非 flow') || fixBody.includes('快捷'));
check('af-fix no dispatch path', !fixBody.includes('agileflow-dispatch.json'));
check('af-req has stepId', reqBody.includes('stepId=`af-req`') || reqBody.includes('stepId=af-req'));
check('af-tests canonical stepId', testsBody.includes('stepId=`af-test`') || testsBody.includes('stepId=af-test'));

// reserved id in flow
const reservedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-scope-r-'));
fs.mkdirSync(path.join(reservedRoot, 'atlas'), { recursive: true });
fs.writeFileSync(
  path.join(reservedRoot, 'atlas', 'flow.yaml'),
  `version: 1
steps:
  - id: af-init
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/init/]
`,
);
const rep = new Reporter();
validateFlowFile(reservedRoot, rep, { requireFile: true });
check(
  'FLOW-ID-RESERVED af-init',
  rep.getIssues().some((i) => i.rule === 'FLOW-ID-RESERVED'),
);

// id: af（万能路由门牌，禁止进 flow steps）
const afReservedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-scope-af-'));
fs.mkdirSync(path.join(afReservedRoot, 'atlas'), { recursive: true });
fs.writeFileSync(
  path.join(afReservedRoot, 'atlas', 'flow.yaml'),
  `version: 1
steps:
  - id: af
    mode: strict
    prompt: null
    depends: []
    outputs: [atlas/logs/]
`,
);
const repAf = new Reporter();
validateFlowFile(afReservedRoot, repAf, { requireFile: true });
check(
  'FLOW-ID-RESERVED af',
  repAf.getIssues().some((i) => i.rule === 'FLOW-ID-RESERVED' && String(i.message).includes('af')),
);

// 闸门路径须拦 ORCH-STEP-NOT-IN-FLOW（非仅 full validate）
const gateFixtureSrc = path.join(__dirname, 'fixtures', 'good-req-custom-role', 'atlas');
const gateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-scope-gate-'));
fs.cpSync(gateFixtureSrc, path.join(gateRoot, 'atlas'), { recursive: true });
const gateLedger = JSON.parse(fs.readFileSync(path.join(gateRoot, 'atlas', 'agileflow-dispatch.json'), 'utf8'));
gateLedger.entries = [
  ...(gateLedger.entries || []),
  {
    at: '2026-07-23T00:00:00.000Z',
    phase: '0',
    role: 'req',
    stepId: 'af-init',
    gate: 'init-confirm',
    subagentId: '00000000-0000-4000-8000-000000000001',
    taskId: null,
    paths: [],
  },
];
fs.writeFileSync(path.join(gateRoot, 'atlas', 'agileflow-dispatch.json'), JSON.stringify(gateLedger, null, 2) + '\n');
const gateCli = path.join(__dirname, '..', 'validate-atlas.mjs');
const gateRun = spawnSync(process.execPath, [gateCli, '--gate', 'req-confirm', '--root', gateRoot], {
  encoding: 'utf8',
});
check(
  'req-confirm gate ORCH-STEP-NOT-IN-FLOW',
  (gateRun.status ?? 1) !== 0 &&
    `${gateRun.stdout || ''}${gateRun.stderr || ''}`.includes('ORCH-STEP-NOT-IN-FLOW'),
);

if (failed) {
  console.error(`\n${failed} scope test(s) failed`);
  process.exit(1);
}
console.log('\nall scope tests passed');
