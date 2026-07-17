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
    name: 'bad-fake-checkboxes → 空跑勾①②③应失败',
    args: ['--root', path.join(fixtures, 'bad-fake-checkboxes'), '--only', 'todo'],
    fail: true,
    assertStdout: 'TODO-CHECK-①无文件',
  },
  {
    name: 'bad-fake-checkboxes → 假开发完成应失败',
    args: ['--root', path.join(fixtures, 'bad-fake-checkboxes'), '--only', 'todo'],
    fail: true,
    assertStdout: 'TODO-CHECK-',
  },
  {
    name: 'good-runnable → todo 勾选证据应通过',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'todo'],
    fail: false,
  },
  {
    name: 'bad-req-uid-missing → UID 断链应失败',
    args: ['--root', path.join(fixtures, 'bad-req-uid-missing'), '--only', 'req'],
    fail: true,
    assertStdout: 'REQ-UID-断链',
  },
  {
    name: 'bad-thin-dev → 字面量校验',
    args: ['--root', path.join(fixtures, 'bad-thin-dev'), '--only', 'dev'],
    fail: true,
  },
  {
    name: 'good-runnable → dev 多文件应通过（防 filePath 回归）',
    args: ['--root', path.join(fixtures, 'good-runnable'), '--only', 'dev'],
    fail: false,
  },
  {
    name: 'good-dev 字面量+段结构',
    args: ['--dev-file', path.join(fixtures, 'good-dev/atlas/dev/T-001-login-BE.md')],
    fail: false,
  },
  {
    name: 'bad-dev-no-purpose → 步骤缺用户/系统/改应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-dev-no-purpose/atlas/dev/T-001-login-BE.md')],
    fail: true,
  },
  {
    name: 'bad-dev-paste-api → 契约粘贴 JSON 应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-dev-paste-api/atlas/dev/T-001-login-BE.md')],
    fail: true,
  },
  {
    name: 'bad-full-no-flow-table → 完整档 hash 模式应失败',
    args: ['--dev-file', path.join(fixtures, 'bad-full-no-flow-table/atlas/dev/T-001-login-BE.md'), '--tier', 'full'],
    fail: true,
    assertStdout: 'DEV-STEP-FULL-须步骤表',
  },
  {
    name: 'good-full-flow-table → 完整档 flow 模式应通过',
    args: ['--dev-file', path.join(fixtures, 'good-full-flow-table/atlas/dev/T-001-login-BE.md'), '--tier', 'full'],
    fail: false,
  },
  {
    name: 'good-dev 空结果 → runnable 应失败',
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
    name: 'good-pixel → ui/README 索引不误判为 UID',
    args: ['--root', path.join(fixtures, 'good-pixel'), '--only', 'req'],
    fail: false,
  },
  {
    name: 'bad-stale-pixel → 未覆盖全部强制原型应失败',
    args: ['--root', path.join(fixtures, 'bad-stale-pixel'), '--only', 'pixel'],
    fail: true,
  },
  {
    name: 'orphan-proto-only → 目录散图不阻塞闸门',
    args: ['--root', path.join(fixtures, 'orphan-proto-only'), '--only', 'pixel'],
    fail: false,
  },
  {
    name: 'good-sol-confirm → 阶段3有T无dev 应通过',
    args: ['--root', path.join(fixtures, 'good-sol-confirm'), '--gate', 'sol-confirm'],
    fail: false,
  },
  {
    name: 'bad-sol-user-pending → user未问栈应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-user-pending'), '--gate', 'sol-confirm'],
    fail: true,
  },
  {
    name: 'good-sol-confirm → 仅 af-env 应通过',
    args: ['--root', path.join(fixtures, 'good-sol-confirm'), '--only', 'af-env', '--phase', '3'],
    fail: false,
  },
  {
    name: 'bad-sol-f-card → F 联调卡应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-f-card'), '--only', 'sol'],
    fail: true,
  },
  {
    name: 'bad-sol-ui-no-bind → UI 缺字段绑定应失败',
    args: ['--root', path.join(fixtures, 'bad-sol-ui-no-bind'), '--only', 'sol'],
    fail: true,
  },
  {
    name: 'good-template-minimal → req 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'req'],
    fail: false,
  },
  {
    name: 'good-template-minimal → dev 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'dev'],
    fail: false,
  },
  {
    name: 'good-template-minimal → dir phase3 无 features 应通过',
    args: ['--root', path.join(fixtures, 'good-template-minimal'), '--only', 'dir', '--phase', '3'],
    fail: false,
  },
  {
    name: 'bad-dual-check → 仅 TMPL 无 legacy REQ-F',
    args: ['--root', path.join(fixtures, 'bad-dual-check'), '--only', 'req'],
    fail: true,
    assertStdout: 'TMPL-AC-BULLET',
    assertNotStdout: 'REQ-F005',
  },
  {
    name: 'good-template-standard → sol 应通过',
    args: ['--root', path.join(fixtures, 'good-template-standard'), '--only', 'sol'],
    fail: false,
  },
  {
    name: 'bad-template-dev-no-anchor → dev 缺锚点应失败',
    args: ['--root', path.join(fixtures, 'bad-template-dev-no-anchor'), '--only', 'dev'],
    fail: true,
    assertStdout: 'TMPL-DEV-CHANGE',
  },
  {
    name: 'bad-skip-code → 有业务码无 architecture 应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'anti-skip'],
    fail: true,
    assertStdout: 'SKIP-CODE-无architecture',
  },
  {
    name: 'bad-skip-code → README 冒充 T 应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'anti-skip'],
    fail: true,
    assertStdout: 'SKIP-README冒充T',
  },
  {
    name: 'bad-skip-code → anti-skip 闸门应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--gate', 'anti-skip'],
    fail: true,
    assertStdout: 'SKIP-',
  },
  {
    name: 'bad-skip-code → README 揉方案应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'sol'],
    fail: true,
    assertStdout: 'SOL-README-MASH',
  },
  {
    name: 'bad-skip-code → 假测试进度应失败',
    args: ['--root', path.join(fixtures, 'bad-skip-code'), '--only', 'anti-skip'],
    fail: true,
    assertStdout: 'SKIP-测试',
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
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  let good = c.fail ? exitCode !== 0 : exitCode === 0;
  if (good && c.assertStdout && !out.includes(c.assertStdout)) good = false;
  if (good && c.assertNotStdout && out.includes(c.assertNotStdout)) good = false;
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

  fs.mkdirSync(path.join(tmp, 'atlas', 'init'), { recursive: true });
  check('空 atlas/init/ → greenfield', detectBrownfield(tmp) === false);

  fs.writeFileSync(path.join(tmp, 'atlas', 'init', 'README.md'), '# init\n');
  check('有 atlas/init/README.md → brownfield', detectBrownfield(tmp) === true);

  fs.rmSync(path.join(tmp, 'atlas'), { recursive: true, force: true });
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
