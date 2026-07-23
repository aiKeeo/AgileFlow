/**
 * 将 AF_STEP 对齐到 inferWaveFromFlow
 * 前进离开当前步时须有对应确认闸门 PASS 回执（不靠自觉）
 */
import path from 'node:path';
import { loadFlow, inferWaveFromFlow, listFlowSteps, parseAfStep } from '../scripts/validate-atlas/lib/flow.mjs';
import { setAfWave, loadAfEnv } from '../scripts/validate-atlas/lib/af-env.mjs';
import { effectiveGatePass } from '../scripts/validate-atlas/lib/effective-gate.mjs';
import { STEP_EXIT_GATE } from '../scripts/runtime/gates.mjs';
import { advanceActiveRun, loadActiveRun } from '../scripts/runtime/run-state.mjs';

/**
 * 从当前波前进到目标波时，已完成的步须有出口闸门回执
 * @param {string} projectRoot
 * @param {string[]} beforeWave
 * @param {string[]} afterWave
 * @param {object} flow
 * @returns {string|null} error message
 */
export function receiptGapForAdvance(projectRoot, beforeWave, afterWave, flow) {
  const steps = listFlowSteps(flow).map((s) => s.id);
  const beforeLeft = beforeWave[0] || '';
  const afterLeft = afterWave[0] || '';
  if (!beforeLeft || !afterLeft || beforeLeft === afterLeft) return null;

  const bi = steps.indexOf(beforeLeft);
  const ai = steps.indexOf(afterLeft);
  // 仅前进（索引变大或波变长完成）时验回执；回退不拦
  if (bi < 0 || ai < 0 || ai <= bi) return null;

  for (let i = bi; i < ai; i++) {
    const sid = steps[i];
    const gateId = STEP_EXIT_GATE[sid];
    if (!gateId) continue;
    const receipt = effectiveGatePass(projectRoot, gateId);
    if (!receipt.valid) {
      const authority =
        receipt.source === 'runtime'
          ? `当前 Run JSONL 证明（原因：${receipt.reason}）`
          : 'legacy 回执';
      return `前进离开 ${sid} 须先有最新 ${gateId} PASS；当前 ${authority} 无效。先 agileflow gate --gate ${gateId}，勿手改 AF_STEP / 盲 step sync。`;
    }
  }
  return null;
}

/**
 * @param {string[]} argvRest
 */
export async function runStepSync(argvRest) {
  const { assertRootFlag, parseArgv } = await import('./parse-argv.mjs');
  const { flags } = parseArgv(argvRest);
  assertRootFlag(flags);
  const projectRoot = path.resolve(String(flags.root || process.cwd()));
  const force = Boolean(flags.force);
  const forceReason = flags.reason === true ? '' : String(flags.reason || '').trim();

  const loaded = loadFlow(projectRoot);
  if (!loaded.ok || !loaded.flow) {
    console.error('无法加载 atlas/flow.yaml');
    process.exit(1);
  }

  const envLoaded = loadAfEnv(projectRoot);
  const before = envLoaded.ok ? envLoaded.state.step || '(空)' : '(无 env)';
  const beforeWave = envLoaded.ok ? parseAfStep(envLoaded.state.step || '') : [];

  const wave = inferWaveFromFlow(projectRoot, loaded.flow);
  if (!wave || wave.length === 0) {
    console.log('推断波为空（可能已走完全链或 depends 未就绪）');
    process.exit(0);
  }

  if (!force) {
    const gap = receiptGapForAdvance(projectRoot, beforeWave, wave, loaded.flow);
    if (gap) {
      console.error(`❌ ${gap}`);
      console.error('   紧急对齐可加 --force --reason "…"；（弱模型勿用）');
      process.exit(1);
    }
  } else if (!forceReason) {
    console.error('❌ step sync --force 必须同时提供 --reason "…"');
    process.exit(1);
  } else {
    console.warn(`⚠️ step sync --force：跳过闸门回执检查；reason=${forceReason}`);
  }

  const activeRun = loadActiveRun(projectRoot);
  let result;
  if (activeRun) {
    const advanced = await advanceActiveRun(projectRoot, wave, {
      forced: force,
      reason: force ? forceReason : undefined,
    });
    result = {
      ok: Boolean(advanced),
      step: advanced?.currentStep.join(',') || '',
      phase: loadAfEnv(projectRoot).state?.phase ?? '',
    };
  } else {
    result = setAfWave(projectRoot, wave);
    if (!result.ok) {
      console.error(result.error || 'setAfWave 失败');
      process.exit(1);
    }
  }
  console.log(`AF_STEP: ${before} → ${result.step}`);
  console.log(`AF_PHASE: ${result.phase}`);
}
