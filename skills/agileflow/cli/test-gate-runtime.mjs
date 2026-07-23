import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { effectiveGatePass } from '../scripts/validate-atlas/lib/effective-gate.mjs';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bin = path.join(skillRoot, 'bin', 'agileflow.mjs');
const validator = path.join(skillRoot, 'scripts', 'validate-atlas.mjs');
const fixture = path.join(
  skillRoot,
  'scripts',
  'validate-atlas',
  'fixtures',
  'good-req-custom-role',
);

function run(args) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-gate-runtime-'));
fs.cpSync(fixture, root, { recursive: true });
const legacyReceipt = path.join(root, 'atlas', 'logs', 'af-gate-receipts.md');
const legacyBefore = fs.existsSync(legacyReceipt)
  ? fs.readFileSync(legacyReceipt, 'utf8')
  : null;

let result = run(['run', 'start', '--change', 'gate-authority', '--step', 'af-req', '--root', root]);
assert.equal(result.status, 0, result.stderr || result.stdout);

result = run(['gate', '--gate', 'req-confirm', '--root', root]);
assert.notEqual(result.status, 0, '未 artifact scan 时最终 gate 必须失败');
assert.match(result.stdout + result.stderr, /AGILEFLOW_GATE_RESULT=FAIL/);
assert.match(result.stdout + result.stderr, /no-registered-artifacts/);
assert.doesNotMatch(
  result.stdout + result.stderr,
  /✅ (全部)?校验通过/,
  'wrapper 的 validator 子层不得先打印绿色成功误导 Agent',
);
assert.equal(
  fs.existsSync(legacyReceipt) ? fs.readFileSync(legacyReceipt, 'utf8') : null,
  legacyBefore,
  'active Run 不得创建或修改 legacy MD 回执',
);
console.log('ok   active Run gate rejects missing artifact registry and leaves legacy MD untouched');

result = run(['artifact', 'scan', '--root', root]);
assert.equal(result.status, 0, result.stderr || result.stdout);
result = run(['gate', '--gate', 'req-confirm', '--root', root]);
assert.equal(result.status, 0, result.stderr || result.stdout);
result = run(['run', 'gate-status', '--gate', 'req-confirm', '--json', '--root', root]);
assert.equal(result.status, 0, result.stderr || result.stdout);
assert.equal(JSON.parse(result.stdout).reason, 'pass');
console.log('ok   scan + validator PASS commits a valid Runtime receipt');

const reqPath = path.join(root, 'atlas', 'requirements', 'REQ-001-login.md');
fs.appendFileSync(reqPath, '\nchanged after scan\n', 'utf8');
result = run(['gate', '--gate', 'req-confirm', '--root', root]);
assert.notEqual(result.status, 0, 'dirty registry 不能被重跑 gate 洗白');
assert.match(result.stdout + result.stderr, /artifact-registry-dirty/);
assert.equal(
  effectiveGatePass(root, 'req-confirm').valid,
  false,
  'active Run 下 legacy MD PASS 不得覆盖 dirty Runtime',
);
console.log('ok   dirty registry cannot be re-blessed without a new scan');

const pureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'af-validator-pure-'));
fs.mkdirSync(path.join(pureRoot, 'atlas'), { recursive: true });
result = spawnSync(process.execPath, [validator, '--gate', 'req-confirm', '--root', pureRoot], {
  encoding: 'utf8',
});
assert.notEqual(result.status, 0);
assert.equal(
  fs.existsSync(path.join(pureRoot, 'atlas', 'logs', 'af-commands.md')),
  false,
  'validator 不得自动写 af-commands',
);
assert.equal(
  fs.existsSync(path.join(pureRoot, 'atlas', 'logs', 'af-gate-receipts.md')),
  false,
  'validator 不得写 legacy 回执',
);
console.log('ok   direct validator is read-only');

console.log('\nall gate/runtime integration tests passed');
