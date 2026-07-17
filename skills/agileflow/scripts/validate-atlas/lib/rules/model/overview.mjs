import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, exists, listFiles, readText } from '../../fs-utils.mjs';

/**
 * 实体文件检查：每个实体一个 .md，且必须落在 entities/。
 *
 * 目的：model 不允许把所有实体塞进一个文件，也不允许平铺在 model 根下。
 * 强制：entities/User.md · entities/WeightRecord.md 等。
 * 每个实体文件必须含「## 字段」表。
 */

/** 概念层 / 物理层文件名（basename）——不是实体 */
const NON_ENTITY_BASENAMES = new Set([
  'README.md',
  'entity-relations.md',
  'domain-rules.md',
  'schema.md',
  'physical-model.md',
  'model-overview.md',
]);

const LAYER_DIRS = new Set(['conceptual', 'entities', 'physical']);

/**
 * 收集 entities/ 下的实体文件。
 * @param {string} modelRoot
 * @returns {string[]}
 */
export function collectEntityFiles(modelRoot) {
  const entitiesDir = path.join(modelRoot, 'entities');
  if (!exists(entitiesDir)) return [];
  return collectFiles(entitiesDir, '.md').filter((f) => {
    const base = path.basename(f);
    return !NON_ENTITY_BASENAMES.has(base) && !base.startsWith('_');
  });
}

/**
 * 根目录平铺的遗留文件（warn，不 fail）。
 * @param {string} modelRoot
 * @param {import('../../reporter.mjs').Reporter} reporter
 */
function warnLegacyFlat(modelRoot, reporter) {
  for (const full of listFiles(modelRoot)) {
    const base = path.basename(full);
    if (base === 'README.md') continue;

    let isDir = false;
    try {
      isDir = fs.statSync(full).isDirectory();
    } catch {
      continue;
    }

    if (isDir) {
      if (!LAYER_DIRS.has(base)) {
        reporter.add({
          severity: 'warn',
          rule: 'MOD-LEGACY-FLAT',
          file: `atlas/model/${base}/`,
          message: `model 根下不应有额外目录「${base}/」。规范层为 conceptual/ · entities/ · physical/。`,
        });
      }
      continue;
    }

    if (!base.endsWith('.md')) continue;

    if (base === 'entity-relations.md' || base === 'domain-rules.md') {
      reporter.add({
        severity: 'warn',
        rule: 'MOD-LEGACY-FLAT',
        file: `atlas/model/${base}`,
        message: `${base} 应迁到 conceptual/${base}。`,
      });
      continue;
    }

    if (base === 'physical-model.md') {
      reporter.add({
        severity: 'warn',
        rule: 'MOD-LEGACY-FLAT',
        file: 'atlas/model/physical-model.md',
        message: 'physical-model.md 应迁到 physical/schema.md。',
      });
      continue;
    }

    if (base === 'model-overview.md') continue;

    if (!NON_ENTITY_BASENAMES.has(base)) {
      reporter.add({
        severity: 'warn',
        rule: 'MOD-LEGACY-FLAT',
        file: `atlas/model/${base}`,
        message: `实体文件应迁到 entities/${base}，禁止平铺在 model 根下。`,
      });
    }
  }
}

/**
 * 检查实体文件是否存在且结构合规。
 * @param {string} modelRoot
 * @param {import('../../reporter.mjs').Reporter} reporter
 * @param {string} projectRoot
 */
export function validateEntities(modelRoot, reporter, projectRoot) {
  warnLegacyFlat(modelRoot, reporter);

  const entitiesDir = path.join(modelRoot, 'entities');
  if (!exists(entitiesDir)) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-NO-ENTITY',
      file: 'atlas/model/entities/',
      message:
        '缺少 entities/ 目录。每个实体必须写 entities/{EntityName}.md（如 entities/User.md），禁止平铺在 model 根下。',
    });
    return;
  }

  const entityFiles = collectEntityFiles(modelRoot);

  if (entityFiles.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'MOD-NO-ENTITY',
      file: 'atlas/model/entities/',
      message:
        'entities/ 下无实体文件。每个实体必须独立一个 .md（如 User.md、WeightRecord.md），禁止用单文件收敛所有实体。',
    });
    return;
  }

  for (const file of entityFiles) {
    const content = readText(file);
    if (!content) continue;
    const relPath = path.relative(projectRoot, file).replace(/\\/g, '/');

    if (!/^##\s*字段/m.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'MOD-ENTITY-FIELDS',
        file: relPath,
        message: `实体文件须含「## 字段」表（字段名 | 类型 | 约束 | 说明）。`,
      });
    }

    const titleMatch = content.match(/^#\s+(.+)/m);
    if (!titleMatch) {
      reporter.add({
        severity: 'error',
        rule: 'MOD-F002',
        file: relPath,
        message: '实体文件缺少一级标题（# 实体名）。',
      });
    }
  }
}
