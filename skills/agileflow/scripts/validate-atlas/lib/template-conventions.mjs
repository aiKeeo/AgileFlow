/**
 * template 目录 → 产物路径约定（镜像 atlas/ 同级目录名）
 * @typedef {{ id: string, templateRel: string, target: string, phase: string }} TemplateConvention
 */

/** @type {TemplateConvention[]} */
export const TEMPLATE_CONVENTIONS = [
  {
    id: 'req',
    templateRel: 'requirements/template-req.md',
    target: 'requirements/REQ-*.md',
    phase: '1',
  },
  {
    id: 'ui',
    templateRel: 'requirements/ui/template-ui.md',
    target: 'requirements/ui/UID-*.md',
    phase: '1',
  },
  {
    id: 'sol-architecture',
    templateRel: 'solution/template-architecture.md',
    target: 'solution/architecture.md',
    phase: '3',
  },
  {
    id: 'sol-feature',
    templateRel: 'solution/features/template-feature.md',
    target: 'solution/features/F-*.md',
    phase: '3',
  },
  {
    id: 'sol-api',
    templateRel: 'solution/contracts/template-api.md',
    target: 'solution/contracts/API-*.md',
    phase: '3',
  },
  {
    id: 'sol-ui-contract',
    templateRel: 'solution/contracts/template-ui.md',
    target: 'solution/contracts/UI*.md',
    phase: '3',
  },
  { id: 'dev', templateRel: 'dev/template-dev.md', target: 'dev/T-*.md', phase: '4' },
  {
    id: 'test-report',
    templateRel: 'tests/template-report.md',
    target: 'tests/**/*.md',
    phase: '5',
  },
];

/**
 * 将 glob 转为 RegExp（仅支持 * 与 **）
 * @param {string} glob
 */
export function globToRegExp(glob) {
  const normalized = glob.replace(/\\/g, '/');
  let regex = '';
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '*' && normalized[i + 1] === '*') {
      regex += '.*';
      i++;
    } else if (ch === '*') {
      regex += '[^/]*';
    } else if (/[+?^${}()|[\]\\.]/.test(ch)) {
      regex += `\\${ch}`;
    } else {
      regex += ch;
    }
  }
  return new RegExp(`^${regex}$`);
}

/**
 * @param {string} glob
 * @param {string} relPath
 */
export function matchGlob(glob, relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return globToRegExp(glob).test(norm);
}
