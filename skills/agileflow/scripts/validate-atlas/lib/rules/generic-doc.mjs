import path from 'node:path';
import { collectFiles, readText, rel } from '../fs-utils.mjs';
import { matchGlob } from '../template-conventions.mjs';
import {
  extractRequiredSections,
  loadAllTemplateSpecs,
  loadTemplateSpec,
  parseFrontmatter,
  resolveTemplatePreset,
  sectionMatches,
} from '../template-loader.mjs';
import { validateNarrativeFlow, NarrativeIssueType } from './dev/narrative-flow.mjs';

/**
 * 列出 atlas 下匹配 target glob 的产物文件
 * @param {string} projectRoot
 * @param {string} targetGlob
 */
function collectTargetFiles(projectRoot, targetGlob) {
  const atlasRoot = path.join(projectRoot, 'atlas');
  const globNorm = targetGlob.replace(/\\/g, '/');

  if (!globNorm.includes('*')) {
    const abs = path.join(atlasRoot, globNorm);
    const content = readText(abs);
    return content ? [{ abs, relPath: `atlas/${globNorm}` }] : [];
  }

  const allMd = collectFiles(atlasRoot, '.md');
  return allMd
    .map((abs) => {
      const relPath = rel(projectRoot, abs).replace(/\\/g, '/');
      return { abs, relPath };
    })
    .filter(({ relPath }) => {
      const sub = relPath.replace(/^atlas\//, '');
      return matchGlob(globNorm, sub);
    })
    .filter(({ relPath }) => {
      const base = path.basename(relPath);
      return base !== 'README.md' && !base.startsWith('_');
    });
}

/**
 * @param {string} content
 */
function listProductHeadings(content) {
  return [...content.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/**
 * @param {string} content
 * @param {string} sectionName
 */
function findSectionBody(content, sectionName) {
  const headings = [...content.matchAll(/^## (.+)$/gm)];
  for (let i = 0; i < headings.length; i++) {
    const name = headings[i][1].trim();
    if (!sectionMatches(sectionName, name)) continue;
    const start = headings[i].index + headings[i][0].length;
    const next = content.slice(start).search(/^## /m);
    const body = (next === -1 ? content.slice(start) : content.slice(start, start + next)).trim();
    return body;
  }
  return null;
}

/**
 * @param {unknown} meta
 * @param {string} key
 * @param {unknown} fallback
 */
function metaGet(meta, key, fallback) {
  if (meta && typeof meta === 'object' && key in meta) return meta[key];
  return fallback;
}

/** @param {unknown} raw */
function parseForbiddenList(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

/**
 * 校验 AC 格式
 * @param {string} content
 * @param {'bullet'|'table'} format
 */
function validateAcFormat(content, format, reporter, relPath) {
  if (format === 'table') {
    if (!/\|\s*AC ID\s*\|/.test(content) && !/\|\s*AC-\d+/.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'TMPL-AC-TABLE',
        file: relPath,
        message: 'template 要求 AC 表格（须含 AC ID 列或 AC-xxx 列）。',
      });
    }
    return;
  }

  if (!/\*\*AC-\d+/.test(content) && !/\bAC-\d+(-\d+)?\b/.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-AC-BULLET',
      file: relPath,
      message: 'template 要求 AC bullet（须含 AC-xxx）。',
    });
  }
}

/**
 * dev 专检
 * @param {string} content
 * @param {Record<string, unknown>} meta
 * @param {string} relPath
 * @param {import('../reporter.mjs').Reporter} reporter
 */
function validateDevFromTemplate(content, meta, relPath, reporter) {
  /** @type {string[]} */
  const summaryBullets = Array.isArray(meta.summaryBullets)
    ? meta.summaryBullets
    : typeof meta.summaryBullets === 'string'
      ? meta.summaryBullets.split(',').map((s) => s.trim()).filter(Boolean)
      : ['本T', '做', '不做', '上游', 'AC'];

  const summaryBody = findSectionBody(content, '摘要');
  if (summaryBody && summaryBullets.length) {
    const patterns = {
      本T: /-\s*\*\*本\s*T\*\*[：:]\s*\S/,
      做: /-\s*\*\*做\*\*[：:]\s*\S/,
      不做: /-\s*\*\*不做\*\*[：:]\s*\S/,
      上游: /-\s*\*\*上游\*\*[：:]\s*\S/,
      AC: /-\s*\*\*AC\*\*[：:]\s*\S/,
    };
    for (const b of summaryBullets) {
      const pat = patterns[b] ?? new RegExp(`\\*\\*${b}\\*\\*`);
      if (!pat.test(summaryBody)) {
        reporter.add({
          severity: 'error',
          rule: 'TMPL-DEV-SUMMARY',
          file: relPath,
          message: `摘要须含 **${b}** bullet（见 template-dev）。`,
        });
      }
    }
  }

  if (/^##\s*步骤(\s|$)/m.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-DEV-BAN-步骤',
      file: relPath,
      message: '禁「## 步骤」；template-dev 须用 主流程+边界+实现说明。',
    });
  }

  const narrativeRuleMap = {
    [NarrativeIssueType.FLOW_ENTRY]: 'TMPL-DEV-FLOW-ENTRY',
    [NarrativeIssueType.FLOW_MIN]: 'TMPL-DEV-FLOW-MIN',
    [NarrativeIssueType.FLOW_ANCHOR]: 'TMPL-DEV-FLOW-ANCHOR',
    [NarrativeIssueType.EDGE_EMPTY]: 'TMPL-DEV-EDGE',
    [NarrativeIssueType.IMPL_BLOCK]: 'TMPL-DEV-IMPL-BLOCK',
    [NarrativeIssueType.IMPL_FIELDS]: 'TMPL-DEV-IMPL-FIELDS',
    [NarrativeIssueType.IMPL_ANCHOR]: 'TMPL-DEV-IMPL-ANCHOR',
  };
  for (const issue of validateNarrativeFlow(content)) {
    reporter.add({
      severity: 'error',
      rule: narrativeRuleMap[issue.type] ?? 'TMPL-DEV-NARRATIVE',
      file: relPath,
      message: issue.message,
    });
  }

  const forbidden = parseForbiddenList(metaGet(meta, 'forbidden', []));
  if (forbidden.length) {
    for (const f of forbidden) {
      if (content.includes(String(f))) {
        reporter.add({
          severity: 'error',
          rule: 'TMPL-FORBIDDEN',
          file: relPath,
          message: `禁止段「${f}」（见 template-dev）。`,
        });
      }
    }
  }

  // 与 legacy 同向：禁范围/做法空壳、禁「写码后填」冒充构思
  const hasScopeDo = /^##\s*范围(\s|$)/m.test(content) || /^##\s*做法(\s|$)/m.test(content);
  const missingSummary = !/^##\s*摘要(\s|$)/m.test(content);
  const missingFlow = !/^##\s*主流程(\s|$)/m.test(content);
  if (hasScopeDo && (missingSummary || missingFlow)) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-DEV-STUB',
      file: relPath,
      message: '禁止「## 范围/做法」空壳；须先写 ## 摘要 + ## 主流程 + ## 边界 + ## 实现说明。',
    });
  }
  const resultBody = findSectionBody(content, '结果') ?? '';
  if (/写码后填|写码后补|编码后填|事后补|先码后|③\s*后填|勾③后填/i.test(resultBody)) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-DEV-RESULT-PLACEHOLDER',
      file: relPath,
      message: '## 结果 禁止「写码后填」类占位；勾③前须真跑证据。构思须在①写满。',
    });
  }
}

