import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { DEV_NINE_SECTIONS } from '../phase-spec.mjs';
import { Reporter } from '../reporter.mjs';

/** 勾①前字面量必过项 */
const LITERAL_REQUIRED = [
  { id: 'DEV-LIT-一段', pattern: '## 一、', label: '## 一、' },
  { id: 'DEV-LIT-五段', pattern: '## 五、', label: '## 五、' },
  { id: 'DEV-LIT-目的', pattern: '### 目的', label: '### 目的' },
  { id: 'DEV-LIT-需要什么', pattern: '### 需要什么', label: '### 需要什么' },
  { id: 'DEV-LIT-怎么做', pattern: '### 怎么做', label: '### 怎么做' },
  { id: 'DEV-LIT-步骤', pattern: '#### 5.', label: '#### 5.' },
];

/** 薄稿禁形 */
const LITERAL_FORBIDDEN = [
  { pattern: '## 一、目标', rule: 'DEV-BAN-目标段', msg: '禁形「## 一、目标」' },
  { pattern: '## 五、可执行方案', rule: 'DEV-BAN-可执行方案段', msg: '禁形「## 五、可执行方案」' },
  { pattern: '## ① 构思', rule: 'DEV-BAN-构思章', msg: '禁形「## ① 构思」' },
  { pattern: '## ② 关键实现点', rule: 'DEV-BAN-关键实现点章', msg: '禁形「## ② 关键实现点」' },
];

const REF_PATTERN = /→\s*\[|→\s*见|→\s*权威|\]\([^)]+\)/;

function buildSectionRegex(sec) {
  if (sec.altTitles) {
    const alts = sec.altTitles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const main = sec.title ? `${sec.title}|` : '';
    return new RegExp(`^## ${sec.num}、(${main}${alts})`, 'm');
  }
  return new RegExp(`^## ${sec.num}、${sec.title}`, 'm');
}

function extractSectionBody(content, sectionRegex) {
  const match = content.match(sectionRegex);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function isPendingOrReference(body) {
  if (!body) return false;
  if (/待补齐|（待补齐）/.test(body)) return true;
  return REF_PATTERN.test(body) && body.length < 400;
}

function hasReference(body) {
  return Boolean(body && REF_PATTERN.test(body));
}

function isFeDev(filePath, content) {
  if (/-FE\.md$/i.test(filePath)) return true;
  if (/端：\*\*FE\*\*/.test(content)) return true;
  return /\[FE\]|前端/.test(content.slice(0, 600));
}

function isFeWithUi(content) {
  return content.includes('### 3.1') || content.includes('### 3.2');
}

/** 原 G7：代码落点 */
function hasCodeAnchor(content) {
  return /`[^`]*\.[^`]*`/.test(content) || /pages\//.test(content) || /services\//.test(content);
}

/** FE 布局图 */
function hasFeLayoutDiagram(content) {
  return content.includes('### 3.1') && /[┌│+--]/.test(content);
}

function checkFakeNineSections(content) {
  const hasMd = /^## [一二三四五六七八九]、/m.test(content);
  const hasPlain = /^[一二三四五六七八九]、[^#]/m.test(content);
  return !hasMd && hasPlain;
}

function validateNineSections(projectRoot, filePath, content, reporter, mode) {
  const relPath = rel(projectRoot, filePath);
  const isFast = mode === 'fast';

  for (const sec of DEV_NINE_SECTIONS) {
    const regex = buildSectionRegex(sec);
    const label = sec.title ?? sec.altTitles?.join('|') ?? sec.num;

    if (!regex.test(content)) {
      reporter.add({
        severity: 'error',
        rule: `DEV-S${sec.num}`,
        file: relPath,
        message: `缺少九段标题「## ${sec.num}、${label}」。`,
      });
      continue;
    }

    const body = extractSectionBody(content, regex);

    if (sec.compressible && isFast && body && isPendingOrReference(body)) {
      continue;
    }

    if (sec.compressible && mode === 'strict' && body && /待补齐|（待补齐）/.test(body)) {
      reporter.add({
        severity: 'error',
        rule: `DEV-S${sec.num}-PENDING`,
        file: relPath,
        message: `严谨模式「## ${sec.num}、」不可仅待补齐，须引用 + 本 T 增量。`,
      });
    }

    if (sec.num === '一' && body && !/明确不做|不做/.test(body)) {
      reporter.add({
        severity: 'warn',
        rule: 'DEV-S1-SCOPE',
        file: relPath,
        message: '一、建议含「明确不做」≥1 条。',
      });
    }

    if (sec.num === '二' && body && !isFeDev(filePath, content) && !hasReference(body)) {
      if (/\|.*字段.*\|/.test(body) && body.length > 200) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-REF-002',
          file: relPath,
          message: '二、BE 宜 `→ [model/...](...)` + 本 T 增量，勿整表抄字段。',
        });
      }
    }

    if (sec.num === '三' && !isFeDev(filePath, content)) {
      if (body && /\|.*POST.*\|/i.test(body) && body.length > 300 && !hasReference(body)) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-REF-003',
          file: relPath,
          message: '三、BE 宜链 contracts/，勿重复贴 API 表。',
        });
      }
      if (!/复用盘点（BE）/.test(content)) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-D011-BE',
          file: relPath,
          message: 'BE 建议含「### 复用盘点（BE）」。',
        });
      }
    }
  }
}

