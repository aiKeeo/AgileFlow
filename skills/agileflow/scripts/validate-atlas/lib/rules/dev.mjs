import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../fs-utils.mjs';
import { DEV_MIN_STEPS, DEV_SECTIONS, RISK_TIERS } from '../phase-spec.mjs';
import { Reporter } from '../reporter.mjs';
import { resolveTemplateMode } from '../template-loader.mjs';
import { resolveDevSteps, isCodeAnchor } from './dev-steps.mjs';
import { validateDevFileFromTemplate } from './generic-doc.mjs';

/**
 * 从 dev 文件路径反推项目根（…/atlas/dev/T-xxx.md）
 * @param {string} filePath
 */
function resolveProjectRootFromDevFile(filePath) {
  const abs = path.resolve(filePath);
  const parts = abs.split(path.sep);
  const devIdx = parts.lastIndexOf('dev');
  if (devIdx <= 0 || parts[devIdx - 1] !== 'atlas') return null;
  return parts.slice(0, devIdx - 1).join(path.sep);
}

/** 完整档字面量（#### 在有流程表时可缺） */
const LITERAL_REQUIRED = [
  { id: 'DEV-LIT-摘要', pattern: '## 摘要', label: '## 摘要' },
  { id: 'DEV-LIT-步骤', pattern: '## 步骤', label: '## 步骤' },
];

/** 过短文档 / 旧编号禁形 */
const LITERAL_FORBIDDEN = [
  { pattern: '## 一、目标', rule: 'DEV-BAN-旧标题', msg: '禁形旧标题「## 一、目标」→ 用 ## 摘要' },
  { pattern: '## 五、可执行方案', rule: 'DEV-BAN-旧标题', msg: '禁形「## 五、可执行方案」→ 用 ## 步骤' },
  { pattern: '## ① 构思', rule: 'DEV-BAN-构思章', msg: '禁形「## ① 构思」' },
  { pattern: '## ② 关键实现点', rule: 'DEV-BAN-关键实现点章', msg: '禁形「## ② 关键实现点」' },
];

/** v9.11 禁止的冗余专节 */
const DEV_BANNED_SECTIONS = [
  { heading: '## 范围', rule: 'DEV-BAN-范围', msg: '禁止「## 范围」→ 做/不做并入 ## 摘要' },
  { heading: '## 异常', rule: 'DEV-BAN-异常', msg: '禁止「## 异常」→ 步骤 **系统** 引 AC-xxx' },
  { heading: '## AC', rule: 'DEV-BAN-AC', msg: '禁止「## AC」表 → 摘要列 AC ID，步骤引 AC' },
];

