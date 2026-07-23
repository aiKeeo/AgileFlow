import path from 'node:path';
import { collectFiles, exists, readText, rel } from '../../fs-utils.mjs';
import { DEV_SECTIONS, RISK_TIERS } from '../../phase-spec.mjs';
import { Reporter } from '../../reporter.mjs';
import { resolveTemplateMode } from '../../template-loader.mjs';
import { isCodeAnchor } from './steps.mjs';
import { validateDevFileFromTemplate } from '../generic-doc.mjs';
import {
  isFeOrMpDev,
  validateNarrativeFlow,
  NarrativeIssueType,
} from './narrative-flow.mjs';

/**
 * dev 阶段校验入口。
 *
 * 本文件职责：把「构思→写码→验收」每个 T 的文档质量，按 v9.11 极简 SSOT 格式做 硬挡。
 * 规则背后意图见同目录 README.md；每个规则报错信息必须含「为什么不过 + 怎么改」。
 *
 * 主要分组：
 * 1. 结构检查（摘要/步骤/结果存在性）；
 * 2. 摘要质量（本T/做/不做/上游/AC）；
 * 3. 步骤质量（步数、流程表/####、用户/系统/改、代码落点）；
 * 4. 链路 SSOT（链 API/UI/UID/F，禁映射表、禁大段 JSON、禁联调卡）；
 * 5. 旧形态清理（旧标题、冗余段、legacy 段名）；
 * 6. 结果验收（AC 映射表、test/unit 证据）。
 */

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

/** 全端统一叙述五段式字面量 */
const LITERAL_REQUIRED_NARRATIVE = [
  { id: 'DEV-LIT-摘要', pattern: '## 摘要', label: '## 摘要' },
  { id: 'DEV-LIT-主流程', pattern: '## 主流程', label: '## 主流程' },
  { id: 'DEV-LIT-边界', pattern: '## 边界', label: '## 边界' },
  { id: 'DEV-LIT-实现说明', pattern: '## 实现说明', label: '## 实现说明' },
];

/** 过短文档 / 旧编号禁形 */
const LITERAL_FORBIDDEN = [
  { pattern: '## 一、目标', rule: 'DEV-BAN-旧标题', msg: '禁形旧标题「## 一、目标」→ 用 ## 摘要' },
  { pattern: '## 五、可执行方案', rule: 'DEV-BAN-旧标题', msg: '禁形「## 五、可执行方案」→ 用 ## 主流程 + ## 实现说明' },
  { pattern: '## ① 构思', rule: 'DEV-BAN-构思章', msg: '禁形「## ① 构思」' },
  { pattern: '## ② 关键实现点', rule: 'DEV-BAN-关键实现点章', msg: '禁形「## ② 关键实现点」' },
];

/** v9.11 禁止的冗余/偷懒专节：归属已收敛到 摘要/步骤/结果 + 链上游 */
const DEV_BANNED_SECTIONS = [
  { heading: '## 范围', rule: 'DEV-BAN-范围', msg: '禁止「## 范围」→ 做/不做并入 ## 摘要' },
  { heading: '## 做法', rule: 'DEV-BAN-做法', msg: '禁止「## 做法」→ 用 主流程+边界+实现说明' },
  { heading: '## 异常', rule: 'DEV-BAN-异常', msg: '禁止「## 异常」→ 并入 ## 边界' },
  { heading: '## AC', rule: 'DEV-BAN-AC', msg: '禁止「## AC」表 → 摘要列 AC ID，步骤引 AC' },
];

/** 「结果」里表示还没真跑 / 打算事后回填的偷懒话术（勾③前一律硬挡） */
const RESULT_DEFERRED_RE =
  /写码后填|写码后补|编码后填|写完再填|事后补|先码后|回填|③\s*后填|勾③后填|验收后填写|待写码|待实现后|稍后写结果/i;

