import path from 'node:path';
import { exists, readText, rel } from '../fs-utils.mjs';
import { PHASE_DIRS } from '../phase-spec.mjs';
import { loadAllTemplateSpecs } from '../template-loader.mjs';

/**
 * template 模式下按 preset 推断阶段 3 必建目录（无 sol-feature 则不要求 features/）
 * @param {string} projectRoot
 * @param {typeof PHASE_DIRS['3']['dirs']} defaultDirs
 * @param {boolean} templateMode
 */
function resolvePhase3Dirs(projectRoot, defaultDirs, templateMode) {
  if (!templateMode) return defaultDirs;
  const specs = loadAllTemplateSpecs(projectRoot);
  const hasFeature = specs.some((s) => s.id === 'sol-feature');
  return defaultDirs.filter((dir) => {
    if (dir.path === 'solution/features' && !hasFeature) return false;
    return true;
  });
}

/**
 * 从 todo 判断建模是否跳过
 * @param {string} projectRoot
 */
function isModelingSkipped(projectRoot) {
  const todo = readText(path.join(projectRoot, 'atlas', 'todo.md'));
  if (!todo) return false;
  return /建模.*⏭️|⏭️.*建模|建模判定.*跳过/.test(todo);
}

/**
 * 校验指定阶段的目录与必建文件
 */
export function validateDirectory(projectRoot, reporter, opts = {}) {
  const atlasRoot = path.join(projectRoot, 'atlas');
  const phase = opts.phase ?? 'all';
  const brownfield = opts.brownfield ?? 'auto';
  const templateMode = opts.templateMode ?? false;

  if (!exists(atlasRoot)) {
    reporter.add({
      severity: 'error',
      rule: 'DIR-001',
      message: '缺少 atlas/ 根目录。',
    });
    return;
  }

  const phasesToCheck =
    phase === 'all' ? Object.keys(PHASE_DIRS) : [phase];

  for (const ph of phasesToCheck) {
    const spec = PHASE_DIRS[ph];
    if (!spec) continue;

    if (ph === '0' && brownfield === false) continue;
    if (ph === '2' && isModelingSkipped(projectRoot)) {
      reporter.add({
        severity: 'info',
        rule: 'DIR-2-SKIP',
        message: 'todo 标注建模跳过，不强制 atlas/model/。',
      });
      continue;
    }

    const dirs =
      ph === '3'
        ? resolvePhase3Dirs(projectRoot, spec.dirs, templateMode)
        : spec.dirs;

    for (const dir of dirs) {
      if (dir.brownfieldOnly && brownfield === false) continue;
      const full = path.join(atlasRoot, dir.path);
      if (!exists(full)) {
        reporter.add({
          severity: dir.required ? 'error' : 'warn',
          rule: `DIR-${ph}-${dir.path.replace(/\//g, '-')}`,
          file: rel(projectRoot, full),
          message: `阶段 ${ph} 缺少目录 atlas/${dir.path}/`,
        });
      }
    }

    for (const file of spec.files) {
      if (file.path.startsWith('init/') && brownfield === false) continue;
      const full = path.join(atlasRoot, file.path);
      if (!exists(full)) {
        reporter.add({
          severity: file.required ? 'error' : 'warn',
          rule: `DIR-${ph}-file-${path.basename(file.path, '.md')}`,
          file: rel(projectRoot, full),
          message: `阶段 ${ph} 缺少文件 atlas/${file.path}`,
        });
      }
    }
  }

  const initPath = path.join(atlasRoot, 'init');
  if (brownfield === false && exists(initPath)) {
    reporter.add({
      severity: 'error',
      rule: 'DIR-030',
      file: 'atlas/init/',
      message: 'greenfield 禁止 atlas/init/',
    });
  }
}
