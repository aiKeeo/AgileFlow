import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 校验 atlas/solution/
 */
export function validateSolution(projectRoot, reporter) {
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  if (!exists(solRoot)) return;

  const readmePath = path.join(solRoot, 'README.md');
  const readme = readText(readmePath);
  if (!readme) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-R001',
      file: 'atlas/solution/README.md',
      message: 'solution 缺少 README.md 索引。',
    });
  } else {
    if (!/## 功能清单/.test(readme)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-R002',
        file: 'atlas/solution/README.md',
        message: 'solution README 缺少「## 功能清单」表。',
      });
    }
    if (!/## 契约清单/.test(readme)) {
      reporter.add({
        severity: 'warn',
        rule: 'SOL-R003',
        file: 'atlas/solution/README.md',
        message: 'solution README 建议含「## 契约清单」索引。',
      });
    }
  }

  if (!exists(path.join(solRoot, 'architecture.md'))) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-A001',
      file: 'atlas/solution/architecture.md',
      message: '缺少全局 architecture.md（A档：sol-confirm 必挡）。',
    });
  }

  const featureFiles = collectFiles(path.join(solRoot, 'features'), '.md');
  for (const file of featureFiles) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);

    if (!/^#\s*\[F-\d+\]/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-F001',
        file: relPath,
        message: 'feature 标题应为 `# [F-XXX] 功能名` 格式。',
      });
    }
    if (!/^## 边界/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-F002',
        file: relPath,
        message: 'feature 缺少「## 边界」节。',
      });
    }
    if (!/- \*\*暴露面\*\*：/.test(content)) {
      reporter.add({
        severity: 'warn',
        rule: 'SOL-F003',
        file: relPath,
        message: 'feature 建议含「- **暴露面**：」并链到 contracts/。',
      });
    }
  }

  const contractFiles = collectFiles(path.join(solRoot, 'contracts'), '.md');
  for (const file of contractFiles) {
    const baseName = path.basename(file);
    if (baseName.startsWith('_')) continue;

    const relPath = rel(projectRoot, file);
    if (!/^(API|UI|JOB|EVT)-\d+-.+\.md$/.test(baseName)) {
      reporter.add({
        severity: 'warn',
        rule: 'SOL-C001',
        file: relPath,
        message: '契约文件名应为 API-XXX / UI-XXX 等格式。',
      });
    }
  }

  if (exists(path.join(solRoot, 'boundaries.md'))) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-X001',
      file: 'atlas/solution/boundaries.md',
      message: '禁止创建 boundaries.md。',
    });
  }
}
