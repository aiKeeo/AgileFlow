/**
 * af-commands 留痕：CLI 格式 + 闸门只读硬验
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { appendAfCommand, formatLogLine, truncateSummary } from '../../cli/af-log.mjs';
import {
  validateAfCommands,
  isValidAfCommandLine,
} from './lib/rules/af-commands.mjs';
import { Reporter } from './lib/reporter.mjs';
import { runGate } from './lib/workflow.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '../..');
const bin = path.join(skillRoot, 'bin', 'agileflow.mjs');

assert.equal(truncateSummary('一二三四五六七八九十abcdefghij', 15).length, 15);

const line = formatLogLine({
  door: 'af-req',
  summary: '做一个登录API今天就要',
  route: 'req',
  date: '2026-07-23',
});
assert.equal(line, '[/af-req][做一个登录API今天就要][2026-07-23][→req][✅]');
assert.ok(isValidAfCommandLine(line));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-cmd-'));
appendAfCommand(tmp, { door: '/af-req', summary: '测', route: 'req', date: '2026-07-23' });
const repEmpty = new Reporter();
validateAfCommands(tmp, repEmpty, { gateId: 'req-confirm' });
assert.equal(repEmpty.passed(), true, '有合法 /af-req 行应过 req-confirm');

const repWrong = new Reporter();
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'af-cmd2-'));
fs.mkdirSync(path.join(tmp2, 'atlas', 'logs'), { recursive: true });
fs.writeFileSync(path.join(tmp2, 'atlas', 'logs', 'af-commands.md'), '[/af-fix][typo][2026-07-23][→fix][✅]\n');
validateAfCommands(tmp2, repWrong, { gateId: 'req-confirm' });
assert.equal(repWrong.passed(), false, '仅 /af-fix 不应过 req-confirm');
assert.ok(repWrong.getIssues().some((i) => i.rule === 'AF-CMD-NO-STEP'));

// 仅裸 /af 不能冒充 req-confirm（防「一口气连做只写入口一行」）
const tmpAfOnly = fs.mkdtempSync(path.join(os.tmpdir(), 'af-cmd-afonly-'));
fs.mkdirSync(path.join(tmpAfOnly, 'atlas', 'logs'), { recursive: true });
fs.writeFileSync(
  path.join(tmpAfOnly, 'atlas', 'logs', 'af-commands.md'),
  '[/af][减肥小程序入口][2026-07-23][→req][✅]\n',
);
const repAfOnly = new Reporter();
validateAfCommands(tmpAfOnly, repAfOnly, { gateId: 'req-confirm' });
assert.equal(repAfOnly.passed(), false, '裸 /af 不应过 req-confirm');
assert.ok(repAfOnly.getIssues().some((i) => i.rule === 'AF-CMD-NO-STEP'));

const r = spawnSync(process.execPath, [bin, 'log', '/af-sol', '方案完成', '--route', 'sol', '--root', tmp], {
  encoding: 'utf8',
});
assert.equal(r.status, 0, r.stderr || r.stdout);
const body = fs.readFileSync(path.join(tmp, 'atlas', 'logs', 'af-commands.md'), 'utf8');
assert.ok(body.includes('[/af-sol]'), 'CLI 追加 /af-sol');

// 空项目 gate：只读失败，不得自动制造一条 ✅ 留痕
const emptyProj = fs.mkdtempSync(path.join(os.tmpdir(), 'af-cmd-gate-'));
fs.mkdirSync(path.join(emptyProj, 'atlas'), { recursive: true });
const gate = runGate('req-confirm', { projectRoot: emptyProj });
assert.equal(gate.passed, false);
assert.ok(
  gate.reporter.getIssues().some((i) => String(i.rule).startsWith('AF-CMD')),
  '缺显式留痕时须 AF-CMD-*',
);
assert.ok(
  !fs.existsSync(path.join(emptyProj, 'atlas', 'logs', 'af-commands.md')),
  'gate 不得边验边写 af-commands.md',
);

console.log('af-commands tests passed');
