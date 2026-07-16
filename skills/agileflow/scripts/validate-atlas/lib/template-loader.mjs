import path from 'node:path';
import fs from 'node:fs';
import { exists, readText } from './fs-utils.mjs';
import { resolveSkillRoot } from './skill-path.mjs';
import { TEMPLATE_CONVENTIONS } from './template-conventions.mjs';
import { parseEnvText } from './af-env.mjs';

const DEFAULT_PRESET = 'standard';
const VALID_PRESETS = new Set(['minimal', 'standard']);

/**
 * 解析当前项目使用的 template preset
 * 顺序：atlas/template/README.md → agileflow.env AF_TEMPLATE_PRESET → standard
 * @param {string} projectRoot
 * @returns {'minimal'|'standard'}
 */
export function resolveTemplatePreset(projectRoot) {
  const templateReadme = path.join(projectRoot, 'atlas', 'template', 'README.md');
  if (exists(templateReadme)) {
    const raw = readText(templateReadme) || '';
    const match = raw.match(/^-\s*preset:\s*(minimal|standard)\s*$/m);
    if (match && VALID_PRESETS.has(match[1])) {
      return /** @type {'minimal'|'standard'} */ (match[1]);
    }
  }

  const envPath = path.join(projectRoot, 'atlas', 'agileflow.env');
  const envRaw = readText(envPath);
  if (envRaw) {
    const map = parseEnvText(envRaw);
    if (map.AF_TEMPLATE_PRESET && VALID_PRESETS.has(map.AF_TEMPLATE_PRESET)) {
      return /** @type {'minimal'|'standard'} */ (map.AF_TEMPLATE_PRESET);
    }
  }

  return DEFAULT_PRESET;
}

