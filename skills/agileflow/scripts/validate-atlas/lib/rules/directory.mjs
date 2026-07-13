import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { PHASE_DIRS } from '../phase-spec.mjs';

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

    for (const dir of spec.dirs) {
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
