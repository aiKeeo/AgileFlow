import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { DEV_SECTIONS, RISK_TIERS } from '../phase-spec.mjs';
import { Reporter } from '../reporter.mjs';

/** 完整档字面量 */
const LITERAL_REQUIRED = [
  { id: 'DEV-LIT-范围', pattern: '## 范围', label: '## 范围' },
  { id: 'DEV-LIT-做法', pattern: '## 做法', label: '## 做法' },
  { id: 'DEV-LIT-步骤', pattern: '#### ', label: '#### 步骤小节' },
];

/** 过短文档 / 旧编号禁形 */
const LITERAL_FORBIDDEN = [
  { pattern: '## 一、目标', rule: 'DEV-BAN-旧标题', msg: '禁形旧标题「## 一、目标」→ 用 ## 范围' },
  { pattern: '## 五、可执行方案', rule: 'DEV-BAN-旧标题', msg: '禁形「## 五、可执行方案」→ 用 ## 做法' },
  { pattern: '## ① 构思', rule: 'DEV-BAN-构思章', msg: '禁形「## ① 构思」' },
  { pattern: '## ② 关键实现点', rule: 'DEV-BAN-关键实现点章', msg: '禁形「## ② 关键实现点」' },
];

function headingRegex(heading) {
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // CJK 后无 \b；允许行尾或空白/标点
  return new RegExp(`^${esc}(?:\\s|$|#|[（(：:])`, 'm');
}

function extractSectionBody(content, heading) {
  const regex = headingRegex(heading);
  const match = content.match(regex);
  if (!match || match.index === undefined) return null;
  const rest = content.slice(match.index + match[0].length);
  const next = rest.search(/^## /m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function isFeDev(filePath, content) {
  if (/-FE\.md$/i.test(filePath)) return true;
  if (/端：\*\*FE\*\*/.test(content)) return true;
  return /\[FE\]/.test(content.slice(0, 600));
}

function isFeWithUi(content) {
  return content.includes('### 布局') || content.includes('### 映射');
}

function hasCodeAnchor(content) {
  return /`[^`]*\.[^`]*`/.test(content) || /pages\//.test(content) || /services\//.test(content);
}

function hasFeLayoutDiagram(content) {
  return content.includes('### 布局') && /[┌│+--]/.test(content);
}

/** 假标题：有「范围/做法」纯文本却无 ## */
function checkFakeHeadings(content) {
  const hasMd = /^## (范围|契约|做法|AC|结果)/m.test(content);
  const hasPlain = /^(范围|契约|做法)[：:\s]/m.test(content);
  return !hasMd && hasPlain;
}

function validateSections(filePath, content, reporter, tier = 'standard') {
  const relPath = rel(path.dirname(path.dirname(path.dirname(filePath))), filePath);
  // when called with absolute path, prefer shorter rel via project root guess
  const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;

  for (const sec of DEV_SECTIONS) {
    if (!tierDef.sections.includes(sec.id)) continue;
    if (!headingRegex(sec.heading).test(content)) {
      reporter.add({
        severity: 'error',
        rule: `DEV-SEC-${sec.id}`,
        file: relPath,
        message: `缺少「${sec.heading}」。`,
      });
      continue;
    }

    if (sec.id === 'scope') {
      const body = extractSectionBody(content, sec.heading);
      if (body && !/不做|范围外|不做：/.test(body)) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-SCOPE-不做',
          file: relPath,
          message: '「## 范围」建议含「明确不做」≥1 条。',
        });
      }
    }

    if (sec.id === 'contract' && !isFeDev(filePath, content)) {
      const body = extractSectionBody(content, sec.heading);
      if (body && body.length > 400 && !/\]\([^)]+\)/.test(body)) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-CONTRACT-宜链',
          file: relPath,
          message: '「## 契约」BE 宜链 contracts/，勿大段抄 API。',
        });
      }
    }
  }
}