/** 标准+ 摘要须含的五类 bullet */
const SUMMARY_BULLETS = [
  { id: '本T', pattern: /-\s*\*\*本\s*T\*\*[：:]/ },
  { id: '做', pattern: /-\s*\*\*做\*\*[：:]/ },
  { id: '不做', pattern: /-\s*\*\*不做\*\*[：:]/ },
  { id: '上游', pattern: /-\s*\*\*上游\*\*[：:]/ },
  { id: 'AC', pattern: /-\s*\*\*AC\*\*[：:]/ },
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

function hasCodeAnchor(content) {
  return (
    /`[^`]*\.[^`]*`/.test(content) ||
    /`[^`]+\([^)]*\)`/.test(content) ||
    /`[^`]+\/[^`]+`/.test(content) ||
    /pages\//.test(content) ||
    /services\//.test(content)
  );
}

function checkFakeHeadings(content) {
  const hasMd = /^## (摘要|步骤|结果)/m.test(content);
  const hasPlain = /^(范围|步骤|摘要)[：:\s]/m.test(content);
  return !hasMd && hasPlain;
}


/** dev 内禁止大段字段映射表（应在 contracts/UI） */
function hasDevFieldMappingTable(content) {
  if (/字段映射|字段绑定/.test(content) && /\|[^|]+\|[^|]+\|[^|]+\|/.test(content)) {
    if (isFeDev('', content) && /### 映射/.test(content)) return true;
    if (/页面上|请求字段|发给后端/.test(content)) return true;
  }
  return false;
}

/** 大段 JSON 粘贴 */
function hasLargeJsonPaste(content) {
  const blocks = [...content.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi)];
  for (const block of blocks) {
    const body = block[1] || '';
    if (body.includes('{') && body.includes('}') && body.length >= 80) {
      return true;
    }
  }
  return false;
}

function hasStepTriple(body) {
  const hasUser = /-\s*\*\*用户\*\*[：:]/.test(body);
  const hasSystem = /-\s*\*\*系统\*\*[：:]/.test(body);
  const hasChange = /-\s*\*\*改\*\*[：:]/.test(body);
  return hasUser && hasSystem && hasChange;
}

function hasSummary定位(content) {
  const summary = extractSectionBody(content, '## 摘要');
  if (!summary) return false;
  return /-\s*\*\*本\s*T\*\*[：:]/.test(summary) || /本\s*T\s*=/.test(summary);
}

function hasStructuredSummary(content) {
  const summary = extractSectionBody(content, '## 摘要');
  if (!summary) return false;
  return SUMMARY_BULLETS.every((b) => b.pattern.test(summary));
}

function hasSolLink(content, isFe) {
  if (isFe) {
    return (
      /solution\/contracts\/UI-/i.test(content) ||
      /\[UI-\d+\]/i.test(content.slice(0, 1200)) ||
      /solution\/features\/F-/i.test(content) ||
      /\[F-\d+\]/i.test(content.slice(0, 800)) ||
      /requirements\/ui\/UID-/i.test(content) ||
      /\[UID-\d+\]/i.test(content.slice(0, 1200))
    );
  }
  return (
    /solution\/contracts\/API-/i.test(content) ||
    /\[API-\d+\]/i.test(content.slice(0, 800))
  );
}

function feLinksApiWithoutUi(content) {
  if (!isFeDev('', content)) return false;
  const hasApi =
    /solution\/contracts\/API-/i.test(content) ||
    /\[API-\d+\]/i.test(content.slice(0, 1200));
  const hasUi =
    /solution\/contracts\/UI-/i.test(content) ||
    /\[UI-\d+\]/i.test(content.slice(0, 1200));
  return hasApi && !hasUi;
}

function checkBannedDevSections(content, reporter, relPath) {
  for (const ban of DEV_BANNED_SECTIONS) {
    if (headingRegex(ban.heading).test(content)) {
      reporter.add({ severity: 'error', rule: ban.rule, file: relPath, message: ban.msg });
    }
  }
}

function runQualityChecks(filePath, content, reporter, relPath, tier = 'standard') {
  const tierDef = RISK_TIERS[tier] ?? RISK_TIERS.standard;
  const minSteps = DEV_MIN_STEPS[tier] ?? DEV_MIN_STEPS.standard;

  checkBannedDevSections(content, reporter, relPath);

  if (tierDef.requireSummary && !headingRegex('## 摘要').test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-SUMMARY',
      file: relPath,
      message: '须「## 摘要」。',
    });
  } else if (tierDef.requireSummary && !hasSummary定位(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-SUMMARY-定位',
      file: relPath,
      message: '「## 摘要」须含 **本 T** 定位（如：- **本 T**：F-008 后端切片…）。',
    });
  } else if (tierDef.requireStructuredSummary && !hasStructuredSummary(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-SUMMARY-结构',
      file: relPath,
      message: '标准+「## 摘要」须含 **本 T** / **做** / **不做** / **上游** / **AC** 五类 bullet。',
    });
  }

  const stepsSection = extractSectionBody(content, '## 步骤') ?? '';
  const resolved = resolveDevSteps(stepsSection);

  if (tierDef.requireFlowTable && resolved.mode !== 'flow') {
    reporter.add({
      severity: 'error',
      rule: 'DEV-STEP-FULL-须流程表',
      file: relPath,
      message: '完整档须用流程表（S1… 注意点含落点），禁纯 #### 精简句式。',
    });
  }

  if (resolved.count < minSteps) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-STEP-最少',
      file: relPath,
      message: `${tierDef.label}须至少 ${minSteps} 步（流程表 S1… 或 ####；当前 ${resolved.count}）。`,
    });
  }

  if (resolved.mode === 'flow') {
    for (const step of resolved.flow) {
      if (!step.hasAnchor) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-STEP-流程落点',
          file: relPath,
          message: `${step.id} 注意点须含代码落点 \`Class.method\` / \`path/\`（继续走/在…上加/照…/新写）。`,
        });
      }
    }
  } else {
    for (const step of resolved.hash) {
      if (!hasStepTriple(step.body)) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-STEP-3',
          file: relPath,
          message: `步骤须含 用户/系统/改 三行：${step.heading.slice(0, 60)}`,
        });
      }
      const changeLine = step.body.match(/-\s*\*\*(?:改|涉及改动)\*\*[：:]([\s\S]*?)(?=\n-|\n*$)/);
      if (changeLine && !isCodeAnchor(changeLine[1])) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-STEP-改锚点',
          file: relPath,
          message: `「改/涉及改动」行须含代码落点 \`Class.method\`：${step.heading.slice(0, 50)}`,
        });
      }
      const systemLine = step.body.match(/-\s*\*\*系统\*\*[：:]([\s\S]*?)(?=\n-|\n*$)/);
      if (systemLine && !/AC-\d+|AC-\d+-\d+|\b\d{3}\b|toast|401|404|201|200/.test(systemLine[1])) {
        reporter.add({
          severity: 'warn',
          rule: 'DEV-STEP-系统',
          file: relPath,
          message: `「系统」行建议含 AC-xxx 或可验 HTTP/toast：${step.heading.slice(0, 50)}`,
        });
      }
    }
  }

  const fe = isFeDev(filePath, content);
  if (tier !== 'lite' && !hasSolLink(content, fe)) {
    reporter.add({
      severity: 'error',
      rule: fe ? 'DEV-LINK-UI' : 'DEV-LINK-API',
      file: relPath,
      message: fe
        ? 'FE dev 须链 F / UI-xxx / UID-xxx（调 API 时须 UI-xxx §字段绑定）。'
        : 'BE dev 须链 API（solution/contracts/API-xxx 或文内 API-xxx）。',
    });
  }

  if (fe && feLinksApiWithoutUi(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-LINK-UI-API',
      file: relPath,
      message: 'FE dev 链了 API 须同时链 UI-xxx（字段绑定 SSOT）。',
    });
  }

  if (/联调卡/i.test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-BAN-联调卡',
      file: relPath,
      message: '禁止链 F 联调卡 → 改链 contracts/UI §字段绑定。',
    });
  }

  if (hasDevFieldMappingTable(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-BAN-映射',
      file: relPath,
      message: 'dev 内禁止字段映射表；映射在 contracts/UI §字段绑定，dev 只链。',
    });
  }

  if (hasLargeJsonPaste(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-COPY-JSON',
      file: relPath,
      message: 'dev 内勿粘贴大段 JSON；请链 contracts/API 或 UI。',
    });
  }

  if (/^## 前置/m.test(content) || /^## 必读/m.test(content) || /^## 契约/m.test(content)) {
    reporter.add({
      severity: 'warn',
      rule: 'DEV-LEGACY-段',
      file: relPath,
      message: '检测到旧段名（前置/必读/契约）；v9.11 请用 摘要/步骤 + 链 sol。',
    });
  }

  // ③ 证据：有 ## 结果 且勾选语境下应有 AC 映射表；有映射时 BE 须出现 test/unit
  const resultBody = extractSectionBody(content, '## 结果');
  if (resultBody && /AC-\d+/i.test(content) && resultBody.length > 20) {
    const hasAcMap =
      /AC\s*映射表/.test(resultBody) ||
      (/\|\s*AC ID\s*\|/i.test(resultBody) && /\|\s*unit\s*\|/i.test(resultBody));
    if (!hasAcMap) {
      reporter.add({
        severity: 'warn',
        rule: 'DEV-AC-MAP',
        file: relPath,
        message: '## 结果 建议含「AC 映射表」（AC ID | unit | ac | 人工）；勾 ③ 前须齐。',
      });
    } else if (!fe && !/test\/unit|unit\//i.test(resultBody)) {
      reporter.add({
        severity: 'warn',
        rule: 'DEV-AC-UNIT',
        file: relPath,
        message: 'BE dev 的 AC 映射表建议含 test/unit 路径（1 AC ↔ 1 UT）。',
      });
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
      message: '缺少代码落点（`Class.method` / `path/`）。',
    });
  }

  const stepsBody = extractSectionBody(content, '## 步骤') ?? '';
  const stepResolved = resolveDevSteps(stepsBody);
  if (content.replace(/\s/g, '').length < tierDef.minDocLength && stepResolved.count < 1) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-FAKE-过短',
      file: relPath,
      message: '文档过短且无步骤（流程表 S1… 或 ####）。',
    });
  }

  runQualityChecks(filePath, content, reporter, relPath, tier);
}

export function validateDev(projectRoot, reporter, opts = {}) {
  if (opts.templateMode) return;
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
      }
    }
    runDevLiteralChecks(file, content, reporter, relPath, tier);
  }
}

export function runDevLiteralCheck(filePath, opts = {}) {
  const content = readText(filePath);
  if (!content) return { passed: false, issues: [{ rule: 'DEV-LIT', message: '文件不存在' }] };

  const projectRoot = resolveProjectRootFromDevFile(filePath);
  if (projectRoot && resolveTemplateMode(projectRoot)) {
    const reporter = new Reporter();
    validateDevFileFromTemplate(projectRoot, filePath, reporter, { tier: opts.tier ?? 'standard' });
    const blocking = reporter.getIssues().filter((i) => i.severity === 'error');
    return {
      passed: blocking.length === 0,
      issues: blocking.map((i) => ({ rule: i.rule, message: i.message })),
    };
  }

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
