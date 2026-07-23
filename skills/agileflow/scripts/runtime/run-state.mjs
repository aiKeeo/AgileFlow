import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadFlow, listFlowSteps, parseAfStep } from '../validate-atlas/lib/flow.mjs';
import {
  appendJsonLine,
  atomicWriteJson,
  readJson,
  sha256,
  stableStringify,
  withStateLock,
} from './io.mjs';
import { STEP_EXIT_GATE } from './gates.mjs';
import { projectRunToEnv } from './env-projection.mjs';

export const CURRENT_STATE_REL = path.join('atlas', 'state', 'current.json');

function validateChangeId(changeId) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(changeId)) {
    throw new Error('change id 须为 1–64 位小写字母、数字或连字符');
  }
}

function newRunId(now = new Date()) {
  const stamp = now.toISOString().replace(/[-:.]/g, '');
  return `run-${stamp}-${crypto.randomBytes(3).toString('hex')}`;
}

export function runDir(projectRoot, runId) {
  if (!/^run-[a-zA-Z0-9-]{1,96}$/.test(String(runId))) {
    throw new Error(`非法 runId：${runId}`);
  }
  return path.join(projectRoot, 'atlas', 'runs', runId);
}

export function runFile(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'run.json');
}

export function eventsFile(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'events.jsonl');
}

export function loadCurrentPointer(projectRoot) {
  return readJson(path.join(projectRoot, CURRENT_STATE_REL), null);
}

export function loadRun(projectRoot, runId) {
  return readJson(runFile(projectRoot, runId), null);
}

export function loadActiveRun(projectRoot) {
  const pointer = loadCurrentPointer(projectRoot);
  if (!pointer?.runId) return null;
  const run = loadRun(projectRoot, pointer.runId);
  if (!run || !['active', 'waiting-user', 'blocked'].includes(run.status)) return null;
  return run;
}

export function startRun(projectRoot, options) {
  const changeId = String(options.changeId || '').trim();
  validateChangeId(changeId);

  return withStateLock(projectRoot, () => {
    const current = loadActiveRun(projectRoot);
    if (current) {
      throw new Error(`已有 active Run：${current.runId}（change=${current.changeId}）`);
    }
    const loaded = loadFlow(projectRoot);
    if (!loaded.ok || !loaded.flow) {
      throw new Error('启动 Run 前须存在有效的 atlas/flow.yaml');
    }
    const steps = listFlowSteps(loaded.flow).filter((step) => !step.skip);
    if (steps.length === 0) throw new Error('flow.yaml 没有可执行步骤');
    const requestedStep = options.stepId ? String(options.stepId) : steps[0].id;
    if (!steps.some((step) => step.id === requestedStep)) {
      throw new Error(`起始 step 不在当前 flow：${requestedStep}`);
    }
    const at = options.at || new Date().toISOString();
    const runId = options.runId || newRunId(new Date(at));
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    const flowDigest = sha256(fs.readFileSync(flowPath));
    const run = {
      schemaVersion: 2,
      runId,
      changeId,
      profile: options.profile || 'standard',
      flowDigest,
      status: 'active',
      currentStep: [requestedStep],
      decisionMode: options.decisionMode || 'user',
      revision: 1,
      startedAt: at,
      updatedAt: at,
      enabledSteps: steps.map((step) => step.id),
      steps: {
        [requestedStep]: {
          status: 'ready',
          attempt: 1,
          updatedAt: at,
        },
      },
    };
    const pointer = {
      schemaVersion: 2,
      runId,
      changeId,
      revision: run.revision,
      updatedAt: at,
    };
    atomicWriteJson(runFile(projectRoot, runId), run);
    atomicWriteJson(path.join(projectRoot, CURRENT_STATE_REL), pointer);
    atomicWriteJson(path.join(projectRoot, 'atlas', 'changes', `${changeId}.json`), {
      schemaVersion: 2,
      changeId,
      title: options.title || changeId,
      profile: run.profile,
      status: 'active',
      activeRunId: runId,
      createdAt: at,
      updatedAt: at,
    });
    appendJsonLine(eventsFile(projectRoot, runId), {
      schemaVersion: 2,
      event: 'run.started',
      runId,
      changeId,
      stepId: requestedStep,
      at,
    });
    projectRunToEnv(projectRoot, run);
    return run;
  });
}

