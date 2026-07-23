import fs from 'node:fs';
import path from 'node:path';
import {
  appendJsonLine,
  digestFile,
  readJsonLines,
  sha256,
  stableStringify,
  withStateLock,
} from './io.mjs';
import { computeRunInput } from './artifacts.mjs';
import { loadActiveRun, loadRun, runDir } from './run-state.mjs';
import { GATE_TO_STEP } from './gates.mjs';

function receiptsFile(projectRoot, runId) {
  return path.join(runDir(projectRoot, runId), 'receipts.jsonl');
}

export function listRuntimeReceipts(projectRoot, runId) {
  return readJsonLines(receiptsFile(projectRoot, runId));
}

export function recordRuntimeGateReceipt(projectRoot, options) {
  return withStateLock(projectRoot, () => {
    const run = loadActiveRun(projectRoot);
    if (!run) return null;
    const gateId = String(options.gateId || '').trim();
    const stepId = GATE_TO_STEP[gateId] || run.currentStep[0];
    const attempt = Number(run.steps?.[stepId]?.attempt || 1);
    const prior = listRuntimeReceipts(projectRoot, run.runId);
    const previousReceiptDigest = prior.at(-1)?.receiptDigest || null;
    const input = computeRunInput(projectRoot, run.runId, { stepId, attempt });
    const receiptBase = {
      schemaVersion: 2,
      runId: run.runId,
      changeId: run.changeId,
      stepId,
      attempt,
      gateId,
      status: options.passed ? 'PASS' : 'FAIL',
      inputSource: input.source,
      inputDigest: input.inputDigest,
      flowDigest: run.flowDigest,
      validator: {
        name: options.validatorName || 'validate-atlas',
        version: options.validatorVersion || null,
      },
      exitCode: options.passed ? 0 : 1,
      failureReason: options.failureReason || null,
      at: options.at || new Date().toISOString(),
      previousReceiptDigest,
    };
    const receipt = {
      ...receiptBase,
      receiptDigest: sha256(stableStringify(receiptBase)),
    };
    appendJsonLine(receiptsFile(projectRoot, run.runId), receipt);
    return receipt;
  });
}

export function runtimeGateStatus(projectRoot, gateId, options = {}) {
  const run = options.runId
    ? loadRun(projectRoot, options.runId)
    : loadActiveRun(projectRoot);
  if (!run) return { active: false, valid: false, reason: 'no-active-run' };
  const receipts = listRuntimeReceipts(projectRoot, run.runId).filter(
    (receipt) => receipt.gateId === gateId,
  );
  const latest = receipts.at(-1);
  if (!latest) {
    return { active: true, valid: false, reason: 'missing-receipt', runId: run.runId };
  }
  if (latest.status !== 'PASS') {
    return {
      active: true,
      valid: false,
      reason: latest.failureReason || 'latest-not-pass',
      runId: run.runId,
      latest,
    };
  }
  if (latest.inputSource !== 'artifact-registry') {
    return {
      active: true,
      valid: false,
      reason: 'no-registered-artifacts',
      runId: run.runId,
      latest,
    };
  }
  const flowPath = path.join(projectRoot, 'atlas', 'flow.yaml');
  if (!fs.existsSync(flowPath)) {
    return { active: true, valid: false, reason: 'flow-missing', runId: run.runId, latest };
  }
  const currentFlowDigest = digestFile(flowPath);
  if (currentFlowDigest !== run.flowDigest) {
    return { active: true, valid: false, reason: 'flow-stale', runId: run.runId, latest };
  }
  const stepId = GATE_TO_STEP[gateId] || run.currentStep[0];
  const attempt = Number(run.steps?.[stepId]?.attempt || 1);
  if (latest.stepId !== stepId || latest.attempt !== attempt) {
    return { active: true, valid: false, reason: 'attempt-mismatch', runId: run.runId, latest };
  }
  const input = computeRunInput(projectRoot, run.runId, { stepId, attempt });
  const dirty = input.inputs.filter(
    (item) => item.recordedDigest && item.recordedDigest !== item.currentDigest,
  );
  if (dirty.length > 0) {
    return {
      active: true,
      valid: false,
      reason: 'artifact-registry-dirty',
      runId: run.runId,
      latest,
      dirty: dirty.map((item) => item.artifactId),
    };
  }
  if (latest.inputDigest !== input.inputDigest || latest.flowDigest !== run.flowDigest) {
    return { active: true, valid: false, reason: 'input-stale', runId: run.runId, latest };
  }
  return { active: true, valid: true, reason: 'pass', runId: run.runId, latest };
}
