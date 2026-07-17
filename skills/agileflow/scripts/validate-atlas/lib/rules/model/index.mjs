import path from 'node:path';
import { exists } from '../../fs-utils.mjs';
import { validateReadme } from './readme.mjs';
import { validateEntities, collectEntityFiles } from './overview.mjs';
import { validateCrossEntity } from './strict.mjs';
import { validateContent } from './content.mjs';

/**
 * 校验 atlas/model/
 *
 * 强制三层：
 * - README.md                 — 索引（根目录唯一入口）
 * - conceptual/               — 概念层（ER + 领域规则）
 * - entities/{EntityName}.md  — 逻辑层（每个实体独立）
 * - physical/schema.md        — 物理层（表/DDL，按需）
 *
 * 不再有 model-overview.md 单文件退路，也不允许根下平铺实体。
 */
export function validateModel(projectRoot, reporter) {
  const modelRoot = path.join(projectRoot, 'atlas', 'model');
  if (!exists(modelRoot)) return;

  validateReadme(modelRoot, reporter);
  validateCrossEntity(modelRoot, reporter, projectRoot);
  validateEntities(modelRoot, reporter, projectRoot);
  validateContent(projectRoot, modelRoot, reporter);

  const overviewPath = path.join(modelRoot, 'model-overview.md');
  if (exists(overviewPath)) {
    reporter.add({
      severity: 'warn',
      rule: 'MOD-LEGACY-OVERVIEW',
      file: 'atlas/model/model-overview.md',
      message:
        'model-overview.md 已废弃。请将实体拆到 entities/，关系拆到 conceptual/entity-relations.md，规则拆到 conceptual/domain-rules.md。',
    });
  }
}

export { collectEntityFiles };
