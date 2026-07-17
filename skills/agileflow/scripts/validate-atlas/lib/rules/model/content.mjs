import path from 'node:path';
import { collectFiles, readText } from '../../fs-utils.mjs';

/**
 * 通用内容检查：所有 model 文档都必须可读、无占位符。
 *
 * 检查项：
 * 1. 非 README 文件须有一级标题（#）；
 * 2. {…} 占位符须显式标注「待补齐」，否则视为未填内容。
 */

export function validateContent(projectRoot, modelRoot, reporter) {
  const mdFiles = collectFiles(modelRoot, '.md');
  for (const file of mdFiles) {
    const base = path.basename(file);
    if (base === 'README.md') continue;
    const content = readText(file);
    if (!content) continue;
    const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');

    if (!/^#\s/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'MOD-F002',
        file: relPath,
        message: 'model 文档缺少一级标题。',
      });
    }

    // 只匹配模板占位符（{字母开头}），不匹配数学集合（{7, 30, 90}）
    if (/\{[a-zA-Z_][^}]*\}/.test(content) && !content.includes('待补齐')) {
      reporter.add({
        severity: 'warn',
        rule: 'MOD-P001',
        file: relPath,
        message: '含 `{…}` 占位符，可能是未填内容。',
      });
    }
  }
}
