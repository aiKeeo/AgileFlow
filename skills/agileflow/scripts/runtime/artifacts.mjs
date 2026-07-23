import fs from 'node:fs';
import path from 'node:path';
import {
  atomicWriteJson,
  digestFile,
  readJson,
  resolveProjectFile,
  sha256,
  stableStringify,
  withStateLock,
} from './io.mjs';
import { loadActiveRun, runDir } from './run-state.mjs';
import { loadFlow, listFlowSteps } from '../validate-atlas/lib/flow.mjs';
import { GATE_TO_STEP } from './gates.mjs';

function artifactsFile(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'artifacts.json');
}

export function loadArtifacts(projectRoot, runId) {
  return readJson(artifactsFile(projectRoot, runId), {
    schemaVersion: 2,
    runId,
    items: [],
  });
}

function recordArtifactForRun(projectRoot, run, options) {
    const resolved = resolveProjectFile(projectRoot, options.path);
    const artifactId = String(options.artifactId || path.basename(resolved.relativePath)).trim();
    if (!artifactId) throw new Error('artifact id 不能为空');
    const stepId = String(options.stepId || run.currentStep[0] || '').trim();
    if (!stepId) throw new Error('无法确定 artifact 所属 step');
    const attempt = Number(run.steps?.[stepId]?.attempt || 1);
    const manifest = loadArtifacts(projectRoot, run.runId);
    const previous = manifest.items
      .filter(
        (item) => item.artifactId === artifactId || item.path === resolved.relativePath,
      )
      .sort((a, b) => b.revision - a.revision)[0];
    const currentDigest = digestFile(resolved.absolutePath);
    if (
      previous?.status === 'valid' &&
      previous.path === resolved.relativePath &&
      previous.digest === currentDigest &&
      previous.stepId === stepId &&
      previous.attempt === attempt
    ) {
      return previous;
    }
    const at = options.at || new Date().toISOString();
    const item = {
      artifactId,
      type: options.type || 'document',
      path: resolved.relativePath,
      runId: run.runId,
      stepId,
      attempt,
      revision: Number(previous?.revision || 0) + 1,
      digest: currentDigest,
      status: 'valid',
      recordedAt: at,
    };
    for (const existing of manifest.items) {
      if (
        existing.status === 'valid' &&
        (existing.artifactId === artifactId || existing.path === resolved.relativePath)
      ) {
        existing.status = 'superseded';
        existing.supersededAt = at;
      }
    }
    manifest.items.push(item);
    atomicWriteJson(artifactsFile(projectRoot, run.runId), manifest);
    return item;
}

export function recordArtifact(projectRoot, options) {
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) throw new Error('没有 active Run；先执行 agileflow run start');
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    if (!fs.existsSync(flowPath) || digestFile(flowPath) !== run.flowDigest) {
      throw new Error('当前 flow 已变化；须 abandon 旧 Run 后新开 Run');
    }
    return recordArtifactForRun(projectRoot, run, options);
  });
}

export function runtimeArtifactStatus(projectRoot, gateId) {
  const run = loadActiveRun(projectRoot);
  if (!run) return { active: false, valid: false, reason: 'no-active-run' };
  const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
  if (!fs.existsSync(flowPath)) {
    return { active: true, valid: false, reason: 'flow-missing', runId: run.runId };
  }
  if (digestFile(flowPath) !== run.flowDigest) {
    return { active: true, valid: false, reason: 'flow-stale', runId: run.runId };
  }
  const stepId = GATE_TO_STEP[gateId] || run.currentStep[0];
  const attempt = Number(run.steps?.[stepId]?.attempt || 1);
  const manifest = loadArtifacts(projectRoot, run.runId);
  const valid = manifest.items.filter((item) => item.status === 'valid');
  const currentStepItems = valid.filter(
    (item) => item.stepId === stepId && Number(item.attempt) === attempt,
  );
  if (currentStepItems.length === 0) {
    return {
      active: true,
      valid: false,
      reason: 'no-registered-artifacts',
      runId: run.runId,
      stepId,
      attempt,
    };
  }
  const dirty = valid.filter((item) => {
    const absolutePath = path.join(projectRoot, item.path);
    return !fs.existsSync(absolutePath) || digestFile(absolutePath) !== item.digest;
  });
  if (dirty.length > 0) {
    return {
      active: true,
      valid: false,
      reason: 'artifact-registry-dirty',
      runId: run.runId,
      stepId,
      attempt,
      dirty: dirty.map((item) => item.artifactId),
    };
  }
  return {
    active: true,
    valid: true,
    reason: 'clean',
    runId: run.runId,
    stepId,
    attempt,
  };
}

