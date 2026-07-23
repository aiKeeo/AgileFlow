import path from 'node:path';
import { parseArgv, assertRootFlag } from './parse-argv.mjs';
import { recordArtifact, scanCurrentStepArtifacts } from '../scripts/runtime/artifacts.mjs';
import {
  abandonActiveRun,
  completeActiveRun,
  rewindActiveRun,
  runSummary,
  startRun,
} from '../scripts/runtime/run-state.mjs';
import { runtimeGateStatus } from '../scripts/runtime/receipts.mjs';

function output(value, json) {
  if (json) console.log(JSON.stringify(value, null, 2));
  else console.log(value);
}

export async function runRuntimeCommand(argv) {
  const action = argv[0];
  const parsed = parseArgv(argv.slice(1));
  const { flags, rest } = parsed;
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  const json = Boolean(flags.json);

  if (action === 'start') {
    const changeId = flags.change === true ? '' : String(flags.change || rest[0] || '');
    const run = startRun(projectRoot, {
      changeId,
      title: flags.title === true ? undefined : flags.title,
      stepId: flags.step === true ? undefined : flags.step,
      profile: flags.profile === true ? undefined : flags.profile,
      decisionMode: flags.decision === true ? undefined : flags.decision,
    });
    output(json ? run : `Run 已启动：${run.runId} | change=${run.changeId} | step=${run.currentStep.join(',')}`, json);
    return;
  }

  if (action === 'status') {
    const summary = runSummary(projectRoot);
    output(
      json
        ? summary
        : summary.active
          ? `Run：${summary.runId} | change=${summary.changeId} | step=${summary.currentStep.join(',')} | revision=${summary.revision}`
          : '当前没有 active Run',
      json,
    );
    return;
  }

  if (action === 'gate-status') {
    const gateId = String(flags.gate || rest[0] || '');
    if (!gateId) throw new Error('gate-status 需要 --gate <id>');
    const status = runtimeGateStatus(projectRoot, gateId);
    output(json ? status : `${gateId}: ${status.valid ? 'PASS' : 'INVALID'} (${status.reason})`, json);
    if (status.active && !status.valid) process.exitCode = 1;
    return;
  }

  if (action === 'rewind') {
    const targetStep = String(flags.to || rest[0] || '');
    const reason = flags.reason === true ? '' : String(flags.reason || '');
    if (!targetStep) throw new Error('rewind 需要 --to <step>');
    const run = rewindActiveRun(projectRoot, targetStep, { reason });
    output(
      json
        ? run
        : `Run 已回退：${run.runId} → ${run.currentStep.join(',')} | attempt=${run.steps[targetStep].attempt}`,
      json,
    );
    return;
  }

  if (action === 'complete') {
    const completed = await completeActiveRun(projectRoot, {
      reason: flags.reason === true ? undefined : flags.reason,
    });
    output(json ? completed : `Run 已完成：${completed.runId}`, json);
    return;
  }

  if (action === 'abandon') {
    const reason = flags.reason === true ? '' : String(flags.reason || '');
    const abandoned = abandonActiveRun(projectRoot, { reason });
    output(json ? abandoned : `Run 已放弃：${abandoned.runId} | reason=${abandoned.abandonReason}`, json);
    return;
  }

  throw new Error('用法: agileflow run start|status|gate-status|rewind|complete|abandon [options]');
}

export async function runArtifactCommand(argv) {
  const action = argv[0];
  const parsed = parseArgv(argv.slice(1));
  const { flags, rest, cmd } = parsed;
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  if (action === 'scan') {
    const items = scanCurrentStepArtifacts(projectRoot);
    if (flags.json) console.log(JSON.stringify({ recorded: items }, null, 2));
    else console.log(`已登记当前 step 产物：${items.length} 个`);
    return;
  }
  if (action !== 'record') {
    throw new Error('用法: agileflow artifact record <path> [...] | artifact scan [--root .]');
  }
  const artifactPath = cmd || rest[0];
  if (!artifactPath) throw new Error('artifact record 需要文件路径');
  const item = recordArtifact(projectRoot, {
    path: artifactPath,
    artifactId: flags.id === true ? undefined : flags.id,
    type: flags.type === true ? undefined : flags.type,
    stepId: flags.step === true ? undefined : flags.step,
  });
  if (flags.json) console.log(JSON.stringify(item, null, 2));
  else console.log(`Artifact 已登记：${item.artifactId}@${item.revision} ${item.digest}`);
}