/**
 * 解析 YAML frontmatter（简单键值，无嵌套数组外的复杂结构）
 * @param {string} raw
 */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: raw };

  const fm = match[1];
  const body = raw.slice(match[0].length).trimStart();
  /** @type {Record<string, unknown>} */
  const meta = {};
  let currentKey = '';
  /** @type {Record<string, unknown>} */
  let currentObj = meta;

  for (const line of fm.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const top = line.match(/^(\w+):\s*(.*)$/);
    if (top) {
      currentKey = top[1];
      const val = top[2].trim();
      if (val === '') {
        meta[currentKey] = {};
        currentObj = meta;
      } else if (val.startsWith('[') && val.endsWith(']')) {
        meta[currentKey] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        currentObj = meta;
      } else {
        meta[currentKey] = val.replace(/^["']|["']$/g, '');
        currentObj = meta;
      }
      continue;
    }

    const nested = line.match(/^\s{2}(\w+):\s*(.*)$/);
    if (nested && currentKey && typeof meta[currentKey] === 'object') {
      const subKey = nested[1];
      const subVal = nested[2].trim();
      /** @type {Record<string, unknown>} */
      const obj = meta[currentKey];
      if (subVal.startsWith('[') && subVal.endsWith(']')) {
        obj[subKey] = subVal
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else {
        obj[subKey] = subVal.replace(/^["']|["']$/g, '');
      }
    }
  }

  return { meta, body };
}

/**
 * 从 template 正文提取必填 ## 段名
 * @param {string} body
 */
export function extractRequiredSections(body) {
  return [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/**
 * 段名是否匹配（允许产物带后缀，如「验收（BDD）」匹配 template「验收」）
 * @param {string} required
 * @param {string} headingLine 不含 ##
 */
export function sectionMatches(required, headingLine) {
  const norm = headingLine.trim();
  if (norm === required) return true;
  if (norm.startsWith(required)) return true;
  const reqBase = required.replace(/[（(].*$/, '').trim();
  return norm.startsWith(reqBase);
}

/**
 * @param {string} projectRoot
 */
export function resolveTemplateMode(projectRoot) {
  const envPath = path.join(projectRoot, 'atlas', 'agileflow.env');
  const raw = readText(envPath);
  if (raw) {
    const map = parseEnvText(raw);
    return map.AF_TEMPLATE === 'yes';
  }
  return false;
}

/**
 * @param {string} projectRoot
 * @param {string} templateRel
 * @param {string} [preset]
 */
export function resolveTemplatePath(projectRoot, templateRel, preset = DEFAULT_PRESET) {
  const projectPath = path.join(projectRoot, 'atlas', 'template', templateRel);
  if (exists(projectPath)) {
    return { path: projectPath, source: 'project' };
  }

  const skillRoot = resolveSkillRoot(projectRoot);
  const presetPath = path.join(skillRoot, 'presets', preset, 'template', templateRel);
  if (exists(presetPath)) {
    return { path: presetPath, source: 'preset' };
  }

  return null;
}

/**
 * @param {string} projectRoot
 * @param {string} templateRel
 * @param {string} [preset]
 */
export function loadTemplateSpec(projectRoot, templateRel, preset = DEFAULT_PRESET) {
  const resolved = resolveTemplatePath(projectRoot, templateRel, preset);
  if (!resolved) return null;

  const raw = readText(resolved.path);
  if (!raw) return null;

  const { meta, body } = parseFrontmatter(raw);
  const convention = TEMPLATE_CONVENTIONS.find((c) => c.templateRel === templateRel);

  return {
    id: convention?.id ?? templateRel,
    templateRel,
    templatePath: resolved.path,
    source: resolved.source,
    target: typeof meta.target === 'string' ? meta.target : convention?.target ?? '',
    phase: convention?.phase ?? 'all',
    meta,
    requiredSections: extractRequiredSections(body),
    body,
  };
}

/**
 * 加载所有可用的 template spec（项目 + 默认 preset 合并）
 * @param {string} projectRoot
 * @param {{ preset?: string, phase?: string }} [opts]
 */
export function loadAllTemplateSpecs(projectRoot, opts = {}) {
  const preset = opts.preset ?? resolveTemplatePreset(projectRoot);
  const phase = opts.phase ?? 'all';
  /** @type {ReturnType<typeof loadTemplateSpec>[]} */
  const specs = [];

  for (const conv of TEMPLATE_CONVENTIONS) {
    if (phase !== 'all' && conv.phase !== phase) continue;

    const projectPath = path.join(projectRoot, 'atlas', 'template', conv.templateRel);
    const presetPath = path.join(
      resolveSkillRoot(projectRoot),
      'presets',
      preset,
      'template',
      conv.templateRel
    );

    if (!exists(projectPath) && !exists(presetPath)) continue;

    const spec = loadTemplateSpec(projectRoot, conv.templateRel, preset);
    if (spec) specs.push(spec);
  }

  return specs;
}

/**
 * 从 template 树推断 atlas 应存在的目录（template 模式用）
 * @param {string} projectRoot
 */
export function inferRequiredDirsFromTemplates(projectRoot, opts = {}) {
  const specs = loadAllTemplateSpecs(projectRoot, opts);
  /** @type {Set<string>} */
  const dirs = new Set();

  for (const spec of specs) {
    if (!spec.target) continue;
    const targetDir = path.dirname(spec.target.replace(/\\/g, '/'));
    if (targetDir && targetDir !== '.') {
      dirs.add(`atlas/${targetDir}`);
    }
  }

  return [...dirs];
}

/**
 * 复制 preset template 树到 atlas/template/
 * @param {string} projectRoot
 * @param {'minimal'|'standard'} preset
 */
export function bootstrapTemplateTree(projectRoot, preset = 'standard') {
  const skillRoot = resolveSkillRoot(projectRoot);
  const srcRoot = path.join(skillRoot, 'presets', preset, 'template');
  const destRoot = path.join(projectRoot, 'atlas', 'template');

  if (!exists(srcRoot)) {
    throw new Error(`preset template 不存在: ${srcRoot}`);
  }

  const copyRecursive = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      const srcPath = path.join(src, name);
      const destPath = path.join(dest, name);
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyRecursive(srcRoot, destRoot);

  const envPath = path.join(projectRoot, 'atlas', 'agileflow.env');
  let envContent = readText(envPath) ?? '';
  if (/AF_TEMPLATE=/.test(envContent)) {
    envContent = envContent.replace(/AF_TEMPLATE=.*/g, 'AF_TEMPLATE=yes');
  } else {
    envContent = envContent.trimEnd() + '\nAF_TEMPLATE=yes\n';
  }
  if (/AF_TEMPLATE_PRESET=/.test(envContent)) {
    envContent = envContent.replace(/AF_TEMPLATE_PRESET=.*/g, `AF_TEMPLATE_PRESET=${preset}`);
  } else {
    envContent = envContent.trimEnd() + `\nAF_TEMPLATE_PRESET=${preset}\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');

  return destRoot;
}