/** 结果占位符（含 deferred） */
const RESULT_PLACEHOLDER_RE =
  /⬜\s*③\s*填|待填|TODO|稍后补充|占位|未验证|未执行|未跑|未启动|写码后填|写码后补|编码后填|写完再填|事后补|先码后|回填|③\s*后填|勾③后填|验收后填写|待写码|待实现后/i;

/**
 * 是否「范围/做法」空壳（先码后补典型形态）
 * @param {string} content
 */
function isScopeDoStub(content) {
  // 中文标题勿用 \b（JS \w 不含汉字，\b 会失效）
  const hasBanShape = /^##\s*范围(\s|$)/m.test(content) || /^##\s*做法(\s|$)/m.test(content);
  const missingSummary = !/^##\s*摘要(\s|$)/m.test(content);
  const missingFlow = !/^##\s*主流程(\s|$)/m.test(content);
  return hasBanShape && (missingSummary || missingFlow);
}

/**  摘要须含的五类 bullet：定位 / 边界 / 上游 / 验收；且 bullet 后必须有实质内容 */
const SUMMARY_BULLETS = [
  { id: '本T', pattern: /-\s*\*\*本\s*T\*\*[：:]\s*\S/ },
  { id: '做', pattern: /-\s*\*\*做\*\*[：:]\s*\S/ },
  { id: '不做', pattern: /-\s*\*\*不做\*\*[：:]\s*\S/ },
  { id: '上游', pattern: /-\s*\*\*上游\*\*[：:]\s*\S/ },
  { id: 'AC', pattern: /-\s*\*\*AC\*\*[：:]\s*\S/ },
];

/**
 * 校验 todo 中的每个 T 是否都有独立 dev 文件，且 dev/ 下无非法文件
 * @param {string} projectRoot
 * @param {Reporter} reporter
 */
function validateDevFileCoverage(projectRoot, reporter) {
  const todoPath = path.join(projectRoot, 'atlas', 'todo.md');
  const todo = readText(todoPath) || '';
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  const devFiles = collectFiles(devRoot, '.md');

  // 从 todo 提取 T 头
  const tHeaders = [...todo.matchAll(/^#{3,4}\s+(T-\d+)[：:\s].*/gm)].map((m) => ({
    id: m[1],
    line: todo.slice(0, m.index).split('\n').length,
  }));

  if (tHeaders.length === 0) return;

  // 每个 T 必须对应一个 dev/T-xxx-*.md
  for (const header of tHeaders) {
    const tId = header.id;
    const hasDevFile = devFiles.some((f) => {
      const base = path.basename(f, '.md');
      return base.startsWith(`${tId}-`) || base === tId;
    });
    if (!hasDevFile) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-COVERAGE-缺T文件',
        file: 'atlas/todo.md',
        line: header.line,
        message: `${tId} 在 todo 中已展开，但缺少对应 atlas/dev/${tId}-*.md 文件。禁止把多个 T 合写进一个 dev 文件。`,
      });
    }
  }

  // dev/ 下非 README/temp 文件必须命名 T-xxx-*.md，且必须对应 todo 中的 T
  for (const file of devFiles) {
    const base = path.basename(file);
    if (base === 'README.md' || base.startsWith('temp')) continue;
    const relPath = rel(projectRoot, file);

    if (!/^T-\d+-.+\.md$/.test(base)) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-COVERAGE-非法文件名',
        file: relPath,
        message: `dev 文件 ${base} 命名非法：须为 T-xxx-描述-端.md（如 T-001-login-BE.md）。禁止在 dev/ 放 todo/汇总/草稿文件。`,
      });
      continue;
    }

    const tIdMatch = base.match(/^(T-\d+)/);
    if (!tIdMatch) continue;
    const tId = tIdMatch[1];
    const hasHeader = tHeaders.some((h) => h.id === tId);
    if (!hasHeader) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-COVERAGE-孤儿T文件',
        file: relPath,
        message: `${base} 找不到对应 todo 中的 ${tId} 头；禁止 dev 文件数超过 todo T 数。`,
      });
    }
  }
}

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
  return isFeOrMpDev(filePath, content);
}

