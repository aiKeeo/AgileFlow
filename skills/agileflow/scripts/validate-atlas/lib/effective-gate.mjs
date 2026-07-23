import { runtimeGateStatus } from '../../runtime/receipts.mjs';
import { loadCurrentPointer, loadRun } from '../../runtime/run-state.mjs';
import { hasGatePassReceipt } from './gate-receipts.mjs';

export function effectiveGatePass(projectRoot, gateId) {
  const pointer = loadCurrentPointer(projectRoot);
  const run = pointer?.runId ? loadRun(projectRoot, pointer.runId) : null;
  if (run) {
    if (!['active', 'waiting-user', 'blocked', 'completed'].includes(run.status)) {
      return {
        valid: false,
        source: 'runtime',
        reason: `run-${run.status}`,
        detail: { runId: run.runId, status: run.status },
      };
    }
    const runtime = runtimeGateStatus(projectRoot, gateId, { runId: run.runId });
    return {
      valid: runtime.valid,
      source: 'runtime',
      reason: runtime.reason,
      detail: runtime,
    };
  }
  return {
    valid: hasGatePassReceipt(projectRoot, gateId),
    source: 'legacy',
    reason: 'legacy-latest',
  };
}