/**
 * @param {string} projectRoot
 * @param {import('../template-loader.mjs').loadTemplateSpec extends (...args: any[]) => infer R ? R : never} spec
 */
function validateOneSpec(projectRoot, spec, reporter, opts) {
  const meta = spec.meta ?? {};
  const target = spec.target;
  if (!target) return;

  const files = collectTargetFiles(projectRoot, target);
  const forbidden = parseForbiddenList(metaGet(meta, 'forbidden', []));
  const acMeta = metaGet(meta, 'ac', null);
  const acFormat =
    (typeof acMeta === 'object' && acMeta && acMeta.format) ||
    meta.acFormat ||
    null;

  if (files.length === 0 && spec.id !== 'test-report') {
    reporter.add({
      severity: 'info',
      rule: 'TMPL-NO-DOCS',
      file: spec.templateRel,
      message: `template「${spec.id}」目标 ${target} 暂无产物文件（未落盘前不阻断）。`,
    });
    return;
  }

  for (const { abs, relPath } of files) {
    const content = readText(abs);
    if (!content) continue;

    const headings = listProductHeadings(content);

    for (const reqSec of spec.requiredSections) {
      const found = headings.some((h) => sectionMatches(reqSec, h));
      if (!found) {
        reporter.add({
          severity: 'error',
          rule: 'TMPL-SEC-MISS',
          file: relPath,
          message: `缺少 template 要求的段「## ${reqSec}」。`,
        });
      }
    }

    if (forbidden.length) {
      for (const f of forbidden) {
        if (content.includes(String(f))) {
          reporter.add({
            severity: 'error',
            rule: 'TMPL-FORBIDDEN',
            file: relPath,
            message: `禁止段「${f}」。`,
          });
        }
      }
    }

    if (acFormat === 'bullet' || acFormat === 'table') {
      validateAcFormat(content, acFormat, reporter, relPath);
    }

    if (spec.id === 'dev') {
      validateDevFromTemplate(content, meta, relPath, reporter);
    }
  }
}

