import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recordArtifact, scanCurrentStepArtifacts } from '../scripts/runtime/artifacts.mjs';
import {
  abandonActiveRun,
  advanceActiveRun,
  completeActiveRun,
  loadActiveRun,
  rewindActiveRun,
  startRun,
} from '../scripts/runtime/run-state.mjs';
import {
  recordRuntimeGateReceipt,
  runtimeGateStatus,
} from '../scripts/runtime/receipts.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-runtime-'));
fs.mkdirSync(path.join(root, 'atlas', 'requirements'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'atlas', 'flow.yaml'),
  `version: 1
steps:
  - id: af-req
    mode: strict
    prompt: req
    depends: []
    outputs:
      - atlas/requirements/REQ-*.md
  - id: af-sol
    mode: strict
    prompt: sol
    depends:
      - atlas/requirements/REQ-*.md
    outputs:
      - atlas/solution/
`,
  'utf8',
);
const reqPath = path.join(root, 'atlas', 'requirements', 'REQ-001-login.md');
fs.writeFileSync(reqPath, '# Login\n', 'utf8');

const run = startRun(root, {
  changeId: 'login',
  runId: 'run-test-001',
  at: '2026-07-23T00:00:00.000Z',
});
assert.equal(run.currentStep[0], 'af-req');
assert.equal(loadActiveRun(root).runId, 'run-test-001');
console.log('ok   run start creates isolated active state');

const artifact = recordArtifact(root, {
  path: 'atlas/requirements/REQ-001-login.md',
  artifactId: 'REQ-001',
  type: 'requirement',
  at: '2026-07-23T00:01:00.000Z',
});
assert.equal(artifact.runId, 'run-test-001');
console.log('ok   artifact record binds run and digest');

assert.throws(
  () => recordArtifact(root, { path: '../outside.txt', artifactId: 'outside' }),
  /项目根内|越出项目根/,
);
console.log('ok   artifact record rejects paths outside project root');

const scanned = scanCurrentStepArtifacts(root);
const rescanned = scanCurrentStepArtifacts(root);
assert.equal(scanned.length, 1);
assert.equal(rescanned[0].revision, scanned[0].revision);
console.log('ok   artifact scan follows current step outputs and is idempotent');

recordRuntimeGateReceipt(root, {
  gateId: 'req-confirm',
  passed: true,
  validatorVersion: 'test',
  at: '2026-07-23T00:02:00.000Z',
});
assert.equal(runtimeGateStatus(root, 'req-confirm').valid, true);
console.log('ok   current input PASS is valid');

assert.throws(
  () =>
    rewindActiveRun(root, 'af-sol', {
      reason: 'mistaken forward jump',
      at: '2026-07-23T00:02:30.000Z',
    }),
  /只能回到当前步或更早|前进请用 advance/,
);
console.log('ok   rewind rejects forward jumps (must use advance)');

const flowPath = path.join(root, 'atlas', 'flow.yaml');
const originalFlow = fs.readFileSync(flowPath, 'utf8');
fs.appendFileSync(flowPath, '# changed\n', 'utf8');
assert.equal(runtimeGateStatus(root, 'req-confirm').reason, 'flow-stale');
fs.writeFileSync(flowPath, originalFlow, 'utf8');
assert.equal(runtimeGateStatus(root, 'req-confirm').valid, true);
console.log('ok   flow change invalidates PASS');

fs.appendFileSync(reqPath, 'changed\n', 'utf8');
assert.equal(runtimeGateStatus(root, 'req-confirm').reason, 'artifact-registry-dirty');
console.log('ok   artifact change marks the registry dirty');

recordArtifact(root, {
  path: 'atlas/requirements/REQ-001-login.md',
  artifactId: 'REQ-001',
  type: 'requirement',
  at: '2026-07-23T00:03:00.000Z',
});
recordRuntimeGateReceipt(root, {
  gateId: 'req-confirm',
  passed: true,
  validatorVersion: 'test',
  at: '2026-07-23T00:04:00.000Z',
});
recordRuntimeGateReceipt(root, {
  gateId: 'req-confirm',
  passed: false,
  validatorVersion: 'test',
  at: '2026-07-23T00:05:00.000Z',
});
assert.equal(runtimeGateStatus(root, 'req-confirm').reason, 'latest-not-pass');
console.log('ok   latest FAIL overrides historical PASS');