function getDevSectionsForFile() {
  return DEV_SECTIONS;
}

function getLiteralRequired() {
  return LITERAL_REQUIRED_NARRATIVE;
}

/** 禁止旧 ## 步骤（全端） */
function checkBannedLegacySteps(content, reporter, relPath) {
  if (headingRegex('## 步骤').test(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-BAN-步骤',
      file: relPath,
      message: '禁「## 步骤」旧格式；须用 ## 主流程 + ## 边界 + ## 实现说明。',
    });
  }
}

function hasCodeAnchor(content) {
  return isCodeAnchor(content);
}

function checkFakeHeadings(content) {
  const hasMd = /^## (摘要|步骤|结果|主流程|边界|实现说明)/m.test(content);
  const hasPlain = /^(范围|步骤|摘要)[：:\s]/m.test(content);
  return !hasMd && hasPlain;
}


/** dev 内禁止大段字段映射表（应在 contracts/UI）
 * 只根据表格表头识别真正的字段映射表，不凭关键词误杀引用说明。
 */
function hasDevFieldMappingTable(filePath, content) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map((s) => s.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    const headerText = cells.join(' ');
    const hasFieldCol = /(?:^|\s)(字段|页面字段|请求字段|接口字段|后端字段)(?:\s|$)/.test(headerText);
    const hasMapCol = /(?:^|\s)(映射|后端字段|接口字段|响应字段|请求参数)(?:\s|$)/.test(headerText);

    if (hasFieldCol && hasMapCol) return true;

    // FE dev 的 ### 映射 小节，下面紧跟字段表
    if (i > 0 && isFeDev(filePath, content) && /### 映射/.test(lines[i - 1] || '') && hasFieldCol) {
      return true;
    }
  }
  return false;
}

/** 大段 JSON 粘贴：契约 JSON 应存在 contracts/API，dev 只链
 * 只触发真正像 JSON 的代码块（含多个 "key": 键值对），排除 TS/JS 代码、bash 输出、日志。
 */
