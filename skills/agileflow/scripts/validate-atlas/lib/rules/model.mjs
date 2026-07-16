import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/**
 * 校验 atlas/model/
 */
export function validateModel(projectRoot, reporter) {
  const modelRoot = path.join(projectRoot, 'atlas', 'model');
  if (!exists(modelRoot)) return;

  const readme = readText(path.join(modelRoot, 'README.md'));
  if (!readme) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-R001',
      file: 'atlas/model/README.md',
      message: 'model 缺少 README.md 索引。',
    });
  } else if (!/## 文档索引/.test(readme)) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-R002',
      file: 'atlas/model/README.md',
      message: 'model README 缺少「## 文档索引」表。',
    });
  } else if (/^##\s*表结构\b/m.test(readme) || /^##\s*实体清单\b/m.test(readme)) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-README-MASH',
      file: 'atlas/model/README.md',
      message:
        'model README 禁止写「## 表结构 / ## 实体清单」正文 → 拆到 model-overview.md（快速）或 domain-model 等；README 只做「## 文档索引」。',
    });
  }

  const overviewOnly = exists(path.join(modelRoot, 'model-overview.md'));
  const strictFiles = ['domain-model.md', 'entity-relations.md', 'domain-rules.md'];
  const hasStrict = strictFiles.every((f) => exists(path.join(modelRoot, f)));

  if (!overviewOnly && !hasStrict) {
    reporter.add({
      severity: 'warn',
      rule: 'MOD-F001',
      file: 'atlas/model/',
      message: '既无 model-overview.md（快速）也无 domain-model 等五件套（严谨）。',
    });
  }

  const mdFiles = collectFiles(modelRoot, '.md');
  for (const file of mdFiles) {
    if (path.basename(file) === 'README.md') continue;
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);

    if (!/^#\s/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'MOD-F002',
        file: relPath,
        message: 'model 文档缺少一级标题。',
      });
    }

    if (/\{[^}]+\}/.test(content) && !content.includes('待补齐')) {
      reporter.add({
        severity: 'warn',
        rule: 'MOD-P001',
        file: relPath,
        message: '含 `{…}` 占位符，可能是未填内容。',
      });
    }
  }
}