await assert.rejects(
  () => advanceActiveRun(root, ['af-sol'], { at: '2026-07-23T00:05:30.000Z' }),
  /Runtime req-confirm PASS/,
);
console.log('ok   advance validates Runtime proof at the mutation boundary');

await assert.rejects(
  () => advanceActiveRun(root, ['af-sol'], { forced: true, at: '2026-07-23T00:05:40.000Z' }),
  /必须提供 reason/,
);
console.log('ok   forced advance without reason is rejected');

recordRuntimeGateReceipt(root, {
  gateId: 'req-confirm',
  passed: true,
  validatorVersion: 'test',
  at: '2026-07-23T00:06:00.000Z',
});
await advanceActiveRun(root, ['af-sol'], { at: '2026-07-23T00:07:00.000Z' });
assert.equal(loadActiveRun(root).currentStep[0], 'af-sol');
assert.equal(runtimeGateStatus(root, 'req-confirm').valid, true);
assert.equal(runtimeGateStatus(root, 'sol-confirm').reason, 'missing-receipt');
console.log('ok   advance preserves prior proof but next step requires its own receipt');

rewindActiveRun(root, 'af-req', {
  reason: 'requirement changed',
  at: '2026-07-23T00:08:00.000Z',
});
assert.equal(loadActiveRun(root).steps['af-req'].attempt, 2);
assert.equal(runtimeGateStatus(root, 'req-confirm').reason, 'attempt-mismatch');
assert.equal(
  fs
    .readFileSync(path.join(root, 'atlas', 'runs', 'run-test-001', 'artifacts.json'), 'utf8')
    .includes('"status": "invalidated"'),
  true,
);
console.log('ok   rewind increments attempt and invalidates prior receipt/artifact');

await assert.rejects(
  () => completeActiveRun(root, { at: '2026-07-23T00:08:30.000Z' }),
  /最终启用步/,
);
console.log('ok   complete rejects a non-terminal current step');

recordArtifact(root, {
  path: 'atlas/requirements/REQ-001-login.md',
  artifactId: 'REQ-001',
  type: 'requirement',
  at: '2026-07-23T00:08:40.000Z',
});
recordRuntimeGateReceipt(root, {
  gateId: 'req-confirm',
  passed: true,
  validatorVersion: 'test',
  at: '2026-07-23T00:09:00.000Z',
});
await advanceActiveRun(root, ['af-sol'], { at: '2026-07-23T00:09:10.000Z' });
fs.mkdirSync(path.join(root, 'atlas', 'solution'), { recursive: true });
fs.writeFileSync(path.join(root, 'atlas', 'solution', 'README.md'), '# Solution\n', 'utf8');
scanCurrentStepArtifacts(root);
recordRuntimeGateReceipt(root, {
  gateId: 'sol-confirm',
  passed: true,
  validatorVersion: 'test',
  at: '2026-07-23T00:09:30.000Z',
});
assert.equal(
  runtimeGateStatus(root, 'req-confirm').valid,
  true,
  '后续 step 新增 artifact 不得让前序 step-scoped PASS 失效',
);
await completeActiveRun(root, { at: '2026-07-23T00:10:00.000Z' });
assert.equal(loadActiveRun(root), null);
const run2 = startRun(root, {
  changeId: 'login-next',
  runId: 'run-test-002',
  at: '2026-07-23T00:11:00.000Z',
});
assert.equal(run2.runId, 'run-test-002');
assert.equal(runtimeGateStatus(root, 'req-confirm').reason, 'missing-receipt');
console.log('ok   a new Run cannot reuse a prior Run receipt');

abandonActiveRun(root, {
  reason: 'flow changed',
  at: '2026-07-23T00:12:00.000Z',
});
assert.equal(loadActiveRun(root), null);
const run3 = startRun(root, {
  changeId: 'login-third',
  runId: 'run-test-003',
  at: '2026-07-23T00:13:00.000Z',
});
assert.equal(run3.runId, 'run-test-003');
console.log('ok   abandon closes a stale Run and allows a new Run');

console.log('\nall runtime tests passed');
