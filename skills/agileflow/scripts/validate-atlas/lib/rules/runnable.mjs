import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 从 markdown 抽出「## 九、实现结果」段正文
 * @param {string} content
 * @returns {string | null}
 */
function extractSectionNine(content) {
  const match = content.match(/^## 九、实现结果[^\n]*/m);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/**
 * 判定九段是否含可运行证据（编译 + 启/冒烟 + 结果标记）
 * @param {string} body
 * @returns {boolean}
 */
function hasRunnableEvidence(body) {
  if (!body || body.replace(/\s/g, '').length < 30) return false;
  // 仅占位表、未填结果 → 不合格
  if (/③\s*验收后填写/.test(body) && !/exit\s*0|✅|通过|PASS|UP|成功/i.test(body)) {
    return false;
  }

  const hasBuild = /编译|build|package|mvn|gradle|tsc|npm run build|vite build/i.test(body);
  const hasStartOrSmoke =
    /启动|能启|health|listening|Started|冒烟|smoke|主路径|HTTP\s*200|curl|探针/i.test(body);
  const hasResult = /exit\s*0|✅|通过|PASS|UP|成功|ok\b/i.test(body);

  return hasBuild && hasStartOrSmoke && hasResult;
}

/**
 * 校验全部非 README/temp 的 dev 文件九段可运行证据
 * 用于 A 档闸门：dev-complete / test-entry
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateRunnable(projectRoot, reporter) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) {
    reporter.add({
      severity: 'error',
      rule: 'RUN-D001',
      file: 'atlas/dev/',
      message: '缺少 atlas/dev/，无法核验可运行证据。',
    });
    return;
  }

  const files = collectFiles(devRoot, '.md').filter((f) => {
    const base = path.basename(f);
    return base !== 'README.md' && !base.startsWith('temp');
  });

  if (files.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'RUN-D002',
      file: 'atlas/dev/',
      message: '无 T 级 dev 文件，无法核验可运行证据。',
    });
    return;
  }

  for (const file of files) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);
    const body = extractSectionNine(content);

    if (body === null) {
      reporter.add({
        severity: 'error',
        rule: 'RUN-S9-MISSING',
        file: relPath,
        message: '缺少「## 九、实现结果」，dev-complete 须有可运行证据。',
      });
      continue;
    }

    if (!hasRunnableEvidence(body)) {
      reporter.add({
        severity: 'error',
        rule: 'RUN-S9-EVIDENCE',
        file: relPath,
        message:
          '九、缺少可运行证据：须含「编译/build」+「启动或冒烟」+「结果标记」(exit 0/✅/通过/PASS/UP)。禁止只写「测过了」或空表。',
      });
    }
  }
}