function hasLargeJsonPaste(content) {
  const blocks = [...content.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/gi)];
  for (const block of blocks) {
    const body = block[1] || '';
    if (body.length < 80) continue;
    if (!body.includes('{') || !body.includes('}')) continue;

    // 排除常见非 JSON 代码块：TS/JS 关键字、bash 命令、日志行
    if (/^\s*(function|class|interface|type|enum|const|let|var|export|import|#)\b/m.test(body)) continue;
    if (/^\s*\$/m.test(body)) continue;
    if (/^\s*\[\d{4}-\d{2}-\d{2}/m.test(body) || /\bERROR\b|\bWARN\b/.test(body)) continue;

    // 要求至少 2 个双引号键值对，才视为粘贴 JSON 契约
    const keyValuePairs = [...body.matchAll(/"[^"\n]+"\s*:/g)].length;
    if (keyValuePairs >= 2) {
      return true;
    }
  }
  return false;
}

function hasSummary定位(content) {
  const summary = extractSectionBody(content, '## 摘要');
  if (!summary) return false;
  // 须模板字面量 **本 T**：+ 非空实质（禁「本T：」无加粗 / 空值）
  return /-\s*\*\*本\s*T\*\*[：:]\s*\S/.test(summary);
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

/**
 * @param {string} filePath
 * @param {string} content
 * @param {import('../../reporter.mjs').Reporter} reporter
 * @param {string} relPath
 * @param {{ stage?: 'step1'|'complete' }} [opts]
 */
function runQualityChecks(filePath, content, reporter, relPath, opts = {}) {
  const stage = opts.stage ?? 'complete';
  const tierDef = RISK_TIERS.full;

  if (isScopeDoStub(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-STUB-先码后补',
      file: relPath,
      message:
        '检测到「## 范围/做法」空壳：须先写「## 摘要」+「## 主流程+边界+实现说明」再写码；禁止写码后再回填构思。「## 结果」才是写码后填证据。',
    });
  }

  checkBannedDevSections(content, reporter, relPath);
  checkBannedLegacySteps(content, reporter, relPath);

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
      message: '「## 摘要」须含 **本 T** / **做** / **不做** / **上游** / **AC** 五类 bullet。',
    });
  }

  const narrativeRuleMap = {
    [NarrativeIssueType.FLOW_ENTRY]: 'DEV-FLOW-入口',
    [NarrativeIssueType.FLOW_MIN]: 'DEV-FLOW-最少',
    [NarrativeIssueType.FLOW_MAX]: 'DEV-FLOW-最多',
    [NarrativeIssueType.FLOW_ANCHOR]: 'DEV-FLOW-落点',
    [NarrativeIssueType.EDGE_EMPTY]: 'DEV-EDGE-存在',
    [NarrativeIssueType.EDGE_MIN]: 'DEV-EDGE-最少',
    [NarrativeIssueType.EDGE_HOOK]: 'DEV-EDGE-挂钩',
    [NarrativeIssueType.EDGE_HANDLE]: 'DEV-EDGE-处理',
    [NarrativeIssueType.IMPL_BLOCK]: 'DEV-IMPL-块',
    [NarrativeIssueType.IMPL_FIELDS]: 'DEV-IMPL-字段',
    [NarrativeIssueType.IMPL_HOWTO]: 'DEV-IMPL-怎么做',
    [NarrativeIssueType.IMPL_HOWTO_SEM]: 'DEV-IMPL-怎么做语义',
    [NarrativeIssueType.IMPL_ANCHOR]: 'DEV-IMPL-落点',
    [NarrativeIssueType.DO_ALIGN]: 'DEV-DO-对齐',
  };
  for (const issue of validateNarrativeFlow(content)) {
    reporter.add({
      severity: 'error',
      rule: narrativeRuleMap[issue.type] ?? 'DEV-NARRATIVE',
      file: relPath,
      message: issue.message,
    });
  }

  const fe = isFeDev(filePath, content);
  if (!hasSolLink(content, fe)) {
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

  if (hasDevFieldMappingTable(filePath, content)) {
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
      severity: 'error',
      rule: 'DEV-LEGACY-段',
      file: relPath,
      message: '检测到旧段名（前置/必读/契约）；须用 摘要/主流程/边界/实现说明/结果 + 链 sol。',
    });
  }

  const resultBody = extractSectionBody(content, '## 结果');

  // 构思闸门①：允许结果空/「③后填」；禁止用「写码后填」掩盖未写摘要步骤
  if (stage === 'step1') {
    if (resultBody && RESULT_DEFERRED_RE.test(resultBody) && isScopeDoStub(content)) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-STUB-结果后填',
        file: relPath,
        message: '「写码后填」只能用于「## 结果」证据；摘要/主流程/边界/实现说明必须先写满。当前仍是范围/做法空壳。',
      });
    }
    return;
  }

  // ③ / 全量：结果不能是空壳/占位/写码后填；须含实际命令 + 通过痕迹
  if (resultBody) {
    if (RESULT_PLACEHOLDER_RE.test(resultBody) || RESULT_DEFERRED_RE.test(resultBody)) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-RESULT-PLACEHOLDER',
        file: relPath,
        message:
          '## 结果 含占位/「写码后填」类话术；勾③前须真跑并写入命令+exit0/✅/PASS。构思须在①用摘要+主流程+边界+实现说明先写完，禁止事后回填设计。',
      });
    } else {
      const hasCommand =
        /`[^`]+(npm|yarn|pnpm|mvn|gradle|python|node|go|cargo|curl|docker|kubectl|make|cmake|gcc|javac|pytest|jest|vitest|unit|test)[^`]*`/i.test(resultBody) ||
        /^\s*[\$>]\s*.+/m.test(resultBody) ||
        /(npm|yarn|pnpm|mvn|gradle|python|node|go|cargo|curl|docker|kubectl|make|cmake|gcc|javac|pytest|jest|vitest)\s+/i.test(resultBody);
      const hasPass = /exit\s*0|✅|通过|PASS|\bUP\b|成功|ok\b/i.test(resultBody);
      if (!hasCommand || !hasPass) {
        reporter.add({
          severity: 'error',
          rule: 'DEV-RESULT-EVIDENCE',
          file: relPath,
          message: '## 结果 须含实际执行命令 + 通过痕迹（exit 0 / ✅ / PASS / UP 等）；禁止只写表头或空表格。',
        });
      }
    }
  }

}

