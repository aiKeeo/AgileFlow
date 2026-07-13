import fs from 'node:fs';
import path from 'node:path';
import { exists } from './fs-utils.mjs';

/** 业务源码扩展名（有则倾向 brownfield） */
const CODE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.java', '.kt', '.go', '.py', '.cs', '.vue', '.svelte', '.rs',
]);

/** 候选业务根目录 */
const CANDIDATE_DIRS = [
  'src', 'apps', 'server', 'internal', 'packages',
  'backend', 'frontend', 'miniapp', 'web', 'api',
];

const SKIP_DIR = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage',
  '.next', 'out', 'target', 'vendor', 'atlas', '__pycache__',
]);

/**
 * 目录树内是否存在业务源码文件（非空目录名即判定）
 * @param {string} dir
 * @param {number} [depth]
 * @returns {boolean}
 */
function dirHasBusinessCode(dir, depth = 0) {
  if (depth > 4 || !exists(dir)) return false;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue;
      if (dirHasBusinessCode(full, depth + 1)) return true;
    } else if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * 探测是否 brownfield：须有业务源码文件，或已有 atlas/init
 * 空 packages/、空 src/ 脚手架 → greenfield（勿仅看目录名）
 * @param {string} projectRoot
 * @returns {boolean}
 */
export function detectBrownfield(projectRoot) {
  if (exists(path.join(projectRoot, 'atlas', 'init'))) return true;

  for (const name of CANDIDATE_DIRS) {
    if (dirHasBusinessCode(path.join(projectRoot, name))) return true;
  }

  // 根目录零散源码（少见）
  try {
    const top = fs.readdirSync(projectRoot, { withFileTypes: true });
    for (const entry of top) {
      if (!entry.isFile()) continue;
      if (CODE_EXTS.has(path.extname(entry.name).toLowerCase())) return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}
