import fs from 'node:fs';
import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';

/** README 禁止承载的「方案正文」节（应在 architecture / contracts / features） */
const MASH_HEADINGS = [
  { re: /^##\s*技术栈\s*$/m, label: '## 技术栈' },
  { re: /^##\s*架构\s*$/m, label: '## 架构' },
  { re: /^##\s*API\s*契约/m, label: '## API 契约' },
  { re: /^##\s*前端路由/m, label: '## 前端路由' },
  { re: /^##\s*模块(?:一览|划分)?\s*$/m, label: '## 模块' },
  { re: /^##\s*目录结构/m, label: '## 目录结构' },
];

/**
 * README 是否含 HTTP 方法表（揉 API）
 * @param {string} readme
 */
function hasApiMethodTable(readme) {
  return /\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|/i.test(readme);
}

/**
 * 从文本收集契约 ID（API/UI/JOB/EVT-数字）
 * @param {string} text
 * @returns {Set<string>}
 */
function collectContractIds(text) {
  /** @type {Set<string>} */
  const ids = new Set();
  if (!text) return ids;
  for (const m of text.matchAll(/\b((?:API|UI|JOB|EVT)-\d+)\b/g)) {
    ids.add(m[1]);
  }
  return ids;
}

/**
 * contracts/ 下已有契约 ID 集合（按文件名前缀）
 * @param {string} contractsRoot
 * @returns {Set<string>}
 */
function existingContractIds(contractsRoot) {
  /** @type {Set<string>} */
  const ids = new Set();
  if (!exists(contractsRoot)) return ids;
  for (const f of fs.readdirSync(contractsRoot)) {
    const m = f.match(/^((?:API|UI|JOB|EVT)-(\d+))-/i);
    if (!m) continue;
    const kind = m[1].split('-')[0].toUpperCase();
    ids.add(`${kind}-${m[2]}`);
  }
  return ids;
}

/**
 * 暴露面是否声明「无」
 * @param {string} content
 */
function exposureIsNone(content) {
  return /\*\*暴露面\*\*[：:]\s*无\b/.test(content);
}

/**
 * 方案内容结构加严（README 禁揉、architecture 必节、F 边界、契约对齐）
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 */
export function validateSolutionStructure(projectRoot, reporter) {
  const solRoot = path.join(projectRoot, 'atlas', 'solution');
  if (!exists(solRoot)) return;

  const readmePath = path.join(solRoot, 'README.md');
  const readme = readText(readmePath) || '';

  if (readme) {
    for (const h of MASH_HEADINGS) {
      if (h.re.test(readme)) {
        reporter.add({
          severity: 'error',
          rule: 'SOL-README-MASH',
          file: 'atlas/solution/README.md',
          message: `solution README 禁止写「${h.label}」正文 → 技术栈/架构进 architecture.md，API/路由进 contracts/，功能进 features/。README 只做索引。`,
        });
      }
    }
    if (hasApiMethodTable(readme)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-README-MASH-API',
        file: 'atlas/solution/README.md',
        message:
          'solution README 含 HTTP 方法表（GET/POST…）→ 拆到 contracts/API-*.md，README 只保留「## 契约清单」索引。',
      });
    }
  }

  const archPath = path.join(solRoot, 'architecture.md');
  if (exists(archPath)) {
    const arch = readText(archPath) || '';
    if (!/^##\s*技术栈(\s|$)/m.test(arch)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-A-SEC-栈',
        file: 'atlas/solution/architecture.md',
        message: 'architecture.md 须含「## 技术栈」节。',
      });
    }
    if (!/^##\s*模块(\s|$)/m.test(arch) && !/^##\s*目录/m.test(arch)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-A-SEC-模块',
        file: 'atlas/solution/architecture.md',
        message: 'architecture.md 须含「## 模块」或「## 目录…」节。',
      });
    }
    if (!/本地验证|一条命令/i.test(arch)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-A-RUN',
        file: 'atlas/solution/architecture.md',
        message: 'architecture.md 须含「本地验证」/「一条命令」（可运行入口）。',
      });
    }
  }

  /** @type {Set<string>} */
  const referencedIds = new Set();
  if (readme) {
    for (const id of collectContractIds(readme)) referencedIds.add(id);
  }

  const featureFiles = collectFiles(path.join(solRoot, 'features'), '.md').filter((f) =>
    /^F-\d+-.+\.md$/.test(path.basename(f)),
  );

  for (const file of featureFiles) {
    const content = readText(file) || '';
    const relPath = rel(projectRoot, file);
    const boundStart = content.search(/^##\s*边界(\s|$)/m);
    if (boundStart >= 0) {
      const fromBound = content.slice(boundStart);
      const nextHeading = fromBound.slice(1).search(/^## /m);
      const boundBody = nextHeading === -1 ? fromBound : fromBound.slice(0, nextHeading + 1);
      if (!/\*\*做\*\*/.test(boundBody) || !/\*\*不做\*\*/.test(boundBody)) {
        reporter.add({
          severity: 'error',
          rule: 'SOL-F-BOUND',
          file: relPath,
          message: 'feature「## 边界」须含 **做** 与 **不做**（从 REQ 提炼）。',
        });
      }
    }

    if (!/- \*\*暴露面\*\*[：:]/.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'SOL-F-EXPOSE',
        file: relPath,
        message: 'feature 须含「- **暴露面**：…」行（无对外暴露写「无」）。',
      });
    } else if (!exposureIsNone(content)) {
      for (const id of collectContractIds(content)) referencedIds.add(id);
    }
  }

  const contractsRoot = path.join(solRoot, 'contracts');
  const existing = existingContractIds(contractsRoot);
  // 仅核对接了编号的暴露面；「无」已排除
  const missing = [...referencedIds].filter((id) => !existing.has(id));
  if (missing.length > 0) {
    reporter.add({
      severity: 'error',
      rule: 'SOL-CONTRACTS-缺',
      file: 'atlas/solution/contracts/',
      message: `契约已引用但缺文件：${missing.sort().join(', ')} → 在 contracts/ 建 API-/UI-/JOB-/EVT-*.md（或改暴露面为「无」）。`,
    });
  }
}