/**
 * ③ 语境：可运行证据已齐时硬挡 AC 映射表（不进勾①字面量闸门）
 */
function runAcEvidenceChecks(filePath, content, reporter, relPath) {
  const resultBody = extractSectionBody(content, '## 结果');
  if (!resultBody || !/AC-\d+/i.test(content)) return;

  if (RESULT_PLACEHOLDER_RE.test(resultBody) || RESULT_DEFERRED_RE.test(resultBody)) return;

  const hasCommand =
    /`[^`]+(npm|yarn|pnpm|mvn|gradle|python|node|go|cargo|curl|docker|kubectl|make|cmake|gcc|javac|pytest|jest|vitest|unit|test)[^`]*`/i.test(
      resultBody,
    ) ||
    /^\s*[\$>]\s*.+/m.test(resultBody) ||
    /(npm|yarn|pnpm|mvn|gradle|python|node|go|cargo|curl|docker|kubectl|make|cmake|gcc|javac|pytest|jest|vitest)\s+/i.test(
      resultBody,
    );
  const hasPass = /exit\s*0|✅|通过|PASS|\bUP\b|成功|ok\b/i.test(resultBody);
  if (!hasCommand || !hasPass) return;

  const fe = isFeDev(filePath, content);
  const hasAcMap =
    /AC\s*映射表/.test(resultBody) ||
    (/\|\s*AC(?:\s*ID)?\s*\|/i.test(resultBody) &&
      /\|\s*[^|\n]*(?:unit|验证|方法|方式|test|人工|manual|冒烟|smoke|ut|it)[^|\n]*\s*\|/i.test(resultBody));
  if (!hasAcMap) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-AC-MAP',
      file: relPath,
      message: '## 结果 已有可运行证据时须含「AC 映射表」（AC ID | unit | ac | 人工）。',
    });
  } else if (!fe && !/test\/unit|unit\/|src\/test\//i.test(resultBody)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-AC-UNIT',
      file: relPath,
      message: 'BE dev 的 AC 映射表须含 test/unit 或 src/test/ 路径（1 AC ↔ 1 UT）。',
    });
  }
}

/**
 * @param {string} filePath
 * @param {string} content
 * @param {import('../../reporter.mjs').Reporter} reporter
 * @param {string} relPath
 * @param {{ stage?: 'step1'|'complete' }} [opts]
 */
function runDevLiteralChecks(filePath, content, reporter, relPath, opts = {}) {
  const tierDef = RISK_TIERS.full;
  const stage = opts.stage ?? 'complete';

  // 摘要/步骤字面量必有（FE 叙述式：主流程+边界+实现说明）
  for (const item of getLiteralRequired()) {
    if (!content.includes(item.pattern)) {
      reporter.add({
        severity: 'error',
        rule: item.id,
        file: relPath,
        message: `缺少「${item.label}」（①前必须写完；禁止范围/做法空壳 + 写码后回填）。`,
      });
    }
  }
  for (const ban of LITERAL_FORBIDDEN) {
    if (content.includes(ban.pattern)) {
      reporter.add({ severity: 'error', rule: ban.rule, file: relPath, message: ban.msg });
    }
  }

  if (tierDef.fakeHeadingCheck && checkFakeHeadings(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-FAKE-标题',
      file: relPath,
      message: '假标题（纯文本无 ##）。',
    });
  }

  if (!hasCodeAnchor(content)) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-LIT-代码落点',
      file: relPath,
      message: '缺少代码落点（`Class.method` / `path/`）。',
    });
  }

  const narrativeSteps = (extractSectionBody(content, '## 主流程') ?? '').match(/^\d+\.\s+\S/gm)?.length ?? 0;
  const hasEnoughSteps = narrativeSteps >= 1;

  if (content.replace(/\s/g, '').length < tierDef.minDocLength && !hasEnoughSteps) {
    reporter.add({
      severity: 'error',
      rule: 'DEV-FAKE-过短',
      file: relPath,
      message: '文档过短且无主流程编号步骤。',
    });
  }

  runQualityChecks(filePath, content, reporter, relPath, { stage });
}

