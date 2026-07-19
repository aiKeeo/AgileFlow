import fs from 'node:fs';
import path from 'node:path';
import { exists, rel } from '../fs-utils.mjs';
import { PHASE_DIRS } from '../phase-spec.mjs';
import { isModelingSkipped } from '../modeling-skip.mjs';
import { solFeaturesRequired } from '../modeling.mjs';
import { hasProjectRoleTree } from '../atlas-scaffold.mjs';
import { validateHumanTodo } from './human-todo.mjs';

export { isModelingSkipped } from '../modeling-skip.mjs';

const ROLE_REQUIRED = ['role-req.md', 'role-model.md', 'role-sol.md', 'role-dev.md'];

/**
 * template 模式下按 preset 推断阶段 3 必建目录（无 sol-feature 则不要求 features/）
 * @param {string} projectRoot
 * @param {typeof PHASE_DIRS['3']['dirs']} defaultDirs
 * @param {boolean} templateMode
 */
function resolvePhase3Dirs(projectRoot, defaultDirs, templateMode) {
  if (!templateMode) return defaultDirs;
  if (solFeaturesRequired(projectRoot, true)) return defaultDirs;
  return defaultDirs.filter((dir) => dir.path !== 'solution/features');
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
        let message = `阶段 ${ph} 缺少目录 atlas/${dir.path}/`;
        if (ph === '2' && dir.path === 'model') {
          message += '；若确需跳过建模，须在 todo 写入「建模判定：跳过（依据：…）⏭️」。';
        }
        reporter.add({
          severity: dir.required ? 'error' : 'warn',
          rule: `DIR-${ph}-${dir.path.replace(/\//g, '-')}`,
          file: rel(projectRoot, full),
          message,
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

  // 拒绝常见错误目录名（前缀口令 req:/sol: ≠ 文件夹名）
  const wrongNames = {
    req: 'requirements',
    requirement: 'requirements',
    reqs: 'requirements',
    sol: 'solution',
    solutions: 'solution',
    devs: 'dev',
    develop: 'dev',
    test: 'tests',
    models: 'model',
  };
  for (const [wrong, right] of Object.entries(wrongNames)) {
    const wrongPath = path.join(atlasRoot, wrong);
    if (exists(wrongPath)) {
      reporter.add({
        severity: 'error',
        rule: `DIR-NAME-${wrong.toUpperCase()}`,
        file: rel(projectRoot, wrongPath),
        message: `目录名错误：atlas/${wrong}/ 应为 atlas/${right}/（前缀是口令不是文件夹）。`,
      });
    }
  }

  // todo 只允许 atlas/todo.md；任意子目录下的 todo.md 一律硬挡
  const nestedTodos = collectNestedTodoMd(atlasRoot);
  for (const todoFile of nestedTodos) {
    reporter.add({
      severity: 'error',
      rule: 'DIR-TODO-PATH',
      file: rel(projectRoot, todoFile),
      message: 'todo.md 必须在 atlas/todo.md（根），禁止放在子目录。',
    });
  }

  // 首启必须暴露 atlas/role/（Subagent 只读项目 role；用户可改）
  validateProjectRole(projectRoot, reporter);

  // humanTodo 骨架 + 阶段 5 阻塞（与 dir 同闸，防漏写）
  validateHumanTodo(projectRoot, reporter, { phase });
}

/**
 * 强制 atlas/role/role-*.md 落盘
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateProjectRole(projectRoot, reporter) {
  const roleDir = path.join(projectRoot, 'atlas', 'role');
  if (!exists(roleDir)) {
    reporter.add({
      severity: 'error',
      rule: 'DIR-ROLE',
      file: 'atlas/role/',
      message:
        '缺少 atlas/role/。首启须暴露角色提示词（可自定义）：node <skill>/scripts/validate-atlas.mjs --bootstrap-scaffold --root .',
    });
    return;
  }
  if (!hasProjectRoleTree(projectRoot)) {
    const missing = ROLE_REQUIRED.filter((f) => !exists(path.join(roleDir, f)));
    reporter.add({
      severity: 'error',
      rule: 'DIR-ROLE-FILES',
      file: 'atlas/role/',
      message: `atlas/role/ 缺文件：${missing.join(', ')}。Subagent 只读本目录；补齐或 --bootstrap-scaffold（不覆盖已有）。`,
    });
  }
}

/**
 * 收集 atlas 下除根 todo.md 外的所有 todo.md
 * @param {string} atlasRoot
 */
function collectNestedTodoMd(atlasRoot) {
  const out = [];
  if (!exists(atlasRoot)) return out;
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (name === 'temp' || name === 'node_modules') continue;
        walk(full);
      } else if (name.toLowerCase() === 'todo.md' && path.dirname(full) !== atlasRoot) {
        out.push(full);
      }
    }
  };
  walk(atlasRoot);
  return out;
}