/** 勾①前字面量校验 */
function runDevLiteralChecks(filePath, content, reporter, relPath) {
  if (checkFakeNineSections(content)) {
    reporter.add({ severity: 'error', rule: 'DEV-FAKE-假标题', file: relPath, message: '假九段（纯文本标题，无 ##）。' });
  }

  for (const item of LITERAL_REQUIRED) {
    if (!content.includes(item.pattern)) {
      reporter.add({ severity: 'error', rule: item.id, file: relPath, message: `缺少「${item.label}」。` });
    }
  }

  if (!hasCodeAnchor(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-LIT-代码落点',
      file: relPath,
      message: '缺少 Class.method / pages/ / services/。',
    });
  }

  for (const ban of LITERAL_FORBIDDEN) {
    if (content.includes(ban.pattern) && !(content.includes('### 目的') && content.includes('#### 5.'))) {
      reporter.add({ severity: 'error', rule: ban.rule, file: relPath, message: ban.msg });
    }
  }

  if (isFeDev(filePath, content) && isFeWithUi(content)) {
    if (!hasFeLayoutDiagram(content)) {
      reporter.add({ severity: 'error', rule: 'DEV-LIT-FE布局', file: relPath, message: 'FE 须 3.1 线条图。' });
    }
    if (!content.includes('### 3.2')) {
      reporter.add({ severity: 'error', rule: 'DEV-LIT-FE-3.2', file: relPath, message: '缺 ### 3.2。' });
    }
    if (!content.includes('### 3.3')) {
      reporter.add({ severity: 'error', rule: 'DEV-LIT-FE-3.3', file: relPath, message: '缺 ### 3.3。' });
    }
  }

  const section5Count = (content.match(/^#### 5\./gm) || []).length;
  if (content.replace(/\s/g, '').length < 800 && section5Count < 2) {
    reporter.add({ severity: 'error', rule: 'DEV-FAKE-过短', file: relPath, message: '文档过短，可能是薄稿。' });
  }
}

function validateDevFile(projectRoot, filePath, content, reporter, mode) {
  const relPath = rel(projectRoot, filePath);
  const baseName = path.basename(filePath);

  if (baseName === 'README.md' || baseName.startsWith('temp')) return;

  if (/顺序：⚠️ 先码后文档/.test(content)) {
    reporter.add({ severity: 'error', rule: 'DEV-A005', file: relPath, message: '补盘文档无效。' });
  }

  validateNineSections(projectRoot, filePath, content, reporter, mode);
  runDevLiteralChecks(filePath, content, reporter, relPath);
}

export function validateDev(projectRoot, reporter, opts = {}) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return;

  for (const file of collectFiles(devRoot, '.md')) {
    const content = readText(file);
    if (content) validateDevFile(projectRoot, file, content, reporter, opts.mode ?? 'auto');
  }
}

/** 单文件勾①前字面量校验（CLI --dev-file） */
export function runDevLiteralCheck(filePath, opts = {}) {
  const content = readText(filePath);
  if (!content) return { passed: false, issues: [{ rule: 'DEV-LIT', message: '文件不存在' }] };

  const reporter = new Reporter();
  const root = path.dirname(path.dirname(path.dirname(filePath)));
  const mode = opts.mode ?? 'auto';

  validateNineSections(root, filePath, content, reporter, mode);
  runDevLiteralChecks(filePath, content, reporter, filePath);

  const blocking = reporter.getIssues().filter((i) => i.severity === 'error');
  return {
    passed: blocking.length === 0,
    issues: blocking.map((i) => ({ rule: i.rule, message: i.message })),
  };
}

/** @deprecated 旧名，保留兼容 */
export const runA7Grep = runDevLiteralCheck;