export function validateDev(projectRoot, reporter, opts = {}) {
  if (opts.templateMode) return;
  const devRoot = path.join(projectRoot, 'atlas', 'dev');
  if (!exists(devRoot)) return;

  validateDevFileCoverage(projectRoot, reporter);

  for (const file of collectFiles(devRoot, '.md')) {
    const content = readText(file);
    if (!content) continue;
    const relPath = rel(projectRoot, file);
    const baseName = path.basename(file);
    if (baseName === 'README.md' || baseName.startsWith('temp')) continue;

    if (/顺序：⚠️ 先码后文档/.test(content) || /先码后补|事后补写构思|写码后回填构思/i.test(content)) {
      reporter.add({
        severity: 'error',
        rule: 'DEV-A005',
        file: relPath,
        message: '事后补写/先码后补构思无效。须①先过摘要+主流程+边界+实现说明闸门再写码。',
      });
    }

    const tierDef = RISK_TIERS.full;
    const sections = getDevSectionsForFile();
    for (const sec of sections) {
      if (!headingRegex(sec.heading).test(content)) {
        reporter.add({
          severity: 'error',
          rule: `DEV-SEC-${sec.id}`,
          file: relPath,
          message: `缺少「${sec.heading}」。`,
        });
      }
    }
    runDevLiteralChecks(file, content, reporter, relPath, { stage: 'complete' });
    runAcEvidenceChecks(file, content, reporter, relPath);
  }
}

export function runDevLiteralCheck(filePath, opts = {}) {
  const content = readText(filePath);
  if (!content) return { passed: false, issues: [{ rule: 'DEV-LIT', message: '文件不存在' }] };

  const projectRoot = resolveProjectRootFromDevFile(filePath);
  if (projectRoot && resolveTemplateMode(projectRoot)) {
    const reporter = new Reporter();
    validateDevFileFromTemplate(projectRoot, filePath, reporter);
    const blocking = reporter.getIssues().filter((i) => i.severity === 'error' || i.severity === 'warn');
    return {
      passed: blocking.length === 0,
      issues: blocking.map((i) => ({ rule: i.rule, message: i.message })),
    };
  }

  const reporter = new Reporter();
  const relPath = filePath;
  const stage = opts.stage ?? 'step1';

  const sections = getDevSectionsForFile(filePath, content);
  for (const sec of sections) {
    // ① 允许尚无实质结果，但仍须有「## 结果」标题（可写「③后填」）
    if (!headingRegex(sec.heading).test(content)) {
      reporter.add({
        severity: 'error',
        rule: `DEV-SEC-${sec.id}`,
        file: relPath,
        message: `缺少「${sec.heading}」。`,
      });
    }
  }
  runDevLiteralChecks(filePath, content, reporter, relPath, { stage });

  const blocking = reporter.getIssues().filter((i) => i.severity === 'error' || i.severity === 'warn');
  return {
    passed: blocking.length === 0,
    issues: blocking.map((i) => ({ rule: i.rule, message: i.message })),
  };
}

export const runA7Grep = runDevLiteralCheck;
