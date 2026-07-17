import path from 'node:path';
import { readText } from '../../fs-utils.mjs';

/**
 * 校验 atlas/model/README.md
 *
 * 目的：model README 只做索引，不做正文。
 * 读者 3 秒内知道：目录下有哪些实体文件、关系图在哪、规则在哪。
 * 禁止把实体字段/表结构正文塞到 README 里。
 */
export function validateReadme(modelRoot, reporter) {
  const readmePath = path.join(modelRoot, 'README.md');
  const readme = readText(readmePath);

  if (!readme) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-R001',
      file: 'atlas/model/README.md',
      message: 'model 缺少 README.md 索引。',
    });
    return;
  }

  if (!/## 文档索引/.test(readme)) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-R002',
      file: 'atlas/model/README.md',
      message: 'model README 缺少「## 文档索引」表。',
    });
  }

  if (/^##\s*表结构\b/m.test(readme) || /^##\s*实体清单\b/m.test(readme)) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-README-MASH',
      file: 'atlas/model/README.md',
      message:
        'model README 禁止写「## 表结构 / ## 实体清单」正文 → 拆到 entities/ 与 conceptual/；README 只做「## 文档索引」。',
    });
  }
}
