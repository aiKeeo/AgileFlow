import path from 'node:path';
import { exists, collectFiles } from './fs-utils.mjs';
import { loadAllTemplateSpecs } from './template-loader.mjs';
import { isModelingSkipped } from './modeling-skip.mjs';

export { isModelingSkipped } from './modeling-skip.mjs';

/**
 * 当前项目是否要求 features/F-*.md（template minimal 无 sol-feature 则否）
 * @param {string} projectRoot
 * @param {boolean} [templateMode]
 */
export function solFeaturesRequired(projectRoot, templateMode = false) {
  if (!templateMode) return true;
  const specs = loadAllTemplateSpecs(projectRoot);
  return specs.some((s) => s.id === 'sol-feature');
}

/**
 * 统计业务 REQ 文件数（排除 ui/）
 * @param {string} projectRoot
 */
export function countReqFiles(projectRoot) {
  const reqRoot = path.join(projectRoot, 'atlas', 'requirements');
  if (!exists(reqRoot)) return 0;
  return collectFiles(reqRoot, '.md').filter((f) => {
    const base = path.basename(f);
    return base.startsWith('REQ-') && !f.includes(`${path.sep}ui${path.sep}`);
  }).length;
}

/**
 * 统计 F-*.md 文件数
 * @param {string} projectRoot
 */
export function countFeatureFiles(projectRoot) {
  const featRoot = path.join(projectRoot, 'atlas', 'solution', 'features');
  if (!exists(featRoot)) return 0;
  return collectFiles(featRoot, '.md').filter((f) =>
    /^F-\d+-.+\.md$/.test(path.basename(f)),
  ).length;
}
