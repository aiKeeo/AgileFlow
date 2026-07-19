import path from 'node:path';
import { readText } from './fs-utils.mjs';

/**
 * 正式跳过行（须同行）：建模判定：跳过（依据：实质内容）⏭️
 * 拒空依据 / 「无」/ 「—」/ 「待定」；依据至少 2 个非空白字符
 */
const FORMAL_SKIP_RE =
  /建模判定[：:]\s*跳过\s*[（(]\s*依据[：:]\s*(?!无\s*[）)]|—\s*[）)]|-\s*[）)]|待定|N\/A|n\/a)(\S.{0,}?)\s*[）)]\s*⏭️/;

/**
 * 从 todo 判断建模是否正式跳过
 * @param {string} projectRoot
 */
export function isModelingSkipped(projectRoot) {
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md'));
  if (!todo) return false;
  return FORMAL_SKIP_RE.test(todo);
}
