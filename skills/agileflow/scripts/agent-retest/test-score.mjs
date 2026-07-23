import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  scoreAfCommands,
  scoreChangeL2,
  scoreRuntime,
} from './score.mjs';

function write(root, relativePath, content) {
  const file = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'af-score-'));
write(
  root,
  'atlas/agileflow-dispatch.json',
  JSON.stringify({
    entries: [
      {
        stepId: 'af-req',
        role: 'role-req',
        subagentId: 'agent-1',
        status: 'completed',
      },
    ],
  }),
);

write(root, 'atlas/logs/af-commands.md', '[/af][入口][2026-07-23][→req][✅]\n');
assert.equal(scoreAfCommands(root).ok, false, '裸 /af 不得冒充阶段门牌');

write(
  root,
  'atlas/logs/af-commands.md',
  '[/af-req][闸门自动留痕][2026-07-23][→req][✅]\n',
);
assert.equal(scoreAfCommands(root).ok, false, '自动留痕不得计入评分');

write(root, 'atlas/logs/af-commands.md', '[/af-req][需求完成][2026-07-23][→req][✅]\n');
assert.equal(scoreAfCommands(root).ok, true, '显式本步门牌应通过');
console.log('ok   AF_COMMANDS rejects bare /af and auto evidence');

write(
  root,
  'atlas/requirements/REQ-001-pay.md',
  '| AC-001-01 | Given 用户结算 When 选择渠道 Then 支持微信 | P0 |\n',
);
write(root, 'atlas/solution/features/F-001-pay.md', '支持微信与支付宝。\n');
write(root, 'atlas/README.md', '纠偏：L2\n影响分析：支付渠道。\n');
let changeChecks = scoreChangeL2(root);
assert.equal(changeChecks.find((item) => item.id === 'CHANGE_L2_REQ')?.ok, false);

write(
  root,
  'atlas/requirements/REQ-001-pay.md',
  '| AC-001-01 | Given 用户结算 When 选择渠道 Then 支持微信与支付宝 | P0 |\n',
);
changeChecks = scoreChangeL2(root);
assert.equal(changeChecks.every((item) => item.ok), true);
console.log('ok   change-l2 checks exact AC, solution sync and impact analysis');

const runtimeChecks = scoreRuntime(root);
assert.equal(runtimeChecks[0]?.id, 'RUNTIME_RUN');
assert.equal(runtimeChecks[0]?.ok, false, '零 Runtime 不得通过全栈评分');
console.log('ok   full-stack Runtime score rejects a zero-Run project');

console.log('\nall agent-retest score tests passed');