/**
 * template 模式：按 atlas/template/（+ preset 回退）校验产物
 * @param {string} projectRoot
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ phase?: string, tier?: string }} [opts]
 */
export function validateGenericDocs(projectRoot, reporter, opts = {}) {
  const phase = opts.phase ?? 'all';
  const specs = loadAllTemplateSpecs(projectRoot, { phase: phase === 'all' ? 'all' : phase });

  if (specs.length === 0) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-EMPTY',
      file: 'atlas/template/',
      message: 'template 模式已启用但未找到任何 template 定义（检查 preset 安装）。',
    });
    return;
  }

  for (const spec of specs) {
    if (phase !== 'all' && spec.phase !== phase) continue;
    validateOneSpec(projectRoot, spec, reporter, opts);
  }
}

/**
 * template 模式：单 dev 文件字面量 + 段结构（dev-step1-literal 闸门用）
 * @param {string} projectRoot
 * @param {string} filePath
 * @param {import('../reporter.mjs').Reporter} reporter
 * @param {{ tier?: string }} [opts]
 */
export function validateDevFileFromTemplate(projectRoot, filePath, reporter, opts = {}) {
  const preset = resolveTemplatePreset(projectRoot);
  const spec = loadTemplateSpec(projectRoot, 'dev/template-dev.md', preset);
  if (!spec) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-EMPTY',
      file: 'dev/template-dev.md',
      message: 'template 模式但未找到 dev/template-dev.md（检查 preset 安装）。',
    });
    return;
  }

  const content = readText(filePath);
  if (!content) {
    reporter.add({
      severity: 'error',
      rule: 'TMPL-DEV-MISS',
      file: filePath,
      message: 'dev 文件不存在或为空。',
    });
    return;
  }

  const relPath = rel(projectRoot, filePath);
  const meta = spec.meta ?? {};
  const headings = listProductHeadings(content);

  for (const reqSec of spec.requiredSections) {
    const found = headings.some((h) => sectionMatches(reqSec, h));
    if (!found) {
      reporter.add({
        severity: 'error',
        rule: 'TMPL-SEC-MISS',
        file: relPath,
        message: `缺少 template 要求的段「## ${reqSec}」。`,
      });
    }
  }

  const forbidden = parseForbiddenList(metaGet(meta, 'forbidden', []));
  for (const f of forbidden) {
    if (content.includes(String(f))) {
      reporter.add({
        severity: 'error',
        rule: 'TMPL-FORBIDDEN',
        file: relPath,
        message: `禁止段「${f}」（见 template-dev）。`,
      });
    }
  }

  validateDevFromTemplate(content, meta, relPath, reporter, opts.tier ?? 'standard');
}