export async function advanceActiveRun(projectRoot, nextWave, options = {}) {
  const wave = Array.isArray(nextWave) ? nextWave : parseAfStep(String(nextWave || ''));
  if (wave.length === 0) throw new Error('下一步不能为空');
  const { runtimeGateStatus } = await import('./receipts.mjs');
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) return null;
    const loaded = loadFlow(projectRoot);
    if (!loaded.ok || !loaded.flow) throw new Error('无法加载 atlas/flow.yaml');
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    if (sha256(fs.readFileSync(flowPath)) !== run.flowDigest) {
      throw new Error('当前 flow 已变化；须 abandon 旧 Run 后新开 Run');
    }
    const enabled = new Set(
      listFlowSteps(loaded.flow).filter((step) => !step.skip).map((step) => step.id),
    );
    const unknown = wave.filter((stepId) => !enabled.has(stepId));
    if (unknown.length > 0) throw new Error(`下一步不在当前启用 flow：${unknown.join(',')}`);
    const at = options.at || new Date().toISOString();
    const previous = [...run.currentStep];
    if (options.forced) {
      if (!String(options.reason || '').trim()) {
        throw new Error('advance --force 必须提供 reason（会记入 events，禁止无因强制）');
      }
    } else {
      for (const stepId of previous) {
        const gateId = STEP_EXIT_GATE[stepId];
        if (!gateId) continue;
        const status = runtimeGateStatus(projectRoot, gateId);
        if (!status.valid) {
          throw new Error(
            `前进离开 ${stepId} 须有当前 Runtime ${gateId} PASS（原因：${status.reason}）`,
          );
        }
      }
    }
    for (const stepId of previous) {
      const prior = run.steps[stepId] || { attempt: 1 };
      run.steps[stepId] = { ...prior, status: 'passed', updatedAt: at };
    }
    for (const stepId of wave) {
      const prior = run.steps[stepId];
      run.steps[stepId] = {
        status: 'ready',
        attempt: prior?.status === 'invalidated' ? Number(prior.attempt || 0) + 1 : Number(prior?.attempt || 1),
        updatedAt: at,
      };
    }
    run.currentStep = wave;
    run.revision += 1;
    run.updatedAt = at;
    atomicWriteJson(runFile(projectRoot, run.runId), run);
    atomicWriteJson(path.join(projectRoot, CURRENT_STATE_REL), {
      schemaVersion: 2,
      runId: run.runId,
      changeId: run.changeId,
      revision: run.revision,
      updatedAt: at,
    });
    appendJsonLine(eventsFile(projectRoot, run.runId), {
      schemaVersion: 2,
      event: 'step.advanced',
      runId: run.runId,
      from: previous,
      to: wave,
      forced: Boolean(options.forced),
      reason: options.forced ? String(options.reason).trim() : null,
      at,
    });
    projectRunToEnv(projectRoot, run);
    return run;
  });
}

export function rewindActiveRun(projectRoot, targetStep, options = {}) {
  if (!String(options.reason || '').trim()) throw new Error('rewind 必须提供 reason');

  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) throw new Error('没有 active Run');
    const loaded = loadFlow(projectRoot);
    if (!loaded.ok || !loaded.flow) throw new Error('无法加载 atlas/flow.yaml');
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    if (sha256(fs.readFileSync(flowPath)) !== run.flowDigest) {
      throw new Error('当前 flow 已变化；须 abandon 旧 Run 后新开 Run');
    }
    const ordered = listFlowSteps(loaded.flow).map((step) => step.id);
    const targetIndex = ordered.indexOf(targetStep);
    if (targetIndex < 0) throw new Error(`回退目标不在当前 flow：${targetStep}`);
    // rewind 只能回退：禁止用 rewind「前进」（会冲掉血缘、把前序步卡在 ready）
    const currentIndices = run.currentStep
      .map((stepId) => ordered.indexOf(stepId))
      .filter((index) => index >= 0);
    if (currentIndices.length === 0) {
      throw new Error('当前 Run 无有效 currentStep，无法 rewind');
    }
    const currentFront = Math.min(...currentIndices);
    if (targetIndex > currentFront) {
      throw new Error(
        `rewind 只能回到当前步或更早（当前：${run.currentStep.join(',')}；目标：${targetStep}）。前进请用 advance / step sync，禁止 rewind 向前跳。`,
      );
    }
    const at = options.at || new Date().toISOString();
    const previous = [...run.currentStep];
    for (const [stepId, state] of Object.entries(run.steps || {})) {
      const index = ordered.indexOf(stepId);
      if (index >= targetIndex) {
        run.steps[stepId] = { ...state, status: 'invalidated', updatedAt: at };
      }
    }
    const prior = run.steps[targetStep] || {};
    run.steps[targetStep] = {
      ...prior,
      status: 'ready',
      attempt: Number(prior.attempt || 0) + 1,
      updatedAt: at,
    };
    run.currentStep = [targetStep];
    run.revision += 1;
    run.updatedAt = at;
    atomicWriteJson(runFile(projectRoot, run.runId), run);
    atomicWriteJson(path.join(projectRoot, CURRENT_STATE_REL), {
      schemaVersion: 2,
      runId: run.runId,
      changeId: run.changeId,
      revision: run.revision,
      updatedAt: at,
    });
    const artifactPath = path.join(runDir(projectRoot, run.runId), 'artifacts.json');
    const artifacts = readJson(artifactPath, null);
    if (artifacts?.items) {
      for (const item of artifacts.items) {
        if (item.status !== 'valid') continue;
        const index = ordered.indexOf(item.stepId);
        if (index >= targetIndex) {
          item.status = 'invalidated';
          item.invalidatedAt = at;
          item.invalidatedReason = String(options.reason).trim();
        }
      }
      atomicWriteJson(artifactPath, artifacts);
    }
    appendJsonLine(eventsFile(projectRoot, run.runId), {
      schemaVersion: 2,
      event: 'step.rewound',
      runId: run.runId,
      from: previous,
      to: [targetStep],
      reason: String(options.reason).trim(),
      at,
    });
    projectRunToEnv(projectRoot, run);
    return run;
  });
}

