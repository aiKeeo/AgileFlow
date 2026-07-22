import path from 'node:path';
import { readText } from './fs-utils.mjs';
import { loadFlow, isFlowStepSkipped } from './flow.mjs';

/**
 * 正式跳过行（须同行）：建模判定：跳过（依据：实质内容）⏭️
 * 拒空依据 / 「无」/ 「—」/ 「待定」；依据至少 2 个非空白字符
 * （兼容旧项目；优先认 atlas/flow.yaml）
 */
const FORMAL_SKIP_RE =
  /建模判定[：:]\s*跳过\s*[（(]\s*依据[：:]\s*(?!无\s*[）)]|—\s*[）)]|-\s*[）)]|待定|N\/A|n\/a)(\S.{0,}?)\s*[）)]\s*⏭️/;

/**
 * 建模是否跳过：优先 flow.yaml 中 model.skip；否则 todo 正式跳过行
 * @param {string} projectRoot
 */
export function isModelingSkipped(projectRoot) {
  const loaded = loadFlow(projectRoot);
  if (loaded.ok && loaded.flow) {
    if (isFlowStepSkipped(loaded.flow, 'model')) return true;
    // 有 flow 且 model 未 skip → 明确不跳过（不再被旧 todo 行误伤）
    const hasModelStep = Array.isArray(loaded.flow.steps)
      && loaded.flow.steps.some((s) => s && s.id === 'model');
    if (hasModelStep) return false;
  }

  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md'));
  if (!todo) return false;
  return FORMAL_SKIP_RE.test(todo);
}