function runDevLiteralChecks(filePath, content, reporter, relPath, tier = 'standard') {
  const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;

  if (tierDef.fakeHeadingCheck && checkFakeHeadings(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-FAKE-标题',
      file: relPath,
      message: '假标题（纯文本无 ##）。',
    });
  }

  if (tierDef.literalCheck) {
    for (const item of LITERAL_REQUIRED) {
      if (!content.includes(item.pattern)) {
        reporter.add({
          severity: 'error',
          rule: item.id,
          file: relPath,
          message: `缺少「${item.label}」。`,
        });
      }
    }
    for (const ban of LITERAL_FORBIDDEN) {
      if (content.includes(ban.pattern)) {
        reporter.add({ severity: 'error', rule: ban.rule, file: relPath, message: ban.msg });
      }
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

  // FE+UI：标准/完整有契约时检查布局
  if (isFeDev(filePath, content) && (isFeWithUi(content) || tierDef.sections.includes('contract'))) {
    if (tierDef.sections.includes('contract')) {
      if (!hasFeLayoutDiagram(content)) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-LIT-FE布局',
          file: relPath,
          message: 'FE 须「### 布局」含 ASCII 线条图。',
        });
      }
      if (!content.includes('### 映射')) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-LIT-FE映射',
          file: relPath,
          message: '缺 ### 映射。',
        });
      }
    }
  }

  const stepCount = (content.match(/^#### /gm) || []).length;
  if (content.replace(/\s/g, '').length < tierDef.minDocLength && stepCount < 1) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-FAKE-过短',
      file: relPath,
      message: '文档过短且无 #### 步骤，可能是过短文档。',
    });
  }
}

function validateDevFile(projectRoot, filePath, content, reporter, mode, tier = 'standard') {
  const relPath = rel(projectRoot, filePath);
  const baseName = path.basename(filePath);
  if (baseName === 'README.md' || baseName.startsWith('temp')) return;

  if (/顺序：⚠️ 先码后文档/.test(content)) {
    reporter.add({ severity: 'error', rule: 'DEV-A005', file: relPath, message: '事后补写文档无效。' });
  }

  validateSections(filePath, content, reporter, tier);
  // fix relPath for validateSections messages — re-run with project-relative via reporter already using guessed path
  // Overwrite: call section check with proper rel
  runDevLiteralChecks(filePath, content, reporter, relPath, tier);
}

export function validateDev(projectRoot, reporter, opts = {}) {
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return;

  const tier = opts.tier ?? 'standard';
  for (const file of collectFiles(devRoot, '.md')) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);
    const baseName = path.basename(file);
    if (baseName === 'README.md' || baseName.startsWith('temp')) continue;

    if (/顺序：⚠️ 先码后文档/.test(content)) {
      reporter.add({ severity: 'error', rule: 'DEV-A005', file: relPath, message: '事后补写文档无效。' });
    }

    const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;
    for (const sec of DEV_SECTIONS) {
      if (!tierDef.sections.includes(sec.id)) continue;
      if (!headingRegex(sec.heading).test(content)) {
        reporter.add({
          severity: 'error',
          rule: `DEV-SEC-${sec.id}`,
          file: relPath,
          message: `缺少「${sec.heading}」。`,
        });
      } else if (sec.id === 'scope') {
        const body = extractSectionBody(content, sec.heading);
        if (body && !/不做|范围外/.test(body)) {
          reporter.add({
            severity: 'warn',
            rule: 'DEV-SCOPE-不做',
            file: relPath,
            message: '「## 范围」建议含「明确不做」。',
          });
        }
      }
    }
    runDevLiteralChecks(filePath, content, reporter, relPath, tier);
  }
}

export function runDevLiteralCheck(filePath, opts = {}) {
  const content = readText(filePath);
  if (!content) return { passed: false, issues: [{ rule: 'DEV-LIT', message: '文件不存在' }] };

  const reporter = new Reporter();
  const tier = opts.tier ?? 'standard';
  const relPath = filePath;
  const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;

  for (const sec of DEV_SECTIONS) {
    if (!tierDef.sections.includes(sec.id)) continue;
    if (!headingRegex(sec.heading).test(content)) {
      reporter.add({
        severity: 'error',
        rule: `DEV-SEC-${sec.id}`,
        file: relPath,
        message: `缺少「${sec.heading}」。`,
      });
    }
  }
  runDevLiteralChecks(filePath, content, reporter, relPath, tier);

  const blocking = reporter.getIssues().filter((i) => i.severity === 'error');
  return {
    passed: blocking.length === 0,
    issues: blocking.map((i) => ({ rule: i.rule, message: i.message })),
  };
}

export const runA7Grep = runDevLiteralCheck;