export async function completeActiveRun(projectRoot, options = {}) {
  const { runtimeGateStatus } = await import('./receipts.mjs');
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) throw new Error('没有 active Run');
    const loaded = loadFlow(projectRoot);
    if (!loaded.ok || !loaded.flow) throw new Error('无法加载 atlas/flow.yaml');
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    if (sha256(fs.readFileSync(flowPath)) !== run.flowDigest) {
      throw new Error('当前 flow 已变化；须 abandon 旧 Run 后新开 Run');
    }
    const enabled = listFlowSteps(loaded.flow).filter((step) => !step.skip).map((step) => step.id);
    const terminal = enabled.at(-1);
    if (!terminal || !run.currentStep.includes(terminal)) {
      throw new Error(`Run 仅可在最终启用步完成（当前：${run.currentStep.join(',')}；最终：${terminal || '无'}）`);
    }
    const missingLineage = enabled.filter(
      (stepId) => !run.currentStep.includes(stepId) && run.steps?.[stepId]?.status !== 'passed',
    );
    if (missingLineage.length > 0) {
      throw new Error(`Run 缺少已通过的步骤：${missingLineage.join(',')}`);
    }
    for (const stepId of run.currentStep) {
      const gateId = STEP_EXIT_GATE[stepId];
      if (!gateId) continue;
      const status = runtimeGateStatus(projectRoot, gateId);
      if (!status.valid) {
        throw new Error(`完成 Run 前须有当前 ${gateId} PASS（原因：${status.reason}）`);
      }
    }
    const at = options.at || new Date().toISOString();
    for (const stepId of run.currentStep) {
      const prior = run.steps[stepId] || { attempt: 1 };
      run.steps[stepId] = { ...prior, status: 'passed', updatedAt: at };
    }
    run.status = 'completed';
    run.completedAt = at;
    run.updatedAt = at;
    run.revision += 1;
    atomicWriteJson(runFile(projectRoot, run.runId), run);
    atomicWriteJson(path.join(projectRoot, CURRENT_STATE_REL), {
      schemaVersion: 2,
      runId: run.runId,
      changeId: run.changeId,
      revision: run.revision,
      updatedAt: at,
    });
    const changePath = path.join(projectRoot, 'atlas', 'changes', `${run.changeId}.json`);
    const change = readJson(changePath, {});
    atomicWriteJson(changePath, {
      ...change,
      status: 'completed',
      activeRunId: null,
      completedRunId: run.runId,
      updatedAt: at,
    });
    appendJsonLine(eventsFile(projectRoot, run.runId), {
      schemaVersion: 2,
      event: 'run.completed',
      runId: run.runId,
      reason: options.reason || null,
      at,
    });
    return run;
  });
}

export function abandonActiveRun(projectRoot, options = {}) {
  const reason = String(options.reason || '').trim();
  if (!reason) throw new Error('abandon 必须提供 reason');
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) throw new Error('没有 active Run');
    const at = options.at || new Date().toISOString();
    run.status = 'abandoned';
    run.abandonedAt = at;
    run.abandonReason = reason;
    run.updatedAt = at;
    run.revision += 1;
    atomicWriteJson(runFile(projectRoot, run.runId), run);
    atomicWriteJson(path.join(projectRoot, CURRENT_STATE_REL), {
      schemaVersion: 2,
      runId: run.runId,
      changeId: run.changeId,
      revision: run.revision,
      updatedAt: at,
    });
    const changePath = path.join(projectRoot, 'atlas', 'changes', `${run.changeId}.json`);
    const change = readJson(changePath, {});
    atomicWriteJson(changePath, {
      ...change,
      status: 'abandoned',
      activeRunId: null,
      abandonedRunId: run.runId,
      abandonReason: reason,
      updatedAt: at,
    });
    appendJsonLine(eventsFile(projectRoot, run.runId), {
      schemaVersion: 2,
      event: 'run.abandoned',
      runId: run.runId,
      reason,
      at,
    });
    return run;
  });
}

export function runSummary(projectRoot) {
  const run = loadActiveRun(projectRoot);
  if (!run) return { active: false };
  return {
    active: true,
    runId: run.runId,
    changeId: run.changeId,
    profile: run.profile,
    status: run.status,
    currentStep: run.currentStep,
    decisionMode: run.decisionMode,
    revision: run.revision,
    flowDigest: run.flowDigest,
    stateDigest: sha256(stableStringify(run)),
  };
}
