import path from 'node:path';
import { exists, readText } from '../../fs-utils.mjs';

/**
 * 跨实体文件检查：conceptual/entity-relations.md + conceptual/domain-rules.md
 *
 * 目的：实体间的关系和领域规则不属于任何单个实体文件，
 * 必须落在概念层，避免在某个实体文件里越权描述其他实体。
 */

const REQUIRED_REL = [
  {
    rel: 'conceptual/entity-relations.md',
    requiredHeading: '## ER 图',
    rule: 'MOD-ER-STRUCT',
    msg: 'conceptual/entity-relations.md 须含「## ER 图」（文本 ER 图或 mermaid）。',
  },
  {
    rel: 'conceptual/domain-rules.md',
    requiredHeading: '## 不变量',
    rule: 'MOD-RULES-STRUCT',
    msg: 'conceptual/domain-rules.md 须含「## 不变量」（跨实体的业务规则表）。',
  },
];

/**
 * @param {string} modelRoot
 * @param {import('../../reporter.mjs').Reporter} reporter
 * @param {string} projectRoot
 */
export function validateCrossEntity(modelRoot, reporter, projectRoot) {
  for (const spec of REQUIRED_REL) {
    const filePath = path.join(modelRoot, spec.rel);
    const relPath = `atlas/model/${spec.rel}`;

    if (!exists(filePath)) {
      // 兼容旧平铺路径：根下仍有同名文件时只 warn（由 overview 的 LEGACY-FLAT 提示迁移）
      const legacyBase = path.basename(spec.rel);
      const legacyPath = path.join(modelRoot, legacyBase);
      if (exists(legacyPath)) {
        reporter.add({
          severity: 'warn',
          rule: 'MOD-LEGACY-FLAT',
          file: `atlas/model/${legacyBase}`,
          message: `缺少 ${spec.rel}；检测到根下遗留 ${legacyBase}，请迁到 conceptual/。`,
        });
        const legacyContent = readText(legacyPath);
        if (legacyContent && !legacyContent.includes(spec.requiredHeading)) {
          reporter.add({
            severity: 'error',
            rule: spec.rule,
            file: `atlas/model/${legacyBase}`,
            message: spec.msg.replace(`conceptual/${legacyBase}`, legacyBase),
          });
        }
        continue;
      }

      reporter.add({
        severity: 'error',
        rule: 'MOD-CROSS-MISSING',
        file: relPath,
        message: `缺少 ${spec.rel}。model 概念层必须含 entity-relations.md（ER 图 + 关系表）和 domain-rules.md（不变量 + 状态机）。`,
      });
      continue;
    }

    const content = readText(filePath);
    if (!content) continue;

    if (!content.includes(spec.requiredHeading)) {
      reporter.add({
        severity: 'error',
        rule: spec.rule,
        file: relPath,
        message: spec.msg,
      });
    }
  }
}
