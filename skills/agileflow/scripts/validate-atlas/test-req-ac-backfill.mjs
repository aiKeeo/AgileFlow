#!/usr/bin/env node
/**
 * REQ-AC 回填：force 收口 vs 仅声称完成后检查
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Reporter } from './lib/reporter.mjs';
import { validateReqAcBackfill } from './lib/rules/requirements.mjs';

let passed = 0;
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

function writeTree(root, files) {
  for (const [rel, body] of Object.entries(files)) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, body);
  }
}

const reqPending = `# REQ-001

| AC ID | 场景 | Given | When | Then（可断言） | 观测面 | AC 测试方法 | 状态 |
|-------|------|-------|------|----------------|--------|-------------|------|
| AC-001-01 | 登录成功 | 用户存在 | 提交 | 返回 token | API | （③ 后填） | ⬜ |
| AC-001-02 | 密码错 | 密码错 | 提交 | 失败 | API | （③ 后填） | ⬜ |
`;

const reqFilled = reqPending
  .replaceAll('（③ 后填）', 'AuthServiceIT#loginOk')
  .replaceAll('| ⬜ |', '| ✅ |');

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-ac-'));
  writeTree(root, {
    'atlas/todo.md': '# todo\n- [ ] 开发实现\n',
    'atlas/requirements/REQ-001-login.md': reqPending,
  });
  const soft = new Reporter();
  validateReqAcBackfill(root, soft, { force: false });
  check('未声称完成 + 非 force → 不拦', soft.passed());

  const hard = new Reporter();
  validateReqAcBackfill(root, hard, { force: true });
  check(
    '未声称完成 + force → 拦 REQ-AC-未回填',
    !hard.passed() && hard.getIssues().some((i) => i.rule === 'REQ-AC-未回填'),
  );
  fs.rmSync(root, { recursive: true, force: true });
}

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-ac-'));
  writeTree(root, {
    'atlas/todo.md': '# todo\n- [x] 开发实现\n开发实现 ✅\n',
    'atlas/requirements/REQ-001-login.md': reqPending,
  });
  const soft = new Reporter();
  validateReqAcBackfill(root, soft, { force: false });
  check('已声称完成 + 非 force → 拦', !soft.passed());
  fs.rmSync(root, { recursive: true, force: true });
}

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-ac-'));
  writeTree(root, {
    'atlas/todo.md': '# todo\n- [x] 开发实现\n',
    'atlas/requirements/REQ-001-login.md': reqFilled,
  });
  const hard = new Reporter();
  validateReqAcBackfill(root, hard, { force: true });
  check('已回填 + force → 绿', hard.passed());
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\nreq-ac-backfill: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
