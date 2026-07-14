import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 校验 atlas/tests/（阶段 5）
 */
export function validateTests(projectRoot, reporter) {
  const testsRoot = path.join(projectRoot, 'atlas', 'tests');
  if (!exists(testsRoot)) return;

  const readme = readText(path.join(testsRoot, 'README.md'));
  if (!readme) {
    reporter.add({
      severity: 'error',
      rule: 'TST-R001',
      file: 'atlas/tests/README.md',
      message: 'tests 缺少 README.md。',
    });
  }

  const reports = collectFiles(testsRoot, '.md').filter(
    (f) => path.basename(f).includes('验收报告') || /REQ-\d+/.test(path.basename(f))
  );

  if (reports.length === 0) {
    reporter.add({
      severity: 'warn',
      rule: 'TST-R002',
      file: 'atlas/tests/',
      message: '尚无 REQ 验收报告（AC验收归档产出 atlas/tests/REQ-xxx-验收报告.md）。',
    });
  }

  for (const file of reports) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);

    if (!/\bAC\b|验收|PASS|FAIL|BLOCKED/.test(content)) {
      reporter.add({
        severity: 'warn',
        rule: 'TST-F001',
        file: relPath,
        message: '验收报告建议含 AC 状态或 PASS/FAIL 结论。',
      });
    }
  }
}