function filesForOutputPattern(projectRoot, pattern) {
  const normalized = String(pattern || '').trim().replace(/\\/g, '/');
  if (!normalized) return [];
  const absolute = path.resolve(projectRoot, normalized);
  const rel = path.relative(projectRoot, absolute);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`flow output 越出项目根：${pattern}`);
  }
  if (normalized.includes('*')) {
    const dir = path.dirname(absolute);
    if (!fs.existsSync(dir)) return [];
    const base = path.basename(normalized);
    const re = new RegExp(
      `^${base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
    );
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && re.test(entry.name))
      .map((entry) => path.join(dir, entry.name));
  }
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isDirectory()) return walkFiles(absolute);
  return [absolute];
}

export function scanCurrentStepArtifacts(projectRoot) {
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) throw new Error('没有 active Run；先执行 agileflow run start');
    const loaded = loadFlow(projectRoot);
    if (!loaded.ok || !loaded.flow) throw new Error('无法加载 atlas/flow.yaml');
    const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
    if (digestFile(flowPath) !== run.flowDigest) {
      throw new Error('当前 flow 已变化；须 abandon 旧 Run 后新开 Run');
    }
    const byId = new Map(listFlowSteps(loaded.flow).map((step) => [step.id, step]));
    const recorded = [];
    for (const stepId of run.currentStep) {
      const step = byId.get(stepId);
      if (!step) throw new Error(`当前 step 不在 flow：${stepId}`);
      for (const output of step.outputs || []) {
        const pattern = typeof output === 'string' ? output : output?.path;
        for (const absolutePath of filesForOutputPattern(projectRoot, pattern)) {
          const relativePath = path.relative(projectRoot, absolutePath).split(path.sep).join('/');
          recorded.push(
            recordArtifactForRun(projectRoot, run, {
              path: relativePath,
              artifactId: `${stepId}:${relativePath}`,
              type: 'flow-output',
              stepId,
            }),
          );
        }
      }
    }
    if (recorded.length === 0) {
      throw new Error(`当前 step ${run.currentStep.join(',')} 没有可登记的 outputs`);
    }
    return recorded;
  });
}

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(filePath, result);
    else if (entry.isFile()) result.push(filePath);
  }
  return result;
}

function fallbackAtlasSnapshot(projectRoot) {
  const atlasRoot = path.join(projectRoot, 'atlas');
  return walkFiles(atlasRoot)
    .map((absolutePath) => path.relative(projectRoot, absolutePath).split(path.sep).join('/'))
    .filter((relativePath) => {
      return (
        !relativePath.startsWith('atlas/runs/') &&
        !relativePath.startsWith('atlas/state/') &&
        !relativePath.startsWith('atlas/logs/') &&
        relativePath !== 'atlas/agileflow.env'
      );
    })
    .sort()
    .map((relativePath) => ({
      path: relativePath,
      digest: digestFile(path.join(projectRoot, relativePath)),
    }));
}

export function computeRunInput(projectRoot, runId, options = {}) {
  const manifest = loadArtifacts(projectRoot, runId);
  const stepId = String(options.stepId || '').trim();
  const attempt = options.attempt == null ? null : Number(options.attempt);
  const current = manifest.items
    .filter((item) => item.status === 'valid')
    .filter((item) => !stepId || item.stepId === stepId)
    .filter((item) => attempt == null || Number(item.attempt) === attempt)
    .sort((a, b) => `${a.artifactId}:${a.revision}`.localeCompare(`${b.artifactId}:${b.revision}`))
    .map((item) => {
      const absolutePath = path.join(projectRoot, item.path);
      return {
        artifactId: item.artifactId,
        revision: item.revision,
        path: item.path,
        recordedDigest: item.digest,
        currentDigest: fs.existsSync(absolutePath) ? digestFile(absolutePath) : 'missing',
      };
    });
  const allowFallback = !stepId && attempt == null;
  const inputs = current.length > 0 ? current : allowFallback ? fallbackAtlasSnapshot(projectRoot) : [];
  return {
    source:
      current.length > 0
        ? 'artifact-registry'
        : allowFallback
          ? 'atlas-snapshot'
          : 'artifact-registry-empty',
    inputs,
    inputDigest: sha256(stableStringify(inputs)),
  };
}
