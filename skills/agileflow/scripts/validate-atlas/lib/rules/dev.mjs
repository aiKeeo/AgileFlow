import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { DEV_MIN_PURPOSE_STEPS, DEV_SECTIONS, RISK_TIERS } from '../phase-spec.mjs';
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
  return (
    /`[^`]*\.[^`]*`/.test(content) ||
    /`[^`]+\([^)]*\)`/.test(content) ||
    /`[^`]+\/[^`]+`/.test(content) ||
    /pages\//.test(content) ||
    /services\//.test(content)
  );
}

/** FE 布局：链 UID 或「布局差量」含 ASCII */
function hasValidFeLayout(content) {
  if (!content.includes('### 布局')) return false;
  const layoutMatch = content.match(/### 布局[\s\S]*?(?=### |## |$)/);
  const body = layoutMatch ? layoutMatch[0] : '';
  const linksUid =
    /UID-\d+/i.test(body) ||
    /requirements\/ui\//i.test(body) ||
    /\]\([^)]*UID[^)]*\)/i.test(body);
  const hasDelta = /布局差量/.test(content) && /[┌│+--]/.test(content);
  const hasAsciiInLayout = /[┌│+--]/.test(body);
  return linksUid || hasDelta || hasAsciiInLayout;
}

function checkFakeHeadings(content) {
  const hasMd = /^## (前置|必读|范围|契约|做法|AC|结果)/m.test(content);
  const hasPlain = /^(范围|契约|做法)[：:\s]/m.test(content);
  return !hasMd && hasPlain;
}

function collectStepHeadings(content) {
  return [...content.matchAll(/^#### .+$/gm)].map((m) => m[0]);
}

function hasMustReadLink(mustReadBody) {
  if (!mustReadBody) return false;
  return (
    /requirements\//i.test(mustReadBody) ||
    /solution\/contracts\//i.test(mustReadBody) ||
    /\]\([^)]*REQ-\d+/i.test(mustReadBody) ||
    /\]\([^)]*API-\d+/i.test(mustReadBody) ||
    /\]\([^)]*UID-\d+/i.test(mustReadBody)
  );
}

/** 契约体内大段 JSON 代码块 */
function hasLargeJsonInContract(contractBody) {
  if (!contractBody) return false;
  const blocks = [...contractBody.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi)];
  for (const block of blocks) {
    const body = block[1] || '';
    if (body.includes('{') && body.includes('}') && body.length >= 80) {
      return true;
    }
  }
  return false;
}

/** 大 ASCII 线框且未标布局差量 */
function hasUnlabeledWireframeCopy(content) {
  if (/布局差量/.test(content)) return false;
  const boxLines = (content.match(/^[│┌└├┤┐┘]/gm) || []).length;
  return boxLines >= 6;
}

function runQualityChecks(filePath, content, reporter, relPath, tier = 'standard') {
  const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;
  const minSteps = DEV_MIN_PURPOSE_STEPS[tier] ?? DEV_MIN_PURPOSE_STEPS.standard;

  const steps = collectStepHeadings(content);
  if (steps.length > 0) {
    for (const line of steps) {
      if (!/目的[：:]/.test(line)) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-STEP-目的',
          file: relPath,
          message: `步骤标题缺「目的：」：${line.slice(0, 80)}`,
        });
      }
    }
  }
  if (steps.length < minSteps) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-STEP-最少',
      file: relPath,
      message: `${tierDef.label}须至少 ${minSteps} 个带「目的：」的 #### 步骤（当前 ${steps.length}）。`,
    });
  }

  if (tierDef.requireMustRead) {
    const mustRead = extractSectionBody(content, '## 必读');
    if (!mustRead || !hasMustReadLink(mustRead)) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-PRE-必读',
        file: relPath,
        message: '标准+须「## 必读」且含指向 requirements/ 或 solution/contracts/（或 REQ/API/UID）的链接。',
      });
    }
  }

  const contractBody = extractSectionBody(content, '## 契约');
  if (hasLargeJsonInContract(contractBody)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-COPY-API表',
      file: relPath,
      message: '「## 契约」内勿粘贴大段 JSON；请链 contracts/API。',
    });
  }

  if (hasUnlabeledWireframeCopy(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'DEV-COPY-线框',
      file: relPath,
      message: '检测到大段 ASCII 线框且未标「布局差量」；线框权威在 UID，请改为链接。',
    });
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
      message: '缺少代码落点（OOP: `Class.method` / 函数式: `func()` / 路径型: `path/to`）。',
    });
  }

  if (isFeDev(filePath, content) && (isFeWithUi(content) || tierDef.sections.includes('contract'))) {
    if (tierDef.sections.includes('contract')) {
      if (!hasValidFeLayout(content)) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-LIT-FE布局',
          file: relPath,
          message: 'FE 须「### 布局」且（链 UID 或「布局差量」含 ASCII）。',
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

  runQualityChecks(filePath, content, reporter, relPath, tier);
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
    runDevLiteralChecks(file, content, reporter, relPath, tier);
  }
}

export function runDevLiteralCheck(filePath, opts = {}) {
  const content = readText(filePath);
  if (!content) return { passed: false, issues: [{ rule: 'DEV-LIT', message: '文件不存在' }] };

  const reporter = new Reporter();
  const tier = opts.tier ?? 'standard';
  const relPath = filePath;

  for (const sec of DEV_SECTIONS) {
    const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;
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
