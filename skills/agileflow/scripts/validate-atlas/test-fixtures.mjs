#!/usr/bin/env node
/**
 * fixtures 回归测试（在 skill 内运行）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { detectBrownfield } from './lib/brownfield.mjs';
import { resolveSkillRoot, resolveValidateScript } from './lib/skill-path.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', '..');
const cli = path.join(skillRoot, 'scripts', 'validate-atlas.mjs');
const fixtures = path.join(__dirname, 'fixtures');

const cases = [
  {
    name: 'bad-flat-todo → 开发完成格式',
    args: ['--root', path.join(fixtures, 'bad-flat-todo'), '--only', 'todo'],
    fail: true,
  },
  {
    name: 'bad-thin-dev → 字面量校验',
    args: ['--root', path.join(fixtures, 'bad-thin-dev'), '--only', 'dev'],
    fail: true,
  },
  {
    name: 'good-dev 字面量+九段',
    args: ['--dev-file', path.join(fixtures, 'good-dev/atlas/dev/T-001-login-BE.md')],
    fail: false,
  },
  {
    name: 'good-dev 空九 → runnable 应失败',
    args: ['--root', path.join(fixtures, 'good-dev'), '--only', 'runnable'],
    fail: true,
  },
  {
    name: 'good-runnable → runnable 应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'runnable'],
    fail: false,
  },
  {
    name: 'bad-no-smoke → smoke 应失败',
    args: ['--root', path.join(fixtures, 'bad-no-smoke'), '--only', 'smoke'],
    fail: true,
  },
  {
    name: 'good-runnable → smoke 应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'smoke'],
    fail: false,
  },
  {
    name: 'list-gates',
    args: ['--list-gates'],
    fail: false,
  },
  {
    name: 'print-skill-root',
    args: ['--print-skill-root'],
    fail: false,
  },
  {
    name: 'bad-no-pixel → 有强制原型无报告应失败',
    args: ['--root', path.join(fixtures, 'bad-no-pixel'), '--only', 'pixel'],
    fail: true,
  },
  {
    name: 'good-pixel → report PASS 应通过',
    args: ['--root', path.join(fixtures, 'good-pixel'), '--only', 'pixel'],
    fail: false,
  },
  {
    name: 'bad-stale-pixel → 未覆盖全部强制原型应失败',
    args: ['--root', path.join(fixtures, 'bad-stale-pixel'), '--only', 'pixel'],
    fail: true,
  },
  {
    name: 'orphan-proto-only → 目录散图不挡门',
    args: ['--root', path.join(fixtures, 'orphan-proto-only'), '--only', 'pixel'],
    fail: false,
  },
];

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

for (const c of cases) {
  const result = spawnSync(process.execPath, [cli, ...c.args], {
    encoding: 'utf8',
    cwd: skillRoot,
  });
  const exitCode = result.status ?? 1;
  const good = c.fail ? exitCode !== 0 : exitCode === 0;
  if (good) {
    console.log(`✅ ${c.name}`);
    passed++;
  } else {
    console.log(`❌ ${c.name} (exit=${exitCode})`);
    if (result.stderr) console.log(result.stderr.slice(0, 400));
    if (result.stdout) console.log(result.stdout.slice(0, 400));
    failed++;
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'af-bf-'));
try {
  fs.mkdirSync(path.join(tmp, 'packages'), { recursive: true });
  check('空 packages/ → greenfield', detectBrownfield(tmp) === false);

  fs.writeFileSync(path.join(tmp, 'packages', 'app.ts'), 'export {}\n');
  check('packages 内有 .ts → brownfield', detectBrownfield(tmp) === true);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

check(
  'skill-path 可解析 validate 脚本',
  fs.existsSync(resolveValidateScript(skillRoot)) &&
    resolveSkillRoot(skillRoot).replace(/\\/g, '/').includes('agileflow')
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
